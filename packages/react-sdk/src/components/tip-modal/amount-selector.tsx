/**
 * Amount Selector Component
 * Handles preset amounts and custom input
 */

import React, { memo } from 'react';
import { getRadius } from '../../utils';
import { PRESET_AMOUNTS } from '../../constants/tip-modal';
import { useButtonStyles } from '../../hooks/use-button-styles';
import type { ThemeConfig } from '../../types';

interface AmountSelectorProps {
  theme: Required<ThemeConfig>;
  selectedAmount: number;
  showCustomInput: boolean;
  customAmount: string;
  onAmountSelect: (amount: number) => void;
  onCustomToggle: (show: boolean) => void;
  onCustomAmountChange: (amount: string) => void;
}

export const AmountSelector = memo<AmountSelectorProps>(({
  theme,
  selectedAmount,
  showCustomInput,
  customAmount,
  onAmountSelect,
  onCustomToggle,
  onCustomAmountChange
}) => {
  return (
    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
      <label style={{
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: '400',
        color: `${theme.textColor}70`,
        marginBottom: '0.75rem'
      }}>
        Select amount
      </label>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '1rem'
      }}>
        {PRESET_AMOUNTS.map(amount => (
          <AmountButton
            key={amount}
            theme={theme}
            amount={amount}
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
          style={{
            width: '100%',
            height: '2.75rem',
            padding: '0.75rem 1rem',
            border: '1px solid #EBEBEB',
            borderRadius: getRadius('dropdown', theme.borderRadius),
            backgroundColor: '#F5F5F5',
            color: theme.textColor,
            fontSize: '19px',
            fontWeight: '400',
            outline: 'none',
            marginTop: '0.75rem',
            transition: 'border-color 200ms ease-in, box-shadow 200ms ease-in',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        />
      )}
    </div>
  );
});

// Individual amount button component
interface AmountButtonProps {
  theme: Required<ThemeConfig>;
  amount: number | string;
  isSelected: boolean;
  onClick: () => void;
}

const AmountButton = memo<AmountButtonProps>(({ theme, amount, isSelected, onClick }) => {
  const { styles, handlers } = useButtonStyles({ 
    theme, 
    variant: 'selection',
    isSelected 
  });

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles,
        width: '100%',
        height: '68px',
      }}
      {...handlers}
    >
      {typeof amount === 'number' ? `$${amount}` : amount}
    </button>
  );
});

AmountButton.displayName = 'AmountButton';
AmountSelector.displayName = 'AmountSelector';
