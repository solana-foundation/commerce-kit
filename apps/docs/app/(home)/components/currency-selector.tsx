'use client';

import { Checkbox } from '../../../components/ui/checkbox';

interface SupportedCurrenciesProps {
  supportedCurrencies: string[];
  onChange: (currencies: string[]) => void;
}

const availableCurrencies = [
  { name: 'SOL', value: 'SOL' },
  { name: 'USDC', value: 'USDC' },
  { name: 'USDT', value: 'USDT' },
  { name: 'USDC_DEVNET', value: 'USDC_DEVNET' },
  { name: 'SOL_DEVNET', value: 'SOL_DEVNET' },
  { name: 'USDT_DEVNET', value: 'USDT_DEVNET' },
];

export function SupportedCurrencies({ supportedCurrencies, onChange }: SupportedCurrenciesProps) {
  const handleCurrencyToggle = (currencyValue: string, checked: boolean) => {
    if (checked) {
      // Add currency if not already included
      if (!supportedCurrencies.includes(currencyValue)) {
        onChange([...supportedCurrencies, currencyValue]);
      }
    } else {
      // Remove currency, but ensure at least one currency remains
      const newCurrencies = supportedCurrencies.filter(c => c !== currencyValue);
      if (newCurrencies.length > 0) {
        onChange(newCurrencies);
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-3">Supported Currencies</label>
      <div className="space-y-2">
        {availableCurrencies.map((currency) => (
          <div key={currency.value} className="flex items-center space-x-2">
            <Checkbox
              id={currency.value}
              checked={supportedCurrencies.includes(currency.value)}
              onCheckedChange={(checked) => handleCurrencyToggle(currency.value, checked as boolean)}
            />
            <label 
              htmlFor={currency.value}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {currency.name}
            </label>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Select which currencies customers can use for payment
      </p>
    </div>
  );
}