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
import { TriggerButton, ProductList } from './components/ui';
import type { SolanaCommerceSDKProps } from './types';

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
      </div>
    );
  }

  // Overlay mode (modal) - always uses secure iframe
  return (
    <>
      <ModalShell
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
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
      </ModalShell>
    </>
  );
});

SolanaCommerceSDK.displayName = 'SolanaCommerceSDK';