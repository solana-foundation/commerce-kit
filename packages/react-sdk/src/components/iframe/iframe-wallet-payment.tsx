import React from 'react';
import type { ThemeConfig, MerchantConfig, Currency } from '../../types';
import { MerchantAddressPill } from '../tip-modal/merchant-address-pill';
import { Spinner } from '../../../../connector-kit/src/ui/spinner';
import { TransactionSuccess, TransactionError } from '../transaction-states';

interface WalletPaymentContentProps {
    theme: Required<ThemeConfig>;
    config: { merchant: MerchantConfig; rpcUrl?: string; debug?: boolean };
    selectedAmount: number;
    selectedCurrency: Currency;
    customAmount: string;
    showCustomInput: boolean;
    onPaymentComplete: () => void;
    onTransactionSuccess?: () => void;
    onTransactionError?: () => void;
    onTransactionReset?: () => void;
    walletIcon: React.ReactNode;
}

type IFrameWalletInfo = { name: string; icon?: string; installed: boolean; connectable?: boolean };

// Safe fallback wallet icon (base64 encoded generic wallet SVG)
const FALLBACK_WALLET_ICON =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIgOEMyIDYuODk1NDMgMi44OTU0MyA2IDQgNkgyMEMyMS4xMDQ2IDYgMjIgNi44OTU0MyAyMiA4VjE2QzIyIDE3LjEwNDYgMjEuMTA0NiAxOCAyMCAxOEg0QzIuODk1NDMgMTggMiAxNy4xMDQ2IDIgMTZWOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik02IDEwSDEwVjE0SDZWMTBaIiBmaWxsPSIjNjM2NkYxIi8+Cjwvc3ZnPgo=';

/**
 * Validates that a URL is safe for use as an icon source
 * @param iconUrl - The URL to validate
 * @returns true if the URL is safe to use
 */
function isValidIconUrl(iconUrl: string): boolean {
    if (!iconUrl || typeof iconUrl !== 'string') return false;

    try {
        const url = new URL(iconUrl);

        // Allow HTTPS URLs
        if (url.protocol === 'https:') {
            return true;
        }

        // Allow data URLs with explicit image MIME types
        if (url.protocol === 'data:') {
            const parts = url.pathname.split(';');
            if (parts.length === 0) return false;
            const mediaType = parts[0];
            if (!mediaType) return false;

            const validImageTypes = [
                'image/png',
                'image/jpg',
                'image/jpeg',
                'image/gif',
                'image/svg+xml',
                'image/webp',
                'image/bmp',
                'image/ico',
            ];
            return validImageTypes.includes(mediaType);
        }

        // Reject all other protocols (http:, javascript:, etc.)
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Validates and sanitizes wallet data from untrusted sources
 * @param rawWallets - The raw wallet data from window.__IFRAME_WALLETS__
 * @param debug - Whether to show debug logs
 * @returns Array of validated and sanitized wallet objects
 */
function validateAndSanitizeWallets(rawWallets: unknown, debug?: boolean): IFrameWalletInfo[] {
    // First check: ensure it's an array
    if (!Array.isArray(rawWallets)) {
        if (debug) {
            console.warn('__IFRAME_WALLETS__ is not an array, ignoring wallet data');
        }
        return [];
    }

    const validatedWallets: IFrameWalletInfo[] = [];

    for (let i = 0; i < rawWallets.length; i++) {
        const wallet = rawWallets[i];

        // Check if wallet is an object
        if (!wallet || typeof wallet !== 'object') {
            if (debug) {
                console.warn(`Wallet at index ${i} is not an object, skipping`);
            }
            continue;
        }

        // Extract and validate required fields
        const name = typeof wallet.name === 'string' ? wallet.name.trim() : '';

        // Wallet must have a non-empty name
        if (!name) {
            if (debug) {
                console.warn(`Wallet at index ${i} missing or invalid name, skipping`);
            }
            continue;
        }

        // Validate and sanitize icon URL
        let icon: string | undefined;
        if (wallet.icon && typeof wallet.icon === 'string') {
            const iconUrl = wallet.icon.trim();
            if (isValidIconUrl(iconUrl)) {
                icon = iconUrl;
            } else {
                if (debug) {
                    console.warn(`Wallet "${name}" has invalid/unsafe icon URL, using fallback: ${iconUrl}`);
                }
                icon = FALLBACK_WALLET_ICON;
            }
        } else if (wallet.icon !== undefined) {
            if (debug) {
                console.warn(`Wallet "${name}" has non-string icon value, using fallback`);
            }
            icon = FALLBACK_WALLET_ICON;
        }
        // If icon is undefined, we'll use the fallback during rendering

        // Extract other fields with safe defaults
        const installed = typeof wallet.installed === 'boolean' ? wallet.installed : false;
        const connectable = typeof wallet.connectable === 'boolean' ? wallet.connectable : undefined;

        // Add validated wallet
        validatedWallets.push({
            name,
            icon,
            installed,
            connectable,
        });
    }

    if (debug) {
        console.log(`Validated ${validatedWallets.length} out of ${rawWallets.length} wallet entries`);
    }
    return validatedWallets;
}

export const WalletPaymentContent = ({
    theme,
    config,
    selectedAmount,
    selectedCurrency,
    customAmount,
    showCustomInput,
    onPaymentComplete,
    onTransactionSuccess,
    onTransactionError,
    onTransactionReset,
    walletIcon,
}: WalletPaymentContentProps) => {
    const [wallets, setWallets] = React.useState<IFrameWalletInfo[]>([]);
    const [connecting, setConnecting] = React.useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = React.useState(false);
    const [paymentError, setPaymentError] = React.useState(false);
    const [paymentSignature, setPaymentSignature] = React.useState<string | null>(null);
    const [parentOrigin, setParentOrigin] = React.useState<string | null>(null);
    const mountedRef = React.useRef(false);

    const displayAmount = showCustomInput ? customAmount || '0' : selectedAmount.toString();

    // Automatically detect parent origin - no manual configuration needed

    // Automatically detect parent origin from multiple sources
    const detectParentOrigin = React.useCallback(() => {
        // Method 1: Use document.referrer (most reliable for iframes)
        if (document.referrer) {
            try {
                const referrerUrl = new URL(document.referrer);
                return referrerUrl.origin;
            } catch (e) {
                // Note: This function doesn't have access to config, so we can't make this debug-conditional
                // Consider moving this to the component level if debug logging is needed
                console.warn('Invalid referrer URL:', document.referrer);
            }
        }

        // Method 2: Try to access parent location (may fail due to same-origin policy)
        try {
            if (window.parent && window.parent !== window) {
                return window.parent.location.origin;
            }
        } catch (e) {
            // Expected to fail for cross-origin iframes
        }

        // Method 3: Check ancestorOrigins if available (Webkit browsers)
        if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
            return window.location.ancestorOrigins[0];
        }

        return null;
    }, []);

    // Validate that an origin is a proper HTTP/HTTPS origin or "null" for srcDoc iframes
    const isValidOrigin = React.useCallback((origin: string) => {
        // Allow "null" origin for srcDoc iframes
        if (origin === 'null') {
            return true;
        }
        
        try {
            const url = new URL(origin);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }, []);

    React.useEffect(() => {
        mountedRef.current = true;

        // Automatically detect and set parent origin
        const detectedOrigin = detectParentOrigin();
        if (detectedOrigin && isValidOrigin(detectedOrigin)) {
            setParentOrigin(detectedOrigin);
        }
        
        // For srcDoc iframes, we might not be able to detect the parent origin directly
        // In this case, we'll trust the first valid message we receive
        if (!detectedOrigin || detectedOrigin === 'null') {
            if (config.debug) {
                console.log('[iframe-wallet-payment] Running in srcDoc context, will detect parent origin from messages');
            }
        }

        // Read wallets provided by parent via init message and validate them
        const rawWallets = (window as any).__IFRAME_WALLETS__;
        const validatedWallets = validateAndSanitizeWallets(rawWallets, config.debug);
        setWallets(validatedWallets);

        function onMessage(e: MessageEvent) {
            const data = e.data as any;
            if (!data || typeof data !== 'object') return;

            // Validate message origin
            if (!isValidOrigin(e.origin)) {
                if (config.debug) {
                    console.warn(`Rejected message from invalid origin: ${e.origin}`);
                }
                return;
            }

            // If we don't have a parent origin yet, use this validated origin
            // Otherwise, ensure the message comes from the expected parent
            // Special handling: if we're in a srcDoc iframe (origin null), be more permissive
            const isInSrcDoc = window.location.origin === 'null';
            
            if (!parentOrigin) {
                // For srcDoc iframes, accept the first valid HTTP/HTTPS origin we receive
                if (isInSrcDoc && e.origin !== 'null') {
                    setParentOrigin(e.origin);
                } else if (!isInSrcDoc) {
                    setParentOrigin(e.origin);
                }
            } else if (parentOrigin !== e.origin) {
                // For srcDoc iframes, be more permissive about origin mismatches
                if (!isInSrcDoc) {
                    if (config.debug) {
                        console.warn(`Rejected message from mismatched origin. Expected: ${parentOrigin}, Got: ${e.origin}`);
                    }
                    return;
                }
            }

            if (data.type === 'walletConnectResult') {
                if (!mountedRef.current) return;
                if (data.success) {
                    setConnecting(null);
                    setProcessingPayment(data.walletName || 'wallet');
                    setError(null);
                    // Don't call onPaymentComplete yet - wait for actual payment result
                } else {
                    setConnecting(null);
                    setProcessingPayment(null);
                    setError(data.error || 'Failed to connect wallet');
                }
            } else if (data.type === 'paymentSuccess') {
                if (!mountedRef.current) return;
                setConnecting(null);
                setProcessingPayment(null);
                setError(null);
                setPaymentError(false);
                setPaymentSuccess(true);
                setPaymentSignature(data.signature || null);

                // Notify parent component about transaction success
                onTransactionSuccess?.();

                // Keep modal open, just show success state
            } else if (data.type === 'paymentError') {
                if (!mountedRef.current) return;
                setConnecting(null);
                setProcessingPayment(null);
                setError(null);
                setPaymentError(true);
                setPaymentSuccess(false);

                // Notify parent component about transaction error
                onTransactionError?.();
            }
        }
        window.addEventListener('message', onMessage);
        return () => {
            mountedRef.current = false;
            window.removeEventListener('message', onMessage);
        };
    }, [onPaymentComplete, detectParentOrigin, isValidOrigin, parentOrigin]);

    function requestConnect(walletName: string) {
        setError(null);

        // Validate that we have a parent origin before proceeding
        // For srcDoc iframes, we might not have parentOrigin detected yet, so be more permissive
        const isInSrcDoc = window.location.origin === 'null';
        if (!parentOrigin && !isInSrcDoc) {
            setError(
                'Unable to connect: Cannot determine parent origin. Please ensure this component is properly embedded.',
            );
            return;
        }

        // Validate custom amount if custom input is being used
        let amountValue: number;
        if (showCustomInput) {
            const parsed = parseFloat(customAmount || '0');
            if (!Number.isFinite(parsed) || parsed < 0) {
                setError('Please enter a valid positive number for the amount.');
                return;
            }
            amountValue = parsed;
        } else {
            amountValue = selectedAmount;
        }

        setConnecting(walletName);
        try {
            // Calculate the payment amount to send to parent
            // Use '*' for srcDoc iframes since origin detection may fail
            const targetOrigin = isInSrcDoc ? '*' : (parentOrigin || '*');
            
            window.parent.postMessage(
                {
                    type: 'walletConnect',
                    walletName,
                    amount: amountValue,
                    currency: selectedCurrency,
                },
                targetOrigin,
            );
        } catch (e: any) {
            setConnecting(null);
            setError(e?.message || 'Failed to request wallet connect');
        }
    }

    const showEmptyState = wallets.length === 0;

    // Show failure state if payment failed
    if (paymentError) {
        return (
            <TransactionError
                theme={theme}
                config={config}
                selectedCurrency={selectedCurrency}
                displayAmount={displayAmount}
                error={error || 'Payment failed'}
                onRetry={() => {
                    setPaymentError(false);
                    setProcessingPayment(null);
                    setError(null);
                    // Notify parent component about transaction reset
                    onTransactionReset?.();
                }}
            />
        );
    }

    // Show success state if payment succeeded
    if (paymentSuccess) {
        return (
            <TransactionSuccess
                theme={theme}
                config={config}
                selectedCurrency={selectedCurrency}
                displayAmount={displayAmount}
                signature={paymentSignature || undefined}
            />
        );
    }

    return (
        <div className="ck-wallet-container">
            {/* Payment Info - Same as QR Payment */}
            <h2 className="ck-payment-info" style={{ color: theme.textColor }}>
                <span className="ck-payment-amount-dim">Send</span> ${displayAmount} {selectedCurrency}
            </h2>

            {/* Merchant Address Pill */}
            <MerchantAddressPill theme={theme} config={config} copiedText="Address Copied!" />

            {/* Wallet selection instruction */}
            <div className="ck-wallet-instruction-text" style={{ color: `${theme.textColor}90` }}>
                Select one of your available wallets to complete the payment
            </div>

            {error ? <div className="ck-wallet-error">{error}</div> : null}

            {showEmptyState ? (
                <div className="ck-wallet-no-wallets">
                    <div className="ck-wallet-no-wallets-title">No wallets detected</div>
                    <div className="ck-wallet-no-wallets-subtitle">
                        Install a Solana wallet (e.g., Phantom, Backpack) and try again.
                    </div>
                </div>
            ) : (
                <div className="ck-wallet-list">
                    {wallets.map(w => (
                        <div key={w.name} className="ck-wallet-item">
                            <div className="ck-wallet-info">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={w.icon || FALLBACK_WALLET_ICON} alt={w.name} className="ck-wallet-icon" />
                                <div>
                                    <div className="ck-wallet-name">{w.name}</div>
                                    <div className="ck-wallet-status">
                                        {connecting === w.name
                                            ? 'Connecting…'
                                            : processingPayment === w.name
                                              ? ''
                                              : w.installed
                                                ? 'Installed'
                                                : 'Not installed'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => requestConnect(w.name)}
                                disabled={Boolean(connecting) || Boolean(processingPayment) || w.connectable === false}
                                className="ck-wallet-connect-button"
                                style={{
                                    opacity:
                                        (connecting && connecting !== w.name) ||
                                        (processingPayment && processingPayment !== w.name)
                                            ? 0.7
                                            : 1,
                                }}
                            >
                                {connecting === w.name ? (
                                    'Connecting…'
                                ) : processingPayment === w.name ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Spinner size={16} color="currentColor" />
                                    </div>
                                ) : (
                                    'Connect'
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

WalletPaymentContent.displayName = 'IframeWalletPaymentContent';
