import React, { memo } from 'react';
import { getBorderRadius, sanitizeString } from '../../utils';
import { type ThemeConfig, type MerchantConfig, type Currency, CurrencyMap} from '../../types';
import { useSolanaPay } from '../../hooks/use-solana-pay';
import { SPLToken } from '@solana-commerce/solana-pay';

interface QRPaymentContentProps {
  theme: Required<ThemeConfig>;
  config: { merchant: MerchantConfig };
  selectedAmount: number;
  selectedCurrency: Currency;
  customAmount: string;
  showCustomInput: boolean;
}

export const QRPaymentContent = memo<QRPaymentContentProps>(({
  theme,
  config,
  selectedAmount,
  selectedCurrency,
  customAmount,
  showCustomInput
}) => {
  const displayAmount = showCustomInput ? customAmount || '0' : selectedAmount.toString();

  console.log(config, selectedAmount, selectedCurrency, customAmount, showCustomInput);
  
  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      {/* QR Code Placeholder */}
      <div style={{
        width: '280px',
        height: '280px',
        margin: '0 auto 2rem auto',
        backgroundColor: theme.backgroundColor === '#ffffff' ? '#f9fafb' : `${theme.backgroundColor}10`,
        border: `2px dashed ${theme.primaryColor}40`,
        borderRadius: getBorderRadius(theme.borderRadius),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          color: `${theme.textColor}70`,
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          {(() => {
            const { paymentRequest, loading } = useSolanaPay(config.merchant.wallet, selectedAmount, CurrencyMap[selectedCurrency]);
            
            if (loading) {
              return (
                <div style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.textColor
                }}>
                  Loading QR code...
                </div>
              );
            }
            
            if (!paymentRequest) {
              return (
                <div style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.textColor
                }}>
                  Failed to generate QR code
                </div>
              );
            }
            
            return (
              <div 
                dangerouslySetInnerHTML={{ __html: paymentRequest.qr }}
                style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            );
          })()}
        </div>
      </div>

      {/* Payment Summary */}
      <div style={{
        backgroundColor: theme.backgroundColor === '#ffffff' ? '#f9fafb' : `${theme.backgroundColor}20`,
        padding: '1rem',
        borderRadius: getBorderRadius(theme.borderRadius),
        border: `1px solid ${theme.backgroundColor === '#ffffff' ? '#e5e7eb' : `${theme.textColor}10`}`
      }}>
        <h3 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.textColor
        }}>
          Send ${displayAmount} {selectedCurrency}
        </h3>
        <p style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.875rem',
          color: `${theme.textColor}70`
        }}>
          to {sanitizeString(config.merchant.name)}
        </p>
        <div style={{
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: `${theme.textColor}60`,
          backgroundColor: theme.backgroundColor === '#ffffff' ? '#ffffff' : `${theme.backgroundColor}10`,
          padding: '0.5rem',
          borderRadius: '6px',
          wordBreak: 'break-all',
          border: `1px solid ${theme.backgroundColor === '#ffffff' ? '#e5e7eb' : `${theme.textColor}10`}`
        }}>
          {config.merchant.wallet}
        </div>
      </div>
    </div>
  );
});

QRPaymentContent.displayName = 'QRPaymentContent';