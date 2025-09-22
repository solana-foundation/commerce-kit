'use client';

import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConnectorClient, AppProvider, useConnectorClient } from '@solana-commerce/connector-kit';

import { useTransferSOL, useTransferToken, useArcClient, address } from '@solana-commerce/solana-hooks';

type Address = ReturnType<typeof address>;
import type { SolanaCommerceConfig, ThemeConfig } from '../../types';

// Local type definitions (not exported from main package)
interface TransferSOLOptions {
    to: string | Address;
    amount: bigint;
    from?: string | Address;
}

interface TransferSOLResult {
    signature: string;
}

interface TransferTokenOptions {
    mint: string | Address;
    to: string | Address;
    amount: bigint;
    from?: string | Address;
    createAccountIfNeeded?: boolean;
}

interface TransferTokenResult {
    signature: string;
}
import { IFRAME_BUNDLE } from '../../iframe-app/bundle';
import { IFRAME_STYLES } from '../../iframe-app/bundle';
import { fetchSolPrice, convertUsdToLamports } from '../../utils';
import { STABLECOINS } from '@solana-commerce/headless-sdk/src/types/stablecoin';

/**
 * Product configuration for cart and buyNow modes
 */
export interface Product {
    /** Product identifier */
    id: string;
    /** Product name/title */
    name: string;
    /** Price per unit in USD */
    price?: number;
    /** Unit amount in USD (alternative to price field) */
    unitAmount?: number;
    /** Quantity of this product */
    quantity: number;
    /** Optional product description */
    description?: string;
}

/**
 * Configuration for payment calculations with price and decimal overrides
 *
 * @example
 * ```typescript
 * const paymentConfig: PaymentConfig = {
 *   // Fixed SOL price for testing or special environments
 *   solPriceUsd: 150.50,
 *
 *   // Custom token decimals for non-standard tokens
 *   tokenDecimals: {
 *     'CUSTOM_TOKEN': 8,
 *     'USDC': 6  // Can override defaults
 *   },
 *
 *   // Fallback if price API fails and cache is empty
 *   fallbackSolPriceUsd: 100,
 *
 *   // Products for cart/buyNow modes
 *   products: [
 *     { id: '1', name: 'Item 1', price: 10.00, quantity: 2 },
 *     { id: '2', name: 'Item 2', unitAmount: 5.50, quantity: 1 }
 *   ]
 * };
 * ```
 */
export interface PaymentConfig {
    /** Fixed SOL price override (USD). If not provided, fetches from price oracle */
    solPriceUsd?: number;
    /** Token decimals override. If not provided, uses known token configurations */
    tokenDecimals?: { [currency: string]: number };
    /** Fallback SOL price if API fails and no cache available */
    fallbackSolPriceUsd?: number;
    /** Products array for cart and buyNow modes */
    products?: Product[];
}

interface SecureIframeShellProps {
    config: SolanaCommerceConfig;
    theme: Required<ThemeConfig>;
    onPayment: (amount: number, currency: string) => void;
    onCancel: () => void;
    /** Optional payment configuration for price and decimal overrides */
    paymentConfig?: PaymentConfig;
}

// Token mint addresses for different networks
const TOKEN_MINTS = {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
    USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Mainnet USDT
    USDT_DEVNET: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS', // Devnet USDT
} as const;

/**
 * Secure iframe shell using srcDoc + postMessage (no allow-same-origin).
 * Renders the full modal UI inside the iframe and communicates with parent.
 *
 * NOTE: This component expects to be wrapped in AppProvider by the parent.
 */
export function SecureIframeShell({ config, theme, onPayment, onCancel, paymentConfig }: SecureIframeShellProps) {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    // Force mainnet for testing with real USDC
    const rpcUrl = config.rpcUrl || 'https://api.mainnet-beta.solana.com';
    const network = 'mainnet';

    // Get the connector from AppProvider context
    const connectorClient = useConnectorClient();

    console.log('[SecureIframeShell] ConnectorClient from context:', {
        hasClient: !!connectorClient,
        connected: connectorClient?.getSnapshot?.()?.connected,
        selectedWallet: connectorClient?.getSnapshot?.()?.selectedWallet?.name,
    });

    if (!connectorClient) {
        return <div>Loading connector...</div>;
    }

    // Handle cancel with wallet disconnection
    const handleCancel = async () => {
        // Disconnect wallet before closing modal to prevent auto-reconnect
        if (connectorClient) {
            try {
                await connectorClient.disconnect();
                if (process.env.NODE_ENV !== 'production') {
                    console.log('[SecureIframeShell] Wallet disconnected on modal close');
                }
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('[SecureIframeShell] Failed to disconnect wallet on close:', error);
                }
            }
        }
        onCancel();
    };

    // ArcProvider is now at the root level - no need to create another one here
    return (
        <SecureIframeShellInner
            config={config}
            theme={theme}
            onPayment={onPayment}
            onCancel={handleCancel}
            paymentConfig={paymentConfig}
        />
    );
}

interface SecureIframeShellInnerProps extends SecureIframeShellProps {}

function SecureIframeShellInner({ config, theme, onPayment, onCancel, paymentConfig }: SecureIframeShellInnerProps) {
    // Use the ConnectorClient from context
    const connectorClient = useConnectorClient();

    console.log('[SecureIframeShellInner] ConnectorClient from context:', {
        hasClient: !!connectorClient,
        connected: connectorClient?.getSnapshot?.()?.connected,
    });

    if (!connectorClient) {
        return <div>Loading connector...</div>;
    }
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [height, setHeight] = useState<number>(400);
    const [ready, setReady] = useState(false);

    // Use the standard transfer hooks at component level (not in async functions)
    const { transferSOL, isLoading: transferSOLLoading, error: transferSOLError } = useTransferSOL();
    const { transferToken, isLoading: transferTokenLoading, error: transferTokenError } = useTransferToken();

    // Debug: Check ArcClient state - now using the fixed ArcProvider
    const arcClient = useArcClient();
    console.log('[SecureIframeShell] ArcClient wallet state:', {
        connected: arcClient.wallet.connected,
        address: arcClient.wallet.address,
        hasSigner: !!arcClient.wallet.signer,
        selectedAccount: arcClient.wallet.selectedAccount,
        accountsCount: arcClient.wallet.accounts?.length,
    });

    // State to track current payment attempt
    const [currentPayment, setCurrentPayment] = useState<{
        amount: number;
        currency: string;
        walletName: string;
    } | null>(null);

    // No need to create ConnectorClient here - it's passed as prop

    // Helper function to get SOL price with validation and fallbacks
    const getSolPrice = async (): Promise<number> => {
        // If explicit price override is provided, validate and use it
        if (paymentConfig?.solPriceUsd !== undefined) {
            const price = paymentConfig.solPriceUsd;
            if (typeof price === 'number' && price > 0 && isFinite(price)) {
                return price;
            }
            console.warn('[PaymentConfig] Invalid solPriceUsd override, falling back to API:', price);
        }

        try {
            // Attempt to fetch from price oracle
            const price = await fetchSolPrice();
            return price;
        } catch (error) {
            console.warn('[Payment] Failed to fetch SOL price:', error);

            // Use fallback if provided
            if (paymentConfig?.fallbackSolPriceUsd !== undefined) {
                const fallback = paymentConfig.fallbackSolPriceUsd;
                if (typeof fallback === 'number' && fallback > 0 && isFinite(fallback)) {
                    console.info('[Payment] Using fallback SOL price:', fallback);
                    return fallback;
                }
            }

            // Final fallback with a reasonable recent SOL price
            const defaultFallback = 100;
            console.info('[Payment] Using default fallback SOL price:', defaultFallback);
            return defaultFallback;
        }
    };

    // Helper function to get token decimals with validation and fallbacks
    const getTokenDecimals = (currency: string): number => {
        // Check if explicit decimals override is provided
        if (paymentConfig?.tokenDecimals?.[currency] !== undefined) {
            const decimals = paymentConfig.tokenDecimals[currency];
            if (typeof decimals === 'number' && Number.isInteger(decimals) && decimals >= 0 && decimals <= 18) {
                return decimals;
            }
            console.warn('[PaymentConfig] Invalid tokenDecimals override for', currency, ':', decimals);
        }

        // Try to get decimals from known stablecoin configuration
        const stablecoinConfig = STABLECOINS[currency as keyof typeof STABLECOINS];
        if (stablecoinConfig?.decimals !== undefined) {
            return stablecoinConfig.decimals;
        }

        // Fallback based on common token standards
        if (currency.includes('SOL')) return 9; // SOL always has 9 decimals
        if (currency.includes('USDC') || currency.includes('USDT')) return 6; // Common for stablecoins

        // Safe default
        console.warn('[Payment] Unknown decimals for currency', currency, ', using default 6');
        return 6;
    };

    // Create the HTML document for the iframe with the bundled app
    const srcDoc = useMemo(() => {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; base-uri 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; font-src data:; connect-src https: wss:;">
  <style>${IFRAME_STYLES || ''}</style>
</head>
<body>
  <div id="root"></div>
  <script>${IFRAME_BUNDLE}</script>
</body>
</html>`;
    }, [theme]);

    // Function to execute the actual payment after wallet connection
    const executePayment = async (paymentInfo: { amount: number; currency: string; walletName: string }) => {
        try {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[SecureIframeShell] Executing payment:', paymentInfo);
            }

            // Validate merchant address
            if (!config.merchant?.wallet) {
                throw new Error('Merchant address not configured');
            }

            if (!connectorClient) {
                throw new Error('Connector client not available');
            }

            const state = connectorClient.getSnapshot();
            if (!state.selectedWallet || !state.selectedAccount) {
                throw new Error('No wallet connected');
            }

            // Get the connected wallet account
            console.log('[SecureIframeShell] ConnectorClient state:', {
                connected: state.connected,
                selectedWallet: state.selectedWallet?.name,
                selectedAccount: state.selectedAccount,
                accountsCount: state.accounts?.length,
                accounts: state.accounts?.map((a: any) => ({ address: a.address, hasRaw: !!a.raw })),
            });

            const connectedAccount = state.accounts.find((acc: any) => acc.address === state.selectedAccount);
            if (!connectedAccount) {
                throw new Error('Connected account not found');
            }

            console.log('[SecureIframeShell] Found connected account:', {
                address: connectedAccount.address,
                hasRaw: !!connectedAccount.raw,
            });

            const { amount, currency } = paymentInfo;
            const isSOL = currency === 'SOL' || currency === 'SOL_DEVNET';

            let result;

            if (isSOL) {
                // SOL transfer - convert USD to SOL using current price or configured override
                const solPriceUsd = await getSolPrice();
                const solAmountFloat = amount / solPriceUsd;
                const lamports = BigInt(Math.floor(solAmountFloat * 1_000_000_000)); // Convert to lamports

                if (process.env.NODE_ENV !== 'production') {
                    console.log('[Payment] SOL conversion:', {
                        usdAmount: amount,
                        solPrice: solPriceUsd,
                        solAmount: solAmountFloat,
                        lamports: lamports.toString(),
                    });
                }

                result = await transferSOL({
                    to: config.merchant.wallet,
                    amount: lamports,
                    from: connectedAccount.address,
                });
            } else {
                // SPL Token transfer
                const tokenMint = TOKEN_MINTS[currency as keyof typeof TOKEN_MINTS];
                if (!tokenMint) {
                    throw new Error(`Unsupported token: ${currency}`);
                }

                // Get token decimals from configuration or known values
                const decimals = getTokenDecimals(currency);
                const tokenAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));

                if (process.env.NODE_ENV !== 'production') {
                    console.log('[Payment] Token conversion:', {
                        usdAmount: amount,
                        currency,
                        decimals,
                        tokenAmount: tokenAmount.toString(),
                    });
                }

                result = await transferToken({
                    mint: tokenMint,
                    to: config.merchant.wallet,
                    amount: tokenAmount,
                    createAccountIfNeeded: true,
                    from: connectedAccount.address,
                });
            }

            const signature = result.signature;

            if (process.env.NODE_ENV !== 'production') {
                console.log('[SecureIframeShell] Payment successful:', signature);
                console.log('Payment details:', {
                    amount,
                    currency,
                    from: connectedAccount.address,
                    to: config.merchant.wallet,
                });
            }

            // Notify iframe of success
            iframeRef.current?.contentWindow?.postMessage(
                {
                    type: 'paymentSuccess',
                    signature: signature,
                    amount: paymentInfo.amount,
                    currency: paymentInfo.currency,
                },
                '*',
            );

            // Also call the parent payment callback
            onPayment(paymentInfo.amount, paymentInfo.currency);
        } catch (error: any) {
            console.error('[SecureIframeShell] Payment failed:', error);

            let errorMessage = 'Payment failed';
            if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
                errorMessage = 'Payment cancelled by user';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for payment';
            } else if (error.name === 'BlockhashExpirationError') {
                errorMessage = 'Transaction failed due to network congestion. Please try again.';
            } else {
                errorMessage = error.message || 'Unknown payment error';
            }

            // Notify iframe of error
            iframeRef.current?.contentWindow?.postMessage(
                {
                    type: 'paymentError',
                    error: errorMessage,
                },
                '*',
            );

            throw error; // Re-throw to be caught by wallet connect handler
        } finally {
            setCurrentPayment(null);
        }
    };

    useEffect(() => {
        async function waitForWallets(client: ConnectorClient, timeoutMs = 1500): Promise<void> {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                const wallets = client.getSnapshot().wallets || [];
                if (wallets.length > 0) return;
                await new Promise(r => setTimeout(r, 50));
            }
            // Let it continue even if empty; select() will throw and be handled below
        }

        /**
         * Waits for React components and wallet client to be fully initialized
         * by polling the ConnectorClient state and checking for readiness conditions.
         */
        async function waitForReactComponentsReady(client: ConnectorClient, timeoutMs = 5000): Promise<void> {
            const start = Date.now();
            const pollInterval = 100; // Poll every 100ms

            return new Promise((resolve, reject) => {
                const checkReadiness = () => {
                    const elapsed = Date.now() - start;

                    if (elapsed >= timeoutMs) {
                        reject(new Error(`React components readiness timeout after ${timeoutMs}ms`));
                        return;
                    }

                    try {
                        const snapshot = client.getSnapshot();

                        // Check multiple readiness conditions:
                        // 1. Client is connected and has selected wallet/account
                        // 2. Snapshot indicates stable state (not transitioning)
                        const hasConnection = snapshot.connected && snapshot.selectedWallet && snapshot.selectedAccount;
                        const hasStableState = snapshot.wallets && snapshot.wallets.length > 0;

                        // Additional check for Arc client if available through the instance
                        let arcClientReady = true;
                        if ((client as any).arcClient) {
                            const arcClient = (client as any).arcClient;
                            // Check if Arc client has listeners (indicating initialization)
                            arcClientReady = !arcClient.listenersCount || arcClient.listenersCount > 0;
                        }

                        if (hasConnection && hasStableState && arcClientReady) {
                            if (process.env.NODE_ENV !== 'production') {
                                console.log('[SecureIframeShell] React components ready after', elapsed, 'ms');
                            }
                            resolve();
                            return;
                        }
                    } catch (error) {
                        // Continue polling if snapshot access fails temporarily
                        if (process.env.NODE_ENV !== 'production') {
                            console.log('[SecureIframeShell] Readiness check error (continuing):', error);
                        }
                    }

                    // Continue polling
                    setTimeout(checkReadiness, pollInterval);
                };

                checkReadiness();
            });
        }

        async function onMessage(e: MessageEvent) {
            const data = e.data as any;
            if (!data || typeof data !== 'object') return;

            // Validate the message is from our iframe
            if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;

            switch (data.type) {
                case 'ready':
                    setReady(true);
                    break;
                case 'resize':
                    const next = Math.min(Number(data.height) || 0, Math.floor(window.innerHeight * 0.9));
                    if (next > 0) setHeight(next);
                    break;
                case 'close':
                    // Disconnect wallet before closing modal to prevent auto-reconnect
                    if (connectorClient) {
                        try {
                            await connectorClient.disconnect();
                            if (process.env.NODE_ENV !== 'production') {
                                console.log('[SecureIframeShell] Wallet disconnected on modal close');
                            }
                        } catch (error) {
                            if (process.env.NODE_ENV !== 'production') {
                                console.warn('[SecureIframeShell] Failed to disconnect wallet on close:', error);
                            }
                        }
                    }
                    onCancel();
                    break;
                case 'payment':
                    onPayment(data.amount, data.currency);
                    break;
                case 'walletConnect': {
                    try {
                        // Store payment details from the iframe for later execution
                        const paymentInfo = {
                            amount: data.amount || 5, // Default to $5 if not provided
                            currency: data.currency || 'USDC',
                            walletName: data.walletName,
                        };
                        setCurrentPayment(paymentInfo);

                        if (!connectorClient) {
                            throw new Error('Connector client not available');
                        }

                        // Ensure wallet list is ready (Wallet Standard can be async to populate)
                        await waitForWallets(connectorClient);
                        const snap = connectorClient.getSnapshot();
                        const target = (snap.wallets || []).find((w: any) => w.name === data.walletName);
                        if (!target) throw new Error('Wallet not found');
                        if (process.env.NODE_ENV !== 'production') {
                            console.log('[SecureIframeShell] Selecting wallet for iframe:', data.walletName);
                        }
                        const res = await connectorClient.select(data.walletName);
                        const result = connectorClient.getSnapshot();
                        const accounts = (result.accounts || []).map((a: any) => ({
                            address: a.address,
                            icon: a.icon,
                        }));
                        if (process.env.NODE_ENV !== 'production') {
                            console.log(
                                '[SecureIframeShell] Iframe connect success, accounts:',
                                accounts.map((a: any) => a.address),
                            );
                        }

                        // Wait for React components to be fully initialized using deterministic polling
                        try {
                            await waitForReactComponentsReady(connectorClient);
                        } catch (readinessError: any) {
                            if (process.env.NODE_ENV !== 'production') {
                                console.warn(
                                    '[SecureIframeShell] React components readiness check failed:',
                                    readinessError,
                                );
                            }
                            // Continue with payment execution as a fallback (similar to original setTimeout behavior)
                            // The payment execution itself will validate readiness and may fail if not actually ready
                        }

                        // Now execute the payment with the connected wallet
                        await executePayment(paymentInfo);

                        iframeRef.current?.contentWindow?.postMessage(
                            { type: 'walletConnectResult', success: true, walletName: data.walletName, accounts },
                            '*',
                        );
                    } catch (err: any) {
                        if (process.env.NODE_ENV !== 'production') {
                            console.warn('[SecureIframeShell] walletConnect failed:', err);
                        }
                        iframeRef.current?.contentWindow?.postMessage(
                            {
                                type: 'walletConnectResult',
                                success: false,
                                walletName: data.walletName,
                                error: err?.message || String(err),
                            },
                            '*',
                        );
                        setCurrentPayment(null); // Clear on error
                    }
                    break;
                }
                // Additional event types can be handled here
            }
        }
        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [onPayment, onCancel]);

    // Send init message when iframe is ready
    useEffect(() => {
        if (ready && iframeRef.current?.contentWindow) {
            const totalAmount = inferTotalAmount(config, paymentConfig);
            const paymentUrl =
                config.mode === 'tip' ? '' : `solana:?recipient=${config.merchant.wallet}&amount=${totalAmount}`;

            console.log('[SecureIframeShell] Sending init message', { config, theme });

            // Gather wallet list from the existing connector client
            let initialWallets:
                | Array<{ name: string; icon?: string; installed: boolean; connectable?: boolean }>
                | undefined;
            try {
                if (connectorClient) {
                    const snap = connectorClient.getSnapshot();
                    initialWallets = (snap.wallets || []).map((w: any) => ({
                        name: w.name,
                        icon: w.icon,
                        installed: w.installed,
                        connectable: w.connectable,
                    }));
                } else {
                    initialWallets = undefined;
                }
            } catch {
                initialWallets = undefined;
            }

            iframeRef.current.contentWindow.postMessage(
                {
                    type: 'init',
                    config,
                    theme,
                    totalAmount,
                    paymentUrl,
                    wallets: initialWallets,
                },
                '*',
            );
        }
    }, [ready, config, theme]);

    return (
        <iframe
            ref={iframeRef}
            title="Commerce Modal"
            srcDoc={srcDoc}
            width="100%"
            height={height}
            style={{
                width: '560px',
                maxWidth: '560px',
                minWidth: '560px',
                backgroundColor: 'transparent',
                border: 'none',
                transition: 'height 300ms cubic-bezier(0.19, 1, 0.22, 1)',
            }}
            sandbox="allow-scripts allow-forms allow-popups"
            referrerPolicy="no-referrer"
            allow="clipboard-write"
        />
    );
}

function inferTotalAmount(config: SolanaCommerceConfig, paymentConfig?: PaymentConfig): number {
    // For tip mode, amount is determined by user input
    if (config.mode === 'tip') {
        return 0;
    }

    // Calculate total from products for cart and buyNow modes
    if (paymentConfig?.products && paymentConfig.products.length > 0) {
        return paymentConfig.products.reduce((total, product) => {
            // Defensively handle missing or invalid prices/quantities
            const price = product.price ?? product.unitAmount ?? 0;
            const quantity = product.quantity ?? 0;

            // Ensure values are finite numbers
            const safePrice = typeof price === 'number' && isFinite(price) && price >= 0 ? price : 0;
            const safeQuantity = typeof quantity === 'number' && isFinite(quantity) && quantity >= 0 ? quantity : 0;

            return total + safePrice * safeQuantity;
        }, 0);
    }

    return 0;
}
