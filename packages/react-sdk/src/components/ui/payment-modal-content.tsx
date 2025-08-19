import React, { memo } from 'react';
import { DialogClose } from '../../../../ui-primitives/src/react';
import { 
  getBorderRadius, 
  getModalBorderRadius,
  sanitizeString, 
  formatSolAmount
} from '../../utils';
import { ProductList } from './product-list';
import type { PaymentModalContentProps } from '../../types';

export const PaymentModalContent = memo<PaymentModalContentProps>(({ 
  config, 
  theme, 
  totalAmount, 
  paymentUrl, 
  onPayment, 
  onCancel 
}) => (
  <div style={{
    fontFamily: theme.fontFamily,
    backgroundColor: theme.backgroundColor,
    padding: '2rem',
    maxWidth: '560px',
    minWidth: 'min(560px, 100vw)',
    width: '100%',
    borderRadius: getModalBorderRadius(theme.borderRadius),
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  }}>
    {/* Header */}
    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
      {config.merchant.logo && (
        <img 
          src={config.merchant.logo} 
          alt={sanitizeString(config.merchant.name)}
          style={{ width: '48px', height: '48px', marginBottom: '0.5rem' }}
        />
      )}
      <h2 style={{ 
        marginTop: 0, 
        marginBottom: '0.5rem',
        fontSize: '1.5rem',
        fontWeight: '700',
        color: theme.textColor
      }}>
        {sanitizeString(config.merchant.name)}
      </h2>
      {config.merchant.description && (
        <p style={{ color: `${theme.textColor}80`, margin: 0 }}>
          {sanitizeString(config.merchant.description)}
        </p>
      )}
    </div>

    {/* Products */}
    <ProductList
      products={config.products || []}
      theme={theme}
      showDetails={config.showProductDetails ?? true}
    />

    {/* QR Code section */}
    {config.showQR !== false && (
      <div style={{
        backgroundColor: theme.backgroundColor === '#ffffff' ? '#f9fafb' : `${theme.backgroundColor}10`,
        padding: '2rem',
        borderRadius: getBorderRadius(theme.borderRadius),
        marginBottom: '1rem',
        textAlign: 'center',
        border: `2px dashed ${theme.primaryColor}40`
      }}>
        <p style={{ margin: 0, color: `${theme.textColor}70` }}>QR Code Implementation</p>
      </div>
    )}
    
    {/* Payment URL */}
    <p style={{ 
      fontSize: '0.75rem', 
      color: `${theme.textColor}60`,
      wordBreak: 'break-all',
      backgroundColor: theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.backgroundColor}20`,
      padding: '0.75rem',
      borderRadius: getBorderRadius('sm'),
      marginBottom: '1.5rem',
      fontFamily: 'monospace'
    }}>
      {paymentUrl || 'Generating payment URL...'}
    </p>
    
    {/* Action buttons */}
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <button
        onClick={onPayment}
        style={{ 
          flex: 1,
          padding: '0.75rem 1.5rem',
          backgroundColor: theme.primaryColor,
          color: 'white',
          border: 'none',
          borderRadius: getBorderRadius(theme.borderRadius),
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        type="button"
      >
        Pay {formatSolAmount(totalAmount)} SOL
      </button>
      <DialogClose asChild>
        <button 
          onClick={onCancel}
          style={{ 
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: theme.textColor,
            border: `1px solid ${theme.textColor}30`,
            borderRadius: getBorderRadius(theme.borderRadius),
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          type="button"
        >
          Cancel
        </button>
      </DialogClose>
    </div>
  </div>
));

PaymentModalContent.displayName = 'PaymentModalContent';