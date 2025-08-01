import React, { memo } from 'react';
import { getBorderRadius, sanitizeString } from '../../utils';
import type { ThemeConfig, MerchantConfig, Currency } from '../../types';
import { SPLToken } from '@solana-commerce/solana-pay';

interface WalletPaymentContentProps {
  theme: Required<ThemeConfig>;
  config: { merchant: MerchantConfig };
  selectedAmount: number;
  selectedCurrency: Currency;
  customAmount: string;
  showCustomInput: boolean;
  onPaymentComplete: () => void;
  walletIcon: React.ReactNode;
}

export const WalletPaymentContent = memo<WalletPaymentContentProps>(({
  theme,
  config,
  selectedAmount,
  selectedCurrency,
  customAmount,
  showCustomInput,
  onPaymentComplete,
  walletIcon
}) => {
  const displayAmount = showCustomInput ? customAmount || '0' : selectedAmount.toString();

  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      {/* Payment Info */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.textColor
        }}>
          Send ${displayAmount} {selectedCurrency}
        </h3>
        <p style={{
          margin: '0 0 1rem 0',
          fontSize: '0.875rem',
          color: `${theme.textColor}70`
        }}>
          to {sanitizeString(config.merchant.name)}
        </p>
      </div>

      {/* Wallet Adapter Placeholder */}
      <div style={{
        padding: '3rem 2rem',
        backgroundColor: theme.backgroundColor === '#ffffff' ? '#f9fafb' : `${theme.backgroundColor}20`,
        border: `2px dashed ${theme.primaryColor}40`,
        borderRadius: getBorderRadius(theme.borderRadius),
        marginBottom: '2rem'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 1rem auto',
          backgroundColor: theme.primaryColor,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          {walletIcon}
        </div>
        <p style={{
          margin: 0,
          color: `${theme.textColor}70`,
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Wallet Adapter Integration
        </p>
        <p style={{
          margin: '0.5rem 0 0 0',
          color: `${theme.textColor}50`,
          fontSize: '0.75rem'
        }}>
          Connect your Solana wallet to complete payment
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={onPaymentComplete}
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: theme.primaryColor,
          color: 'white',
          border: 'none',
          borderRadius: getBorderRadius(theme.borderRadius),
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        type="button"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.secondaryColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.primaryColor;
        }}
      >
        Connect Wallet
      </button>
    </div>
  );
});

WalletPaymentContent.displayName = 'WalletPaymentContent';