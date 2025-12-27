import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_CURRENCIES } from '../../constants/tip-modal';
import { useAnimationStyles } from '../../hooks/use-animation-styles';
import {
    convertUsdToLamports,
    convertUsdToSol,
    getBorderRadius,
    getDecimals,
    getModalBorderRadius
} from '../../utils';
import { WalletIcon } from '../icons';
import { QRPaymentContent } from '../iframe/iframe-qr-payment';
import { WalletPaymentContent } from '../iframe/iframe-wallet-payment';
import { ActionButton } from '../tip-modal/action-button';
import { CurrencySelector } from '../tip-modal/currency-selector';
import { PaymentMethodSelector } from '../tip-modal/payment-method-selector';
import { TipModalHeader } from '../tip-modal/tip-modal-header';

import type { Currency, PaymentMethod, PaymentModalContentProps, TransactionState } from '../../types';

type PaymentStep = 'review' | 'payment';

export const PaymentModalContent = memo<PaymentModalContentProps>(
    ({ config, theme, totalAmount, onPayment, onCancel, paymentConfig }) => {
        // State
        const [currentStep, setCurrentStep] = useState<PaymentStep>('review');
        const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('wallet');
        const [transactionState, setTransactionState] = useState<TransactionState>('idle');

        // Currency State
        // Default to first allowed mint or USDC
        const initialCurrency: Currency = (config.allowedMints?.[0] as Currency) || 'USDC';
        const [selectedCurrency, setSelectedCurrency] = useState<Currency>(initialCurrency);
        const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
        const [qrAmount, setQrAmount] = useState(0);

        // Derive available currencies
        const availableCurrencies = useMemo(() => {
            if (config.allowedMints && config.allowedMints.length > 0) {
                return ALL_CURRENCIES.filter(c => config.allowedMints?.includes(c.value));
            }
            // Default set if no restriction
            return ALL_CURRENCIES.filter(c => ['USDC', 'SOL', 'USDC_DEVNET', 'SOL_DEVNET'].includes(c.value));
        }, [config.allowedMints]);

        // Ensure we have products to show
        const products = paymentConfig?.products || [];
        const hasProducts = products.length > 0;

        // Calculate USD total from products
        const totalUsd = useMemo(() => {
            if (products.length > 0) {
                return products.reduce((acc, curr) => acc + ((curr.price ?? curr.unitAmount ?? 0) * (curr.quantity ?? 1)), 0);
            }
            return totalAmount; // Fallback if no products (e.g. passed prop) assuming it's USD?
        }, [products, totalAmount]);

        // Formatted Total Display
        const formattedTotal = useMemo(() => {
            return `$${totalUsd.toFixed(2)}`;
        }, [totalUsd]);

        // Update QR Amount when currency changes
        useEffect(() => {
            let isMounted = true;

            const updateAmount = async () => {
                const isSol = selectedCurrency === 'SOL' || selectedCurrency === 'SOL_DEVNET';
                if (isSol) {
                    try {
                        const solAmount = await convertUsdToSol(totalUsd);
                        if (isMounted) setQrAmount(solAmount);
                    } catch (e) {
                        console.error("Failed to convert USD to SOL", e);
                        // Fallback? stay 0 or show error
                    }
                } else {
                    // Stablecoins are assumed 1:1 with USD
                    if (isMounted) setQrAmount(totalUsd);
                }
            };

            updateAmount();

            return () => { isMounted = false; };
        }, [totalUsd, selectedCurrency]);

        const handleProceedToPayment = () => {
            setCurrentStep('payment');
        };

        // Ref to prevent multiple wallet completion calls
        const walletCompletionRef = useRef(false);

        // Reset completion ref on mount
        useEffect(() => {
            walletCompletionRef.current = false;
        }, []);

        // Payment Handler with Conversion
        const handleProcessPayment = useCallback(async () => {
            let finalAmount = 0;
            const isSol = selectedCurrency === 'SOL' || selectedCurrency === 'SOL_DEVNET';

            try {
                if (isSol) {
                    // Convert USD to Lamports
                    finalAmount = await convertUsdToLamports(totalUsd);
                } else {
                    // Stablecoin: Convert USD to atomic units (e.g. 6 decimals)
                    const decimals = getDecimals(selectedCurrency);
                    finalAmount = Math.round(totalUsd * 10 ** decimals);
                }

                onPayment(finalAmount, selectedCurrency);
            } catch (e) {
                console.error("Payment conversion failed", e);
                // Should ideally show error state
            }
        }, [totalUsd, selectedCurrency, onPayment]);

        const handleWalletPaymentComplete = useCallback(() => {
            if (walletCompletionRef.current) return;
            walletCompletionRef.current = true;
            handleProcessPayment().then(() => {
                setTimeout(onCancel, 2000);
            });
        }, [handleProcessPayment, onCancel]);

        const handleQRPaymentComplete = useCallback(() => {
            handleProcessPayment().then(() => {
                setTimeout(onCancel, 2000);
            });
        }, [handleProcessPayment, onCancel]);

        // Initialize animation styles
        useAnimationStyles();

        return (
            <div
                className="sc-tip-modal-anim"
                style={
                    {
                        '--font-family': theme.fontFamily,
                        '--background-color': theme.backgroundColor,
                        '--text-color': theme.textColor,
                        '--text-color-70': `${theme.textColor}70`,
                        '--text-color-60': `${theme.textColor}60`,
                        '--primary-color': theme.primaryColor,
                        '--primary-color-10': `${theme.primaryColor}10`,
                        '--primary-color-60': `${theme.primaryColor}60`,
                        '--secondary-color': theme.secondaryColor,
                        '--modal-border-radius': getModalBorderRadius(theme.borderRadius),
                    } as React.CSSProperties
                }
            >
                {/* Header */}
                <TipModalHeader
                    theme={theme}
                    config={config}
                    currentStep={currentStep === 'review' ? 'form' : 'payment'} // Map 'review' to 'form' visually
                    selectedPaymentMethod={selectedPaymentMethod}
                    transactionState={transactionState}
                    onBack={currentStep === 'payment' ? () => setCurrentStep('review') : () => { }}
                    onClose={onCancel}
                />

                {/* Content Body */}
                <div className="sc-body">
                    {/* Review Step */}
                    <div className={`sc-step ${currentStep === 'review' ? 'active' : ''}`}>
                        <div className="sc-content">
                            {hasProducts ? (
                                <div style={{
                                    backgroundColor: `${theme.textColor}05`,
                                    borderRadius: getBorderRadius(theme.borderRadius),
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    border: `1px solid ${theme.textColor}10`
                                }}>
                                    {/* Product List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {products.map((p, i) => (
                                            <div key={p.id || i} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500', color: theme.textColor, fontSize: '0.9375rem' }}>{p.name}</span>
                                                    {p.quantity > 1 && (
                                                        <span style={{ fontSize: '0.8rem', color: `${theme.textColor}60` }}>Qty: {p.quantity}</span>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: '600', color: theme.textColor, fontSize: '0.9375rem' }}>
                                                    ${((p.price ?? p.unitAmount ?? 0) * (p.quantity ?? 1)).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total Row */}
                                    <div style={{
                                        marginTop: '1rem',
                                        paddingTop: '1rem',
                                        borderTop: `1px dashed ${theme.textColor}20`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.9375rem', fontWeight: '500', color: `${theme.textColor}80` }}>Total</span>
                                        <span style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textColor }}>{formattedTotal}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
                                    <p style={{ margin: 0, color: `${theme.textColor}70`, fontSize: '0.875rem' }}>
                                        Payment Amount
                                    </p>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: theme.textColor }}>
                                        {formattedTotal}
                                    </div>
                                </div>
                            )}

                            {/* Currency Selection */}
                            <CurrencySelector
                                theme={theme}
                                selectedCurrency={selectedCurrency}
                                currencies={availableCurrencies}
                                isOpen={currencyDropdownOpen}
                                onOpenChange={setCurrencyDropdownOpen}
                                onSelect={setSelectedCurrency}
                            />

                            {/* Payment Method Selection */}
                            <PaymentMethodSelector
                                theme={theme}
                                selectedPaymentMethod={selectedPaymentMethod}
                                onSelect={setSelectedPaymentMethod}
                            />

                            {/* Action Button */}
                            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                                <ActionButton
                                    theme={theme}
                                    isDisabled={false}
                                    isProcessing={false}
                                    onClick={handleProceedToPayment}
                                >
                                    Pay {formattedTotal}
                                </ActionButton>
                            </div>
                        </div>
                    </div>

                    {/* Payment Step */}
                    <div className={`sc-step payment ${currentStep === 'payment' ? 'active' : ''} ${selectedPaymentMethod === 'wallet' && transactionState === 'idle' ? 'wallet-bg' : ''}`}>
                        {selectedPaymentMethod === 'qr' ? (
                            <QRPaymentContent
                                theme={theme}
                                config={config}
                                selectedAmount={qrAmount}
                                selectedCurrency={selectedCurrency}
                                customAmount=""
                                showCustomInput={false}
                                onPaymentComplete={handleQRPaymentComplete}
                                onPaymentError={(e) => console.error(e)}
                            />
                        ) : (
                            <WalletPaymentContent
                                theme={theme}
                                config={config}
                                // Wallet expects USD (conversion handled in parent)
                                selectedAmount={totalUsd}
                                selectedCurrency={selectedCurrency}
                                customAmount=""
                                showCustomInput={false}
                                onPaymentComplete={handleWalletPaymentComplete}
                                onTransactionSuccess={() => setTransactionState('success')}
                                onTransactionError={() => setTransactionState('error')}
                                onTransactionReset={() => setTransactionState('idle')}
                                walletIcon={<WalletIcon />}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    },
);

PaymentModalContent.displayName = 'PaymentModalContent';
