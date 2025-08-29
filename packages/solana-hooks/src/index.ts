/**
 * @arc/solana - Default Export
 * 
 * Complete SDK with all features. For specific use cases:
 * - React only: import from '@arc/solana/react'
 * - Minimal bundle: import from '@arc/solana/core'  
 * - Backend/server: import from '@arc/solana/client'
 * - Advanced features: import from '@arc/solana/experimental'
 */

// ===== LEVEL 1: ZERO CONFIG FUNCTIONS =====
// 🎯 For beginners - No setup required, just import and use

export { getBalance, transferSOL, requestAirdrop, getTransaction, configure } from './level1'

// ===== CLIENT API =====
// 🎯 For backend/server usage
export { createClient } from './client'

// Enterprise types removed from public surface (can be re-added via transports)

// ===== LEVEL 2: REACT HOOKS =====
// 🎯 For app developers - Available as @arc/solana/react
// Re-exported here for convenience, but main entry is /react

export { 
  ArcProvider,
  useBalance,
  useTransferSOL,
  useTransferToken, 
  useAirdrop,
  useWalletAddress,
  useWallet,
  useStandardWallets,
  useCluster,
  useNetwork,
  useTransaction,
  useSwap,
  useMint,
  useProgramAccount,
  useArcClient
} from './react'

// Export commonly used types
export type { CustomCodec, MintAccount, Schema, ValidationResult, UseTransferTokenReturn, TransferTokenOptions, TransferTokenResult } from './react'

// ===== ESSENTIAL TYPES ONLY =====
// Keep the public API surface minimal

export type {
  // Level 1 types
  BalanceOptions,
  TransferOptions,
  AirdropOptions,
  TransactionResult,
  
  // Level 2 types  
  ArcProviderProps,
  UseBalanceResult,
  UseTransferResult,
} from './types'

// Provider system types (export from core/provider)
export type {
  SwapProvider,
  SwapParams,
  SwapQuote,
  Provider,
  PrebuiltTransaction,
  SwapBuild
} from './core/provider'

// Provider helpers
export { createProvider } from './core/provider'
export { createSolanaConfig } from './config/create-config'

// ===== UTILITIES =====
// Query keys and invalidation helpers

export { queryKeys } from './utils/query-keys'
export { QueryInvalidator, createInvalidator } from './utils/invalidate'
export type { InvalidateOptions } from './utils/invalidate'

// ===== ADDRESS HELPERS (convenience re-exports) =====
export { address } from '@solana/kit'
export type { Address } from '@solana/kit'

// ===== OTHER EXPORTS =====
// More specific imports available via sub-paths:
// 
// @arc/solana/react - All React hooks and providers
// @arc/solana/core - Minimal bundle (15KB)
// @arc/solana/client - Backend API (no React)
// @arc/solana/experimental - Advanced features (v0 tx, MEV, etc)