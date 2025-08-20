/**
 * Tip Modal Header Component
 * Handles navigation, title, and close functionality
 */

import React, { memo } from 'react';
import { getModalBorderRadius, sanitizeString } from '../../utils';
import { BACK_ARROW_ICON, CLOSE_ICON } from '../../constants/tip-modal';
import type { ThemeConfig, SolanaCommerceConfig, PaymentMethod } from '../../types';

interface TipModalHeaderProps {
  theme: Required<ThemeConfig>;
  config: SolanaCommerceConfig;
  currentStep: 'form' | 'payment';
  selectedPaymentMethod: PaymentMethod;
  onBack: () => void;
  onClose: () => void;
}

export const TipModalHeader = memo<TipModalHeaderProps>(({
  theme,
  config,
  currentStep,
  selectedPaymentMethod,
  onBack,
  onClose
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem',
      borderBottom: `1px solid ${theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`}`,
      position: 'relative'
    }}>
      {/* Left side - Back (in payment) + Avatar + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        {currentStep === 'payment' && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: `${theme.textColor}70`,
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            type="button"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${theme.primaryColor}10`;
              (e.currentTarget as HTMLButtonElement).style.color = theme.primaryColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = `${theme.textColor}70`;
            }}
          >
            {BACK_ARROW_ICON}
          </button>
        )}
        {currentStep === 'form' && (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
              background: config.merchant.logo ? 'transparent' : `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
              flexShrink: 0
            }}
          />
        )}
        {currentStep === 'form' && (
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: theme.textColor,
            textAlign: 'left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Support {sanitizeString(config.merchant.name)}
          </h2>
        )}
      </div>

      {currentStep === 'payment' && (
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: theme.textColor,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          {selectedPaymentMethod === 'qr' ? 'Scan to pay' : 'Connect Wallet'}
        </h2>
      )}

      {/* Right side - Close button */}
      <button
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          color: `${theme.textColor}60`,
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: '50%',
          width: '2rem',
          height: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        type="button"
        onClick={onClose}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${theme.primaryColor}10`;
          e.currentTarget.style.color = theme.primaryColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = `${theme.textColor}60`;
        }}
      >
        {CLOSE_ICON}
      </button>
    </div>
  );
});

TipModalHeader.displayName = 'TipModalHeader';
