/**
 * @arc/solana/react - React Hooks Export
 * 
 * React-specific hooks and providers for Solana development.
 * Includes all hooks, even experimental ones, for maximum flexibility.
 * 
 * For minimal bundle size, use '@arc/solana/core' instead.
 */

// ===== PROVIDER =====
export { ArcProvider } from '../core/arc-provider'
export { useArcClient } from '../core/arc-client-provider'

// ===== CORE HOOKS =====
export { useBalance } from '../hooks/use-balance'
export type { UseBalanceOptions, UseBalanceReturn } from '../hooks/use-balance'

export { useAirdrop } from '../hooks/use-airdrop'
export type { UseAirdropReturn } from '../hooks/use-airdrop'

// Convenience wallet address hook
export { useWalletAddress } from '../hooks/use-wallet-address'
export type { UseWalletAddressReturn } from '../hooks/use-wallet-address'

export { useTransferSOL } from '../hooks/use-transfer-sol'
export type { UseTransferSOLReturn } from '../hooks/use-transfer-sol'

// ===== WALLET HOOKS =====
export { useWallet } from '../core/arc-provider'  // Backward compatibility hook
export type { ArcWebClientState } from '../core/arc-web-client'

export { useStandardWallets } from '../hooks/use-standard-wallets'
export type { UseStandardWalletsOptions, UseStandardWalletsReturn } from '../hooks/use-standard-wallets'

export { useWalletAdapters } from '../hooks/use-wallet-adapters'
export type { UseWalletAdaptersOptions, UseWalletAdaptersReturn } from '../hooks/use-wallet-adapters'

// ===== NETWORK/CLUSTER HOOKS =====
export { useCluster, useCanAirdrop, useExplorerUrls } from '../hooks/use-cluster'
export type { UseClusterReturn } from '../hooks/use-cluster'

export { useNetwork } from '../core/arc-provider'
export { useSlot } from '../hooks/use-slot'
export type { UseSlotOptions, UseSlotReturn } from '../hooks/use-slot'
export { useLatestBlockhash } from '../hooks/use-latest-blockhash'
export type { UseLatestBlockhashOptions, UseLatestBlockhashReturn } from '../hooks/use-latest-blockhash'
export { useRecentPrioritizationFees } from '../hooks/use-recent-prioritization-fees'
export type { UseRecentPrioritizationFeesOptions, UseRecentPrioritizationFeesReturn } from '../hooks/use-recent-prioritization-fees'
export { useSignatureStatuses } from '../hooks/use-signature-statuses'
export type { UseSignatureStatusesOptions, UseSignatureStatusesReturn } from '../hooks/use-signature-statuses'
export { useBlockHeight } from '../hooks/use-block-height'
export type { UseBlockHeightOptions, UseBlockHeightReturn } from '../hooks/use-block-height'
export { useEpochInfo } from '../hooks/use-epoch-info'
export type { UseEpochInfoOptions, UseEpochInfoReturn } from '../hooks/use-epoch-info'
export { useMultipleAccounts } from '../hooks/use-multiple-accounts'
export type { UseMultipleAccountsOptions, UseMultipleAccountsReturn, AccountInfo } from '../hooks/use-multiple-accounts'

// ===== TRANSACTION HOOKS =====
export { useTransaction } from '../hooks/use-transaction'
export type { UseTransactionOptions, UseTransactionReturn } from '../hooks/use-transaction'

// ===== ACCOUNT HOOKS =====
export { useAccount } from '../hooks/use-account'
export type { UseAccountOptions, UseAccountReturn } from '../hooks/use-account'

export { useMint } from '../hooks/use-mint'
export type { UseMintOptions, UseMintReturn } from '../hooks/use-mint'

export { useProgramAccount } from '../hooks/use-program-account'
export type { UseProgramAccountOptions, UseProgramAccountReturn, CustomCodec, MintAccount } from '../hooks/use-program-account'

// ===== TOKEN HOOKS =====
export { useTokenAccount } from '../hooks/use-token-account'
export type { UseTokenAccountOptions, UseTokenAccountReturn } from '../hooks/use-token-account'

export { useTokenBalance } from '../hooks/use-token-balance'
export type { UseTokenBalanceOptions, UseTokenBalanceReturn } from '../hooks/use-token-balance'

export { useTokenAccountsByOwner } from '../hooks/use-token-accounts-by-owner'
export type { UseTokenAccountsByOwnerOptions, UseTokenAccountsByOwnerReturn, TokenAccount } from '../hooks/use-token-accounts-by-owner'

export { useTransferToken } from '../hooks/use-transfer-token'
export type { UseTransferTokenReturn } from '../hooks/use-transfer-token'

export { useCreateToken } from '../hooks/use-create-token'
export type { UseCreateTokenReturn } from '../hooks/use-create-token'

export { useCreateTokenAccount } from '../hooks/use-create-token-account'
export type { UseCreateTokenAccountReturn } from '../hooks/use-create-token-account'

export { useMintTokens } from '../hooks/use-mint-tokens'
export type { UseMintTokensReturn } from '../hooks/use-mint-tokens'

export { useBurnTokens } from '../hooks/use-burn-tokens'
export type { UseBurnTokensReturn } from '../hooks/use-burn-tokens'

// ===== DEFI HOOKS =====
export { useSwap } from '../hooks/use-swap'
export type { UseSwapOptions, UseSwapReturn } from '../hooks/use-swap'

export { useStakeAccount } from '../hooks/use-stake-account'
export type { UseStakeAccountReturn } from '../hooks/use-stake-account'

// ===== SCHEMA VALIDATION UTILITIES (from use-object pattern) =====
export { 
  safeValidate,
  validateOrThrow,
  createValidator,
  AddressSchema,
  BigIntAmountSchema,
  AccountInfoSchema,
  TokenAccountSchema,
  MintAccountSchema
} from '../utils/schema-validation'
export type { 
  Schema, 
  ValidationResult, 
  ValidationError,
  SchemaValidationCallbacks
} from '../utils/schema-validation'

// ===== RE-EXPORT TYPES =====
// Make common types available from react entry point
export type {
  // Core types
  BalanceOptions,
  TransferOptions,
  AirdropOptions,
  TransactionResult,

  UseBalanceResult,
  UseTransferResult,
  Network,
  NetworkConfig
} from '../types'

// ===== QUERY UTILITIES =====
// For cache management and invalidation
export { queryKeys } from '../utils/query-keys'
export { QueryInvalidator, createInvalidator } from '../utils/invalidate'
export type { InvalidateOptions } from '../utils/invalidate'

// ===== OPTIONAL SUBMODULE RE-EXPORTS (types only or convenience) =====
export { useProgramQuery, useProgramInstruction } from '../programs'
export { useGraphQL } from '../graphql'
export { useAccountSubscribe } from '../subscriptions'

// ===== ADDRESS HELPERS (convenience re-exports) =====
export { address } from '@solana/kit'
export type { Address } from '@solana/kit'
