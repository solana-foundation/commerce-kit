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
      width: '100%',
      maxWidth: '560px',
      minWidth: '560px',
      borderRadius: getModalBorderRadius(theme.borderRadius),
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden'
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

      {/* Main Content - Scale + Fade transition */}
      <div style={{ position: 'relative' }}>
        {/* Form step */}
        <div 
          style={{
            position: state.currentStep === 'form' ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            right: 0,
            opacity: state.currentStep === 'form' ? 1 : 0,
            transform: state.currentStep === 'form' ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 300ms cubic-bezier(0.19, 1, 0.22, 1), transform 300ms cubic-bezier(0.19, 1, 0.22, 1)',
            pointerEvents: state.currentStep === 'form' ? 'auto' : 'none',
            borderBottomLeftRadius: state.currentStep === 'form' ? getModalBorderRadius(theme.borderRadius) : undefined,
            borderBottomRightRadius: state.currentStep === 'form' ? getModalBorderRadius(theme.borderRadius) : undefined,
          }}
        >
          <div style={{ padding: '1.5rem' }}>
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
        </div>

        {/* Payment step */}
        <div 
          style={{
            position: state.currentStep === 'payment' ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            right: 0,
            opacity: state.currentStep === 'payment' ? 1 : 0,
            transform: state.currentStep === 'payment' ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 300ms cubic-bezier(0.19, 1, 0.22, 1), transform 300ms cubic-bezier(0.19, 1, 0.22, 1)',
            pointerEvents: state.currentStep === 'payment' ? 'auto' : 'none',
            backgroundColor: state.selectedPaymentMethod === 'wallet' && state.currentStep === 'payment' ? '#F5F5F5' : 'transparent',
            borderBottomLeftRadius: state.currentStep === 'payment' ? getModalBorderRadius(theme.borderRadius) : undefined,
            borderBottomRightRadius: state.currentStep === 'payment' ? getModalBorderRadius(theme.borderRadius) : undefined,
          }}
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
              onPaymentComplete={handlePaymentComplete}
              walletIcon={WALLET_ICON}
            />
          )}
        </div>
      </div>
    </div>
  );
});

IframeTipModalContent.displayName = 'IframeTipModalContent';
