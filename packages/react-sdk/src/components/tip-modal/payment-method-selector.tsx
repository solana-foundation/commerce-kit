/**
 * Payment Method Selector Component
 * Handles payment method selection (QR vs Wallet)
 */

import React, { memo } from 'react';
import { getRadius } from '../../utils';
import { PAYMENT_METHODS } from '../../constants/tip-modal';
import type { ThemeConfig, PaymentMethod } from '../../types';

interface PaymentMethodSelectorProps {
  theme: Required<ThemeConfig>;
  selectedPaymentMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector = memo<PaymentMethodSelectorProps>(({
  theme,
  selectedPaymentMethod,
  onSelect
}) => {
  return (
    <div 
      className="ck-form-section with-border"
      role="group"
      aria-labelledby="payment-method-label"
      style={{
        '--section-border-color': theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`
      } as React.CSSProperties}
    >
      <label id="payment-method-label" className="ck-form-label">
        Payment method
      </label>
      
      <div className="ck-payment-methods-grid" role="radiogroup" aria-labelledby="payment-method-label">
        {PAYMENT_METHODS.map(method => (
          <PaymentMethodButton
            key={method.value}
            theme={theme}
            method={method}
            isSelected={selectedPaymentMethod === method.value}
            onClick={() => onSelect(method.value)}
          />
        ))}
      </div>
    </div>
  );
});

// Individual payment method button
interface PaymentMethodButtonProps {
  theme: Required<ThemeConfig>;
  method: typeof PAYMENT_METHODS[0];
  isSelected: boolean;
  onClick: () => void;
}

const PaymentMethodButton = memo<PaymentMethodButtonProps>(({ 
  theme, 
  method, 
  isSelected, 
  onClick 
}) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${method.label}: ${method.description}`}
      onClick={onClick}
      className={`ck-payment-method ${isSelected ? 'selected' : ''}`}
      style={{
        // Set CSS custom properties for dynamic theming
        '--background-color': theme.backgroundColor,
        '--border-radius': getRadius('payment', theme.borderRadius),
        '--primary-color-10': `${theme.primaryColor}10`,
        '--primary-color-60': `${theme.primaryColor}60`,
        '--text-color': theme.textColor,
        '--text-color-60': `${theme.textColor}60`
      } as React.CSSProperties}
    >
      <div className="ck-payment-method-header">
        <span className="ck-payment-method-icon">
          {method.icon}
        </span>
        <span className="ck-payment-method-label">
          {method.label}
        </span>
      </div>
      <div className="ck-payment-method-description">
        {method.description}
      </div>
    </button>
  );
});

PaymentMethodButton.displayName = 'PaymentMethodButton';
PaymentMethodSelector.displayName = 'PaymentMethodSelector';
