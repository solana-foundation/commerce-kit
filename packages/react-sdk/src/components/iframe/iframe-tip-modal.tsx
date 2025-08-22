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
