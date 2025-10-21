/**
 * Currency Selector Component
 * Handles currency selection dropdown
 */

import React, { memo } from 'react';
import { useDropdown } from '../../hooks/use-dropdown';
import { useThemeStyles } from '../../hooks/use-theme-styles';
import { ChevronDownIcon, CheckIcon } from '../icons';
import { TokenIcon } from '../icons';
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from '../../ui-primitives/dropdown-alpha';
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
    onOpenChange?: (open: boolean) => void;
    onSelect: (currency: Currency) => void;
}

export const CurrencySelector = memo<CurrencySelectorProps>(
    ({ theme, selectedCurrency, currencies, isOpen, onOpenChange, onSelect }) => {
        const selectedCurrencyInfo = currencies.find(c => c.value === selectedCurrency);

        // Enhanced dropdown state management
        const dropdown = useDropdown({
            initialOpen: isOpen,
            closeOnSelect: true,
            closeOnClickOutside: true,
        });

        // Use combined state - prefer external props but fall back to internal state
        const currentIsOpen = isOpen !== undefined ? isOpen : dropdown.isOpen;
        const handleOpenChange = (open: boolean) => {
            if (onOpenChange) onOpenChange(open);
            if (open) dropdown.open();
            else dropdown.close();
        };

        const handleSelect = (currency: Currency) => {
            onSelect(currency);
            dropdown.select(currency);
        };

        // Theme styles for dropdown
        const dropdownThemeStyles = useThemeStyles({ theme, variant: 'dropdown' });

        return (
            <div className="ck-form-section" ref={dropdown.ref as any}>
                <label className="ck-form-label ck-currency-label">Select stablecoin</label>

                <DropdownRoot open={currentIsOpen} onOpenChange={handleOpenChange}>
                    <DropdownTrigger asChild>
                        <button
                            type="button"
                            className="ck-currency-container"
                            aria-haspopup="listbox"
                            aria-expanded={currentIsOpen}
                            aria-label="Select currency"
                            style={dropdownThemeStyles}
                        >
                            <div className="ck-currency-selected">
                                <TokenIcon
                                    symbol={selectedCurrency}
                                    size={24}
                                    data-testid={`token-icon-${selectedCurrency}-trigger`}
                                />
                                <span className="ck-currency-symbol">
                                    {selectedCurrencyInfo?.symbol || selectedCurrency}
                                </span>
                            </div>
                            <div className={`ck-currency-chevron ${currentIsOpen ? 'open' : ''}`}>
                                <ChevronDownIcon />
                            </div>
                        </button>
                    </DropdownTrigger>

                    <DropdownContent align="start">
                        <div className="ck-dropdown-content" style={dropdownThemeStyles}>
                            {currencies.map(currency => (
                                <DropdownItem
                                    key={currency.value}
                                    onSelect={() => handleSelect(currency.value as Currency)}
                                >
                                    <div className="ck-dropdown-item">
                                        <TokenIcon
                                            symbol={currency.value}
                                            size={16}
                                            data-testid={`token-icon-${currency.value}-dropdown`}
                                        />
                                        <span>{currency.symbol}</span>
                                        {selectedCurrency === currency.value && (
                                            <div
                                                className="ck-dropdown-check"
                                                style={{ '--primary-color': theme.primaryColor } as React.CSSProperties}
                                            >
                                                <CheckIcon />
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
    },
);

CurrencySelector.displayName = 'CurrencySelector';
