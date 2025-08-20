/**
 * Payment Method Selector Component
 * Handles payment method selection (QR vs Wallet)
 */

import React, { memo } from 'react';
import { getRadius } from '../../utils';
import { PAYMENT_METHODS } from '../../constants/tip-modal';
import { useButtonStyles } from '../../hooks/use-button-styles';
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
    <div style={{ 
      marginBottom: '1.5rem', 
      textAlign: 'left',        
      borderBottom: `1px solid ${theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`}`,
      paddingBottom: '1.5rem'
    }}>
      <label style={{
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: '400',
        color: `${theme.textColor}70`,
        marginBottom: '0.75rem'
      }}>
        Payment method
      </label>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
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
  const styles: React.CSSProperties = {
    flex: 1,
    padding: '1rem',
    border: `${isSelected ? `3px solid #ffffff` : '1px solid #e5e7eb'}`,
    borderRadius: getRadius('payment', theme.borderRadius),
    backgroundColor: isSelected ? `${theme.primaryColor}10` : theme.backgroundColor,
    cursor: 'pointer',
    boxShadow: isSelected ? `0 0 0 2px ${theme.primaryColor}60` : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s, transform 0.1s ease',
    transform: 'scale(1)',
    textAlign: 'left',
    width: '248px',
    height: '110px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={styles}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.25rem'
      }}>
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          color: isSelected ? 'rgba(0, 0, 0, 0.7)' : theme.textColor
        }}>
          {method.icon}
        </span>
        <span style={{
          fontSize: '19px',
          fontWeight: '600',
          color: isSelected ? 'rgba(0, 0, 0, 0.7)' : theme.textColor
        }}>
          {method.label}
        </span>
      </div>
      <div style={{
        fontSize: '12px',
        color: `${theme.textColor}60`
      }}>
        {method.description}
      </div>
    </button>
  );
});

PaymentMethodButton.displayName = 'PaymentMethodButton';
PaymentMethodSelector.displayName = 'PaymentMethodSelector';
