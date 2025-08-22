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
    <div className="ck-form-section">
      <label className="ck-form-label ck-currency-label">
        Select stablecoin
      </label>
      
      <DropdownRoot open={isOpen} onOpenChange={onOpenChange}>
        <DropdownTrigger asChild>
          <button
            type="button"
            className="ck-currency-container"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label="Select currency"
            style={{
              '--dropdown-radius': getRadius('dropdown', theme.borderRadius),
              '--text-color': theme.textColor
            } as React.CSSProperties}
          >
            <div className="ck-currency-selected">
              <TokenIcon symbol={selectedCurrency} size={24} />
              <span className="ck-currency-symbol">
                {selectedCurrencyInfo?.symbol || selectedCurrency}
              </span>
            </div>  
            <div className={`ck-currency-chevron ${isOpen ? 'open' : ''}`}>
              {CHEVRON_DOWN_ICON}
            </div>
          </button>
        </DropdownTrigger>
        
        <DropdownContent align="start">
          <div 
            className="ck-dropdown-content"
            style={{
              '--dropdown-radius': getRadius('dropdown', theme.borderRadius)
            } as React.CSSProperties}
          >
          {currencies.map(currency => (
            <DropdownItem
              key={currency.value}
              onSelect={() => onSelect(currency.value as Currency)}
            >
              <div className="ck-dropdown-item">
                <TokenIcon symbol={currency.value} size={16} />
                <span>{currency.symbol}</span>
                {selectedCurrency === currency.value && (
                  <div 
                    className="ck-dropdown-check"
                    style={{ '--primary-color': theme.primaryColor } as React.CSSProperties}
                  >
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
