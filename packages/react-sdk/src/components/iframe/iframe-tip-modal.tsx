import React, { memo, useMemo, useCallback } from 'react';
import { getModalBorderRadius, getCurrencySymbol, getBorderRadius, convertUsdToSol } from '../../utils';
import { QRPaymentContent } from './iframe-qr-payment';
import { WalletPaymentContent } from './iframe-wallet-payment';
import { WALLET_ICON } from '../../constants/tip-modal';
import { useTipForm } from '../../hooks/use-tip-form';
import { useAnimationStyles } from '../../hooks/use-animation-styles';
import {
  TipModalHeader,
  CurrencySelector,
  AmountSelector,
  PaymentMethodSelector,
  ActionButton
} from '../tip-modal';
import type { TipModalContentProps, Currency } from '../../types';

// Currency-aware payment label formatter
function formatPayLabel(currency: Currency, amount: number): string {
  if (amount <= 0) return '0';
  
  const formattedAmount = amount.toString();
  
  // Always use $ prefix - users see USD amounts regardless of underlying currency
  // Conversion to actual SOL amounts happens in payment processing
  return `$${formattedAmount}`;
}

// Optimized iframe-safe version of TipModalContent
export const IframeTipModalContent = memo<TipModalContentProps>(({ 
  config, 
  theme, 
  onPayment, 
  onCancel 
}) => {
  // Setup animation styles
  useAnimationStyles();

  // Consolidated form state management
  const {
    state,
    actions,
    computed,
    handlers,
    availableCurrencies,
  } = useTipForm(config);

  // Handlers
  const handlePaymentComplete = handlers.handlePaymentComplete(onPayment);
  
  // Ref to prevent multiple wallet completion calls
  const walletCompletionRef = React.useRef(false);
  
  // Wallet payment completion handler (calls onPayment once then closes)  
  const handleWalletPaymentComplete = useCallback(() => {
    console.log('[IframeTipModal] handleWalletPaymentComplete called - payment successful');
    
    if (walletCompletionRef.current) {
      console.log('[IframeTipModal] Wallet completion already called, skipping');
      return;
    }
    walletCompletionRef.current = true;

    try {
      actions.setProcessing(false);
      
      // Calculate amount in the correct format for the callback
      let amount: number;
      const finalAmount = computed.finalAmount;
      
      if (state.selectedCurrency === 'USDC' || state.selectedCurrency === 'USDC_DEVNET') {
        amount = Math.round(finalAmount * 1000000); // USDC has 6 decimals
      } else if (state.selectedCurrency === 'USDT' || state.selectedCurrency === 'USDT_DEVNET') {
        amount = Math.round(finalAmount * 1000000); // USDT has 6 decimals  
      } else if (state.selectedCurrency === 'SOL' || state.selectedCurrency === 'SOL_DEVNET') {
        amount = Math.round(finalAmount * 1000000000); // SOL has 9 decimals (lamports)
      } else {
        amount = Math.round(finalAmount * 1000000000); // Default to 9 decimals
      }
      
      console.log('[IframeTipModal] Calling onPayment with:', { amount, currency: state.selectedCurrency });
      
      // Call the payment callback once
      onPayment?.(amount, state.selectedCurrency, state.selectedPaymentMethod);
      
      // Close the modal
      setTimeout(() => {
        onCancel?.();
      }, 100);
    } catch (error) {
      console.error('Wallet payment completion error:', error);
      actions.setProcessing(false);
      walletCompletionRef.current = false; // Reset on error to allow retry
    }
  }, [actions, computed.finalAmount, state.selectedCurrency, state.selectedPaymentMethod, onPayment, onCancel]);

  // Calculate SOL equivalent for display when SOL is selected
  const [solEquivalent, setSolEquivalent] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    console.log('🎯 useEffect triggered:', {
      selectedCurrency: state.selectedCurrency,
      finalAmount: computed.finalAmount,
      isSOL: state.selectedCurrency === 'SOL' || state.selectedCurrency === 'SOL_DEVNET'
    });
    
    if ((state.selectedCurrency === 'SOL' || state.selectedCurrency === 'SOL_DEVNET') && computed.finalAmount && computed.finalAmount > 0) {
      console.log('🚀 Calculating SOL equivalent for amount:', computed.finalAmount);
      convertUsdToSol(computed.finalAmount)
        .then(solAmount => {
          const solText = `${solAmount.toFixed(4)} SOL`;
          console.log('✅ SOL equivalent calculated:', solText);
          setSolEquivalent(solText);
        })
        .catch((error) => {
          console.error('❌ Failed to calculate SOL equivalent:', error);
          setSolEquivalent(null); // Don't show if price fetch fails
        });
    } else {
      setSolEquivalent(null);
    }
  }, [state.selectedCurrency, computed.finalAmount]);



  return (
    <div
      className="sc-tip-modal-anim"
      style={{
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
      } as React.CSSProperties}
    >
      {/* Header */}
      <TipModalHeader
        theme={theme}
        config={config}
        currentStep={state.currentStep}
        selectedPaymentMethod={state.selectedPaymentMethod}
        onBack={handlers.handleBack}
        onClose={onCancel}
      />

      {/* Main Content - Scale + Fade transition */}
      <div className="sc-body">
        {/* Form step */}
        <div className={`sc-step ${state.currentStep === 'form' ? 'active' : ''}`}>
          <div className="sc-content">
            <CurrencySelector
              theme={theme}
              selectedCurrency={state.selectedCurrency}
              currencies={availableCurrencies}
              isOpen={state.currencyDropdownOpen}
              onOpenChange={actions.setCurrencyDropdown}
              onSelect={actions.setCurrency}
            />

            <AmountSelector
              theme={theme}
              selectedAmount={state.selectedAmount}
              showCustomInput={state.showCustomInput}
              customAmount={state.customAmount}
              currencySymbol={getCurrencySymbol(state.selectedCurrency)}
              onAmountSelect={actions.setAmount}
              onCustomToggle={actions.toggleCustomInput}
              onCustomAmountChange={actions.setCustomAmount}
            />

            <PaymentMethodSelector
              theme={theme}
              selectedPaymentMethod={state.selectedPaymentMethod}
              onSelect={actions.setPaymentMethod}
            />

            {/* Price Error Display */}
            {state.priceError && (
              <div 
                className="ck-error-message"
                style={{
                  '--text-color': theme.textColor,
                  '--error-color': '#ef4444',
                  '--border-radius': getBorderRadius(theme.borderRadius),
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--error-color)',
                  fontSize: '0.875rem',
                  fontFamily: theme.fontFamily
                } as React.CSSProperties}
              >
                ⚠️ {state.priceError}
              </div>
            )}

            <ActionButton
              theme={theme}
              isDisabled={!computed.isFormValid || !!state.priceError}
              isProcessing={state.isProcessing}
              onClick={handlers.handleSubmit}
              solEquivalent={solEquivalent || undefined}
            >
              {state.isProcessing ? 'Processing...' : `Pay ${formatPayLabel(state.selectedCurrency, computed.finalAmount || 0)}`}
            </ActionButton>
          </div>
        </div>

        {/* Payment step */}
        <div
          className={`sc-step payment ${state.currentStep === 'payment' ? 'active' : ''} ${state.selectedPaymentMethod === 'wallet' ? 'wallet-bg' : ''}`}
        >
          {state.selectedPaymentMethod === 'qr' ? (
            <QRPaymentContent 
              theme={theme}
              config={config}
              selectedAmount={state.selectedAmount}
              selectedCurrency={state.selectedCurrency}
              customAmount={state.customAmount}
              showCustomInput={state.showCustomInput}
              onPaymentComplete={handlePaymentComplete}
              onPaymentError={(error) => {
                console.error('Payment error:', error);
              }}
            />
          ) : (
            <WalletPaymentContent 
              theme={theme}
              config={config}
              selectedAmount={state.selectedAmount}
              selectedCurrency={state.selectedCurrency}
              customAmount={state.customAmount}
              showCustomInput={state.showCustomInput}
              onPaymentComplete={handleWalletPaymentComplete}
              walletIcon={WALLET_ICON}
            />
          )}
        </div>
      </div>
    </div>
  );
});

IframeTipModalContent.displayName = 'IframeTipModalContent';
