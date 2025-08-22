/**
 * Tip Modal Header Component
 * Handles navigation, title, and close functionality
 */

import React, { memo } from 'react';
import { sanitizeString } from '../../utils';
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
    <div 
      className="ck-header"
      style={{
        '--header-border-color': theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`
      } as React.CSSProperties}
    >
      {/* Left side - Back (in payment) + Avatar + Title */}
      <div className="ck-header-left">
        {currentStep === 'payment' && (
          <button
            onClick={onBack}
            className="ck-header-back-button"
            type="button"
          >
            {BACK_ARROW_ICON}
          </button>
        )}
        {currentStep === 'form' && (
          config.merchant.logo ? (
            <img
              className="ck-header-avatar"
              src={config.merchant.logo}
              alt={`${sanitizeString(config.merchant.name)} logo`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="ck-header-avatar"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`
              }}
            />
          )
        )}
        {currentStep === 'form' && (
          <h2 className="ck-header-title">
            Support {sanitizeString(config.merchant.name)}
          </h2>
        )}
      </div>

      {currentStep === 'payment' && (
        <h2 className="ck-header-payment-title">
          {selectedPaymentMethod === 'qr' ? 'Scan to pay' : 'Connect Wallet'}
        </h2>
      )}

      {/* Right side - Close button */}
      <button
        className="ck-header-close-button"
        type="button"
        onClick={onClose}
      >
        {CLOSE_ICON}
      </button>
    </div>
  );
});

TipModalHeader.displayName = 'TipModalHeader';
