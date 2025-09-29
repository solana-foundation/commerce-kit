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

// Main Payment Component (react-sdk)
export { 
    PaymentButton, 
    SolanaCommerceSDK // deprecated alias
} from '@solana-commerce/react';

// Core React Providers (connector-kit)
export { 
    ConnectorProvider, 
    AppProvider, 
    WalletProvider, 
    UnifiedProvider 
} from '@solana-commerce/connector';

// Solana Hooks Provider (solana-hooks)
export { ArcProvider } from '@solana-commerce/sdk';

// Main Hooks (solana-hooks)
export { 
    useTransferSOL, 
    useTransferToken, 
    useConnector, 
    useConnectorClient,
    useArcClient
} from '@solana-commerce/sdk';

// ===== ALL EXPORTS BY PACKAGE =====

// Re-export everything from react-sdk
export * from '@solana-commerce/react';

// Re-export everything from connector-kit  
export * from '@solana-commerce/connector';

// Re-export everything from solana-hooks
export * from '@solana-commerce/sdk';

// Re-export everything from headless-sdk
export * from '@solana-commerce/headless';

// Re-export everything from solana-pay
export * from '@solana-commerce/solana-pay';

// Note: ui-primitives is now internal to @solana-commerce/react

// ===== NAMESPACED EXPORTS FOR ADVANCED USAGE =====

import * as ConnectorKit from '@solana-commerce/connector';
import * as ReactSDK from '@solana-commerce/react';
import * as SolanaHooks from '@solana-commerce/sdk';
import * as HeadlessSDK from '@solana-commerce/headless';
import * as SolanaPay from '@solana-commerce/solana-pay';
// UIPrimitives namespace removed - ui-primitives is now internal to @solana-commerce/react

export {
    ConnectorKit,
    ReactSDK,
    SolanaHooks,
    HeadlessSDK,
    SolanaPay
};

// ===== TYPE EXPORTS =====

// Main configuration types (react-sdk)
export type {
    MerchantConfig,
    ThemeConfig,
    SolanaCommerceConfig,
    PaymentCallbacks,
    PaymentButtonProps,
    PaymentConfig,
    Product
} from '@solana-commerce/react';

// Connector types (connector-kit)  
export type {
    ConnectorState,
    ConnectorConfig,
    WalletInfo,
    AccountInfo,
    ConnectorSnapshot,
    UnifiedProviderProps,
    ConnectorTheme
} from '@solana-commerce/connector';

// Hook return types (solana-hooks)
export type {
    UseTransferSOLReturn,
    UseTransferTokenReturn,
    TransferTokenOptions,
    TransferTokenResult,
    TransferRetryConfig,
    ArcProviderProps,
    ArcWebClientConfig
} from '@solana-commerce/sdk';

// Network and address types
export type { 
    SolanaClusterMoniker,
    Address 
} from '@solana-commerce/sdk';


