/**
 * @solana-commerce/solana-hooks - Minimal Export
 *
 * Only exports what @react-sdk actually uses.
 * Reduced from 90KB to ~20KB bundle.
 */

// ===== CORE PROVIDER & HOOKS =====
export { ArcProvider } from './core/arc-provider';
export { useArcClient } from './core/arc-client-provider';
export { useTransferSOL } from './hooks/use-transfer-sol';
export { useTransferToken } from './hooks/use-transfer-token';

// Export essential types
export type { UseTransferSOLReturn } from './hooks/use-transfer-sol';
export type {
    UseTransferTokenReturn,
    TransferTokenOptions,
    TransferTokenResult,
    TransferRetryConfig,
    BlockhashExpirationError,
} from './hooks/use-transfer-token';

// Provider types
export type { ArcProviderProps } from './core/arc-provider';
export type { ArcWebClientConfig } from './core/arc-web-client';
export type { SolanaClusterMoniker } from 'gill';

// ===== ADDRESS HELPERS =====
export { address } from '@solana/kit';
export type { Address } from '@solana/kit';

// ===== QUERY UTILITIES (for cache management) =====
export { queryKeys } from './utils/query-keys';
export { QueryInvalidator, createInvalidator } from './utils/invalidate';
export type { InvalidateOptions } from './utils/invalidate';

// ===== CONFIGURATION =====

// ===== VALIDATION TYPES =====
export type { ValidationOptions, ValidationResult } from './utils/schema-validation';
