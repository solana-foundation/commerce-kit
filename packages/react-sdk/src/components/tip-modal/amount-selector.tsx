/**
 * Amount Selector Component
 * Handles preset amounts and custom input - Now using CSS classes instead of inline styles
 */

import React, { memo, useEffect } from 'react';
import { getBorderRadius } from '../../utils';
import { useHover } from '../../hooks/use-hover';
import { useFormField } from '../../hooks/use-form-field';
import { useThemeStyles } from '../../hooks/use-theme-styles';
import { PRESET_AMOUNTS } from '../../constants/tip-modal';
import type { ThemeConfig } from '../../types';

interface AmountSelectorProps {
  theme: Required<ThemeConfig>;
  selectedAmount: number;
  showCustomInput: boolean;
  customAmount: string;
  currencySymbol?: string;
  onAmountSelect: (amount: number) => void;
  onCustomToggle: (show: boolean) => void;
  onCustomAmountChange: (amount: string) => void;
}

export const AmountSelector = memo<AmountSelectorProps>(({
  theme,
  selectedAmount,
  showCustomInput,
  customAmount,
  currencySymbol = '$',
  onAmountSelect,
  onCustomToggle,
  onCustomAmountChange
}) => {
  // Enhanced form field management for custom amount input
  const customAmountField = useFormField({
    initialValue: customAmount,
    validation: {
      required: showCustomInput,
      custom: (value: string) => {
        if (!value.trim()) return null;
        const num = parseFloat(value);
        if (isNaN(num)) return 'Please enter a valid number';
        if (num <= 0) return 'Amount must be greater than 0';
        if (num > 10000) return 'Amount too large';
        return null;
      }
    },
    formatValue: (value: string) => {
      // Only allow numbers and decimal points
      return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    }
  });

  // Sync with parent state
  useEffect(() => {
    if (customAmountField.value !== customAmount) {
      onCustomAmountChange(customAmountField.value);
    }
  }, [customAmountField.value, customAmount, onCustomAmountChange]);

  // Theme styles for input and buttons
  const inputThemeStyles = useThemeStyles({ theme, variant: 'input' });
  const amountThemeStyles = useThemeStyles({ theme, variant: 'amount' });
  return (
    <div className="ck-form-section">
      <label className="ck-form-label">
        Select amount
      </label>
      
      <div className="ck-amounts-grid">
        {PRESET_AMOUNTS.map(amount => (
          <AmountButton
            key={amount}
            theme={theme}
            amount={amount}
            currencySymbol={currencySymbol}
            isSelected={selectedAmount === amount && !showCustomInput}
            onClick={() => {
              onAmountSelect(amount);
              onCustomToggle(false);
            }}
          />
        ))}
        
        <AmountButton
          theme={theme}
          amount="Custom"
          currencySymbol={currencySymbol}
          isSelected={showCustomInput}
          onClick={() => onCustomToggle(true)}
        />
      </div>
      
      {showCustomInput && (
        <div>
          <input
            type="number"
            {...customAmountField.fieldProps}
            placeholder="Enter amount"
            className={`ck-input ${customAmountField.error ? 'error' : ''} ${customAmountField.isFocused ? 'focused' : ''}`}
            style={inputThemeStyles}
          />
          {customAmountField.error && customAmountField.isTouched && (
            <div 
              className="ck-input-error"
              style={{ 
                color: '#ef4444',
                fontSize: '0.75rem',
                marginTop: '0.25rem'
              }}
            >
              {customAmountField.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Individual amount button component
interface AmountButtonProps {
  theme: Required<ThemeConfig>;
  amount: number | string;
  currencySymbol: string;
  isSelected: boolean;
  onClick: () => void;
}

const AmountButton = memo<AmountButtonProps>(({ theme, amount, currencySymbol, isSelected, onClick }) => {
  const { isHovered, isPressed, hoverHandlers } = useHover();
  const themeStyles = useThemeStyles({ theme, variant: 'amount' });

  return (
    <button
      type="button"
      onClick={onClick}
      {...hoverHandlers}
      className={`ck-amount-button ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isPressed ? 'pressed' : ''}`}
      style={themeStyles}
    >
      {typeof amount === 'number' ? `${currencySymbol}${amount}` : amount}
    </button>
  );
});

AmountButton.displayName = 'AmountButton';
AmountSelector.displayName = 'AmountSelector';
