"use client";

/**
 * Solana Commerce SDK - React Components
 * Production-ready e-commerce solution for Solana payments
 */

// Re-export components
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

// Re-export payment configuration types
export type { PaymentConfig, Product } from './components/ui/secure-iframe-shell';

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { DialogTrigger } from '../../ui-primitives/src/react';
import { ModalShell } from './components/ui/modal-shell';
import { SecureIframeShell } from './components/ui/secure-iframe-shell';
import { AppProvider } from '@solana-commerce/connector-kit';
import { ArcProvider } from '@solana-commerce/solana-hooks';
import {
  useTheme,
  useTotalAmount,
  usePaymentUrl,
  validateWalletAddress,
  createPaymentError,
  getBorderRadius
} from './utils';
import { TriggerButton } from './components/ui';
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
  onCancel,
  paymentConfig
}) {
  const theme = useTheme(config.theme);
  const totalAmount = useTotalAmount(config.mode, paymentConfig);
  const paymentUrl = usePaymentUrl(config.merchant, totalAmount, config.mode);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // SSR-safe check - use state to track if we're on client
  const [isClient, setIsClient] = useState(false);
  
  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);





  const handleCancel = useCallback(() => {
    if (!isClient) return; // Prevent SSR issues
    setIsDialogOpen(false);
    onCancel?.();
  }, [onCancel, isClient]);

  const handleTriggerClick = useCallback(() => {
    if (!isClient) return; // Prevent SSR issues
    setIsDialogOpen(true);
  }, [isClient]);

  // Memoize the connector config to prevent recreating ConnectorClient on re-renders
  const connectorConfig = useMemo(() => ({
    autoConnect: false, 
    debug: process.env.NODE_ENV !== 'production',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }), []);

  // Validation checks AFTER all hooks to prevent React hooks rule violations
  const isValidWallet = validateWalletAddress(config.merchant.wallet);
  const isValidPricing = config.mode === 'tip' || totalAmount > 0;

  // Handle validation errors gracefully without early returns
  if (!isValidWallet) {
    console.error('Invalid merchant wallet address');
    return (
      <div 
        className={className}
        style={{
          padding: '1rem',
          borderRadius: getBorderRadius(theme.borderRadius),
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5',
          fontFamily: theme.fontFamily,
          ...style
        }}
      >
        <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
          Invalid Configuration
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          Please provide a valid Solana wallet address.
        </div>
      </div>
    );
  }

  if (!isValidPricing) {
    console.error('Invalid product pricing');
    return (
      <div 
        className={className}
        style={{
          padding: '1rem',
          borderRadius: getBorderRadius(theme.borderRadius),
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5',
          fontFamily: theme.fontFamily,
          ...style
        }}
      >
        <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
          Invalid Pricing
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          Please configure valid product pricing.
        </div>
      </div>
    );
  }

  // Determine network and RPC for the global ArcProvider
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  // Force mainnet for testing with real USDC - change back to devnet logic later if needed
  const rpcUrl = config.rpcUrl || 'https://api.mainnet-beta.solana.com';
  const network = 'mainnet';

  // Single AppProvider + ArcProvider for the entire component
  return (
    <AppProvider connectorConfig={connectorConfig}>
      <ArcProvider config={{ network, rpcUrl }}>
        {renderContent()}
      </ArcProvider>
    </AppProvider>
  );
  
  function renderContent() {
    // Render inline or overlay based on position
    if (config.position === 'inline') {
    return (
      <div style={{ fontFamily: theme.fontFamily, ...style }} className={className}>
        {isClient ? (
          <SecureIframeShell
            config={config}
            theme={theme}
            onPayment={(amount, currency) => {
              try {
                onPaymentStart?.();
                onPayment?.(amount, currency);
              } catch (error) {
                onPaymentError?.(
                  error instanceof Error
                    ? error
                    : createPaymentError('Payment initialization failed', error)
                );
              }
            }}
            onCancel={handleCancel}
            paymentConfig={paymentConfig}
          />
        ) : (
          // Server-side placeholder
          <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading...
          </div>
        )}
      </div>
    );
  }

  // Overlay mode (modal) - always render the same structure for SSR consistency
  return (
    <>
      <ModalShell
        open={isClient ? isDialogOpen : false} // Always closed on server
        onOpenChange={isClient ? setIsDialogOpen : () => {}} // No-op on server
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
        {isClient ? (
          <SecureIframeShell
            config={config}
            theme={theme}
            onPayment={(amount, currency) => {
              try {
                onPaymentStart?.();
                onPayment?.(amount, currency);
              } catch (error) {
                onPaymentError?.(
                  error instanceof Error
                    ? error
                    : createPaymentError('Payment initialization failed', error)
                );
              }
            }}
            onCancel={handleCancel}
            paymentConfig={paymentConfig}
          />
        ) : (
          // Server-side placeholder for modal content
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            Loading...
          </div>
        )}
      </ModalShell>
    </>
    );
  }
});

SolanaCommerceSDK.displayName = 'SolanaCommerceSDK';