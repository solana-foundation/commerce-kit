import React, { memo } from 'react';
import { getModalBorderRadius } from '../../utils';
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
import type { TipModalContentProps } from '../../types';

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

  return (
    <div className="sc-tip-modal-anim" style={{
      fontFamily: theme.fontFamily,
      backgroundColor: theme.backgroundColor,
      padding: '0',
      height: 'auto',
      maxWidth: '560px',
      minWidth: '560px',
      width: '100%',
      borderRadius: getModalBorderRadius(theme.borderRadius),
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      animation: 'sc-tip-modal-slide-up 125ms ease-in'
    }}>
      {/* Header */}
      <TipModalHeader
        theme={theme}
        config={config}
        currentStep={state.currentStep}
        selectedPaymentMethod={state.selectedPaymentMethod}
        onBack={handlers.handleBack}
        onClose={onCancel}
      />

      {/* Main Content */}
      {state.currentStep === 'form' ? (
        <div style={{ 
          padding: '1.5rem',
          borderBottomLeftRadius: getModalBorderRadius(theme.borderRadius),
          borderBottomRightRadius: getModalBorderRadius(theme.borderRadius)
        }}>
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
            onAmountSelect={actions.setAmount}
            onCustomToggle={actions.toggleCustomInput}
            onCustomAmountChange={actions.setCustomAmount}
          />

          <PaymentMethodSelector
            theme={theme}
            selectedPaymentMethod={state.selectedPaymentMethod}
            onSelect={actions.setPaymentMethod}
          />

          <ActionButton
            theme={theme}
            isDisabled={!computed.isFormValid}
            isProcessing={state.isProcessing}
            onClick={handlers.handleSubmit}
          >
            {state.isProcessing ? 'Processing...' : `Pay $${computed.finalAmount || '0'}`}
          </ActionButton>
        </div>
      ) : (
        // Payment Step
        <div style={{
          borderBottomLeftRadius: getModalBorderRadius(theme.borderRadius),
          borderBottomRightRadius: getModalBorderRadius(theme.borderRadius),
          backgroundColor: state.selectedPaymentMethod === 'wallet' ? '#F5F5F5' : 'transparent',
          transition: 'background-color 150ms ease'
        }}>
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
              onPaymentComplete={handlePaymentComplete}
              walletIcon={WALLET_ICON}
            />
          )}
        </div>
      )}
    </div>
  );
});

IframeTipModalContent.displayName = 'IframeTipModalContent';
