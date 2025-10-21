/**
 * @solana-commerce/solana-commerce
 *
 * Comprehensive Solana Commerce SDK - All-in-one package for Solana e-commerce solutions
 *
 * This meta package reexports all Commerce Kit packages for convenient single-import usage.
 * Instead of importing from individual packages, you can now import everything from:
 *
 * import { PaymentButton, useTransferSOL, ConnectorProvider } from '@solana-commerce/solana-commerce'
 */

// ===== MAIN EXPORTS - Most commonly used =====

// Main Payment Component (react)
export {
    PaymentButton,
    SolanaCommerceSDK, // deprecated alias
} from '@solana-commerce/react';

// Core React Providers (connector)
export { ConnectorProvider, AppProvider, WalletProvider, UnifiedProvider } from '@solana-commerce/connector';

// Solana SDK Provider (sdk)
export { ArcProvider } from '@solana-commerce/sdk';

// Main Hooks (sdk)
export { useTransferSOL, useTransferToken, useArcClient } from '@solana-commerce/sdk';

// Connector Hooks (connector)
export { useConnector, useConnectorClient } from '@solana-commerce/connector';

// ===== ALL EXPORTS BY PACKAGE =====

// Re-export everything from react
export * from '@solana-commerce/react';

// Re-export everything from connector
export * from '@solana-commerce/connector';

// Re-export everything from sdk
export * from '@solana-commerce/sdk';

// Re-export everything from solana-pay (including isValidSolanaAddress)
export * from '@solana-commerce/solana-pay';

// Note: @solana-commerce/headless is available via the HeadlessSDK namespace export below
// Not re-exported at top level to avoid isValidSolanaAddress conflict with solana-pay

// Note: ui-primitives is now internal to @solana-commerce/react

// ===== NAMESPACED EXPORTS FOR ADVANCED USAGE =====

import * as ConnectorKit from '@solana-commerce/connector';
import * as ReactSDK from '@solana-commerce/react';
import * as SolanaHooks from '@solana-commerce/sdk';
import * as HeadlessSDK from '@solana-commerce/headless';
import * as SolanaPay from '@solana-commerce/solana-pay';
// UIPrimitives namespace removed - ui-primitives is now internal to @solana-commerce/react

export { ConnectorKit, ReactSDK, SolanaHooks, HeadlessSDK, SolanaPay };

// ===== TYPE EXPORTS =====

// Main configuration types (react)
export type {
    MerchantConfig,
    ThemeConfig,
    SolanaCommerceConfig,
    PaymentCallbacks,
    PaymentButtonProps,
    PaymentConfig,
    Product,
} from '@solana-commerce/react';

// Connector types (connector)
export type {
    ConnectorState,
    ConnectorConfig,
    WalletInfo,
    AccountInfo,
    ConnectorSnapshot,
    UnifiedProviderProps,
    ConnectorTheme,
} from '@solana-commerce/connector';

// Hook return types (sdk)
export type {
    UseTransferSOLReturn,
    UseTransferTokenReturn,
    TransferTokenOptions,
    TransferTokenResult,
    TransferRetryConfig,
    ArcProviderProps,
    ArcWebClientConfig,
} from '@solana-commerce/sdk';

// Network and address types
export type { SolanaClusterMoniker, Address } from '@solana-commerce/sdk';
