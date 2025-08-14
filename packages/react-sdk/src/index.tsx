"use client";

/**
 * Solana Commerce SDK - React Components
 * Production-ready e-commerce solution for Solana payments
 */

// Re-export legacy components
export { SolanaPayButton } from './solana-pay-button';
export * from './components';
export * from './hooks';

// Re-export types for public API
export type {
  MerchantConfig,
  ThemeConfig,
  SolanaCommerceConfig,
  PaymentCallbacks,
  SolanaCommerceSDKProps,
  CommerceMode,
  Position,
  BorderRadius,
  Network
} from './types';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { DialogTrigger } from '../../ui-primitives/src/react';
import { ModalShell } from './components/ui/modal-shell';
import { SecureIframeShell } from './components/ui/secure-iframe-shell';
import {
  useTheme,
  useTotalAmount,
  usePaymentUrl,
  validateWalletAddress,
  createPaymentError,
  getBorderRadius,
  sanitizeString
} from './utils';
import { TriggerButton, ProductList, PaymentModalContent } from './components/ui';
import { TipModalContent } from './components/tip-modal';
import type { SolanaCommerceSDKProps, PaymentMethod } from './types';

/**
 * Main Solana Commerce SDK Component
 */
export const SolanaCommerceSDK = memo<SolanaCommerceSDKProps>(function SolanaCommerceSDK({
  config,
  children,
  className,
  style,
  variant,
  onPayment,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) {
  const theme = useTheme(config.theme);
  const totalAmount = useTotalAmount(config.mode, config.products);
  const paymentUrl = usePaymentUrl(config.merchant, totalAmount, config.mode);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePayment = useCallback(() => {
    try {
      onPaymentStart?.();
      onPayment?.(totalAmount, config.allowedMints?.[0] || 'SOL', config.products);
    } catch (error) {
      onPaymentError?.(error instanceof Error ? error : createPaymentError('Payment initialization failed', error));
    }
  }, [totalAmount, config.allowedMints, config.products, onPaymentStart, onPayment, onPaymentError]);

  const handleTipPayment = useCallback((amount: number, currency: string, paymentMethod: PaymentMethod) => {
    try {
      onPaymentStart?.();
      // For tips, create a simple product representation
      const tipProduct = {
        id: 'tip-payment',
        name: 'Tip',
        description: `Tip payment via ${paymentMethod}`,
        price: amount,
        currency
      };
      onPayment?.(amount, currency, [tipProduct]);
    } catch (error) {
      onPaymentError?.(error instanceof Error ? error : createPaymentError('Tip payment failed', error));
    }
  }, [onPaymentStart, onPayment, onPaymentError]);

  const handleCancel = useCallback(() => {
    setIsDialogOpen(false);
    onCancel?.();
  }, [onCancel]);

  const handleTriggerClick = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  // Input validation
  if (!validateWalletAddress(config.merchant.wallet)) {
    console.error('Invalid merchant wallet address');
    return null;
  }

  if (totalAmount <= 0 && config.mode !== 'tip') {
    console.error('Invalid product pricing');
    return null;
  }

  // Render inline or overlay based on position
  if (config.position === 'inline') {
    return (
      <div style={{ fontFamily: theme.fontFamily, ...style }} className={className}>
        <div style={{
          backgroundColor: theme.backgroundColor,
          border: `1px solid ${theme.primaryColor}20`,
          borderRadius: getBorderRadius(theme.borderRadius),
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <h3 style={{ color: theme.textColor, marginTop: 0 }}>
            {sanitizeString(config.merchant.name)}
          </h3>
          <ProductList
            products={config.products || []}
            theme={theme}
            showDetails={config.showProductDetails ?? true}
          />
          <TriggerButton
            theme={theme}
            mode={config.mode}
            onClick={handlePayment}
            variant={variant}
            style={{ width: '100%', marginTop: '1rem' }}
          />
        </div>
      </div>
    );
  }

  // Overlay mode (modal)
  return (
    <>
      <ModalShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isolation={config.isolation}
        trigger={
          (children as React.ReactNode) || (
            <TriggerButton
              theme={theme}
              mode={config.mode}
              className={className}
              style={style}
              variant={variant}
              onClick={handleTriggerClick}
            />
          )
        }
      >
        {config.isolation === 'secure' ? (
          <SecureIframeShell
            config={config}
            theme={theme}
            onPayment={(amount, currency) => {
              try {
                onPaymentStart?.();
                onPayment?.(amount, currency, config.products);
              } catch (error) {
                onPaymentError?.(
                  error instanceof Error
                    ? error
                    : createPaymentError('Payment initialization failed', error)
                );
              }
            }}
            onCancel={handleCancel}
          />
        ) : config.mode === 'tip' ? (
          <TipModalContent
            config={config}
            theme={theme}
            onPayment={handleTipPayment}
            onCancel={handleCancel}
          />
        ) : (
          <PaymentModalContent
            config={config}
            theme={theme}
            totalAmount={totalAmount}
            paymentUrl={paymentUrl}
            onPayment={handlePayment}
            onCancel={handleCancel}
          />
        )}
      </ModalShell>
    </>
  );
});

SolanaCommerceSDK.displayName = 'SolanaCommerceSDK';