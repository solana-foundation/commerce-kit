/**
 * Currency Selector Component
 * Handles currency selection dropdown
 */

import React, { memo } from 'react';
import { getRadius } from '../../utils';
import { CHEVRON_DOWN_ICON, CHECK_ICON } from '../../constants/tip-modal';
import { TokenIcon } from '../icons';
import {
  DropdownRoot,
  DropdownTrigger,
  DropdownContent,
  DropdownItem
} from '../../../../ui-primitives/src/react';
import type { ThemeConfig, Currency } from '../../types';

interface CurrencyInfo {
  value: string;
  label: string;
  symbol: string;
}

interface CurrencySelectorProps {
  theme: Required<ThemeConfig>;
  selectedCurrency: Currency;
  currencies: readonly CurrencyInfo[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (currency: Currency) => void;
}

export const CurrencySelector = memo<CurrencySelectorProps>(({
  theme,
  selectedCurrency,
  currencies,
  isOpen,
  onOpenChange,
  onSelect
}) => {
  const selectedCurrencyInfo = currencies.find(c => c.value === selectedCurrency);

  return (
    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
      <label style={{
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: '400',
        color: `${theme.textColor}70`,
        marginBottom: '0.5rem'
      }}>
        Select stablecoin
      </label>
      
      <DropdownRoot open={isOpen} onOpenChange={onOpenChange}>
        <DropdownTrigger asChild>
          <div
            style={{
              width: 'fit-content',
              minWidth: '120px',
              height: '2.25rem',
              padding: '0.25rem 0.45rem',
              border: '1px solid #EBEBEB',
              borderRadius: getRadius('dropdown', theme.borderRadius),
              backgroundColor: '#FFFFFF',
              color: theme.textColor,
              fontWeight: '400',
              cursor: 'pointer',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 200ms ease-in-out',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TokenIcon symbol={selectedCurrency} size={24} />
              <span style={{ marginRight: '4px', fontWeight: '600', fontSize: '16px' }}>
                {selectedCurrencyInfo?.symbol || selectedCurrency}
              </span>
            </div>  
            <div style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease-in-out'
            }}>
              {CHEVRON_DOWN_ICON}
            </div>
          </div>
        </DropdownTrigger>
        
        <DropdownContent align="start">
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EBEBEB',
            borderRadius: getRadius('dropdown', theme.borderRadius),
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '8px',
            minWidth: '200px'
          }}>
          {currencies.map(currency => (
            <DropdownItem
              key={currency.value}
              onSelect={() => onSelect(currency.value as Currency)}
            >
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '400',
                color: theme.textColor,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                width: '100%'
              }}>
                <TokenIcon symbol={currency.value} size={16} />
                <span>{currency.symbol}</span>
                {selectedCurrency === currency.value && (
                  <div style={{ marginLeft: 'auto', color: theme.primaryColor }}>
                    {CHECK_ICON}
                  </div>
                )}
              </div>
            </DropdownItem>
          ))}
          </div>
        </DropdownContent>
      </DropdownRoot>
    </div>
  );
});

CurrencySelector.displayName = 'CurrencySelector';
