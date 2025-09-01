/**
 * Amount Selector Component
 * Handles preset amounts and custom input - Now using CSS classes instead of inline styles
 */

import React, { memo } from 'react';
import { getBorderRadius } from '../../utils';
import { PRESET_AMOUNTS } from '../../constants/tip-modal';
import type { ThemeConfig } from '../../types';

interface AmountSelectorProps {
  theme: Required<ThemeConfig>;
  selectedAmount: number;
  showCustomInput: boolean;
  customAmount: string;
  currencySymbol?: string;
  presetAmounts?: readonly number[];
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
  presetAmounts = PRESET_AMOUNTS,
  onAmountSelect,
  onCustomToggle,
  onCustomAmountChange
}) => {
  return (
    <div className="ck-form-section">
      <label className="ck-form-label">
        Select amount
      </label>
      
      <div className="ck-amounts-grid">
        {presetAmounts.map(amount => (
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
        <input
          type="number"
          value={customAmount}
          onChange={(e) => onCustomAmountChange(e.target.value)}
          placeholder="Enter amount"
          className="ck-input"
          style={{
            // Set CSS custom properties for dynamic theming
            '--border-radius': getBorderRadius(theme.borderRadius),
            '--text-color': theme.textColor,
            '--font-family': theme.fontFamily,
            '--primary-color': theme.primaryColor
          } as React.CSSProperties}
        />
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ck-amount-button ${isSelected ? 'selected' : ''}`}
      style={{
        // Set CSS custom properties for dynamic theming
        '--text-color': theme.textColor,
        '--border-radius': getBorderRadius(theme.borderRadius),
        '--primary-color-10': `${theme.primaryColor}10`,
        '--primary-color-60': `${theme.primaryColor}60`
      } as React.CSSProperties}
    >
      {typeof amount === 'number' ? `${currencySymbol}${amount}` : amount}
    </button>
  );
});

AmountButton.displayName = 'AmountButton';
AmountSelector.displayName = 'AmountSelector';
