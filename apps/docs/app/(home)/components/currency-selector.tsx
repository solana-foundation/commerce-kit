'use client';

import { cn } from '../../../lib/utils';
import {
  DropdownRoot,
  DropdownTrigger,
  DropdownContent,
  DropdownItem
} from '../../../../../packages/ui-primitives/src/react';

interface SupportedCurrenciesProps {
  supportedCurrencies: string[];
  onChange: (currencies: string[]) => void;
}

const availableCurrencies = [
  { 
    name: 'SOL', 
    value: 'SOL',
    symbol: '◎',
    description: 'Solana native token',
    color: '#9945FF'
  },
  { 
    name: 'USDC', 
    value: 'USDC',
    symbol: '$',
    description: 'USD Coin stablecoin',
    color: '#2775CA'
  },
  { 
    name: 'USDT', 
    value: 'USDT',
    symbol: '₮',
    description: 'Tether USD stablecoin',
    color: '#26A17B'
  },
  { 
    name: 'USDC_DEVNET', 
    value: 'USDC_DEVNET',
    symbol: '$',
    description: 'USD Coin (Devnet)',
    color: '#2775CA'
  },
  { 
    name: 'SOL_DEVNET', 
    value: 'SOL_DEVNET',
    symbol: '◎',
    description: 'Solana (Devnet)',
    color: '#9945FF'
  },
  { 
    name: 'USDT_DEVNET', 
    value: 'USDT_DEVNET',
    symbol: '₮',
    description: 'Tether USD (Devnet)',
    color: '#26A17B'
  },
];

export function SupportedCurrencies({ supportedCurrencies, onChange }: SupportedCurrenciesProps) {
  const handleCurrencyToggle = (currencyValue: string) => {
    if (supportedCurrencies.includes(currencyValue)) {
      // Remove currency, but ensure at least one remains
      const newCurrencies = supportedCurrencies.filter(c => c !== currencyValue);
      if (newCurrencies.length > 0) {
        onChange(newCurrencies);
      }
    } else {
      // Add currency
      onChange([...supportedCurrencies, currencyValue]);
    }
  };

  return (
    <div className="space-y-4 p-2">
      <div>
        <label className="block text-sm font-medium">Supported Currencies</label>
        <div className="text-xs text-gray-600 mb-6">Select which currencies customers can use for payment</div>
      </div>
      
      {/* Currency Grid */}
      <div className="grid grid-cols-3 gap-4">
        {availableCurrencies.map((currency) => {
          const isSelected = supportedCurrencies.includes(currency.value);
          
          return (
            <div key={currency.value} className="space-y-3">
              <div 
                className={cn(
                  "relative cursor-pointer rounded-xl p-3 h-20 transition-all duration-200 group overflow-hidden border flex items-center justify-center",
                  isSelected
                    ? 'border-zinc-400/50 ring-4 ring-inset-4 ring-zinc-300' 
                    : 'border-zinc-300 hover:border-zinc-200'
                )}
                onClick={() => handleCurrencyToggle(currency.value)}
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(46, 77, 97, 0.08) 10px,
                    rgba(46, 77, 97, 0.08) 11px
                  )`
                }}
              >
                <div 
                  className="text-white w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold relative"
                  style={{ backgroundColor: currency.color }}
                >
                  {currency.symbol}
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-left">
                <div className="text-sm font-medium text-slate-900">{currency.name}</div>
                <div className="text-xs text-slate-600">{currency.description}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Selection info */}
      <div className="text-xs text-gray-500 mt-2">
        {supportedCurrencies.length === 1 && (
          <span>At least one currency must be selected</span>
        )}
        {supportedCurrencies.length > 1 && (
          <span>{supportedCurrencies.length} currencies selected</span>
        )}
      </div>
    </div>
  );
}