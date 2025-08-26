/**
 * @arc/solana/core - Minimal Bundle Export
 * 
 * BUNDLE SIZE: ~15KB (vs 90KB for full package)
 * 
 * Essential hooks only - perfect for simple dApps that need:
 * - Wallet connection & management
 * - SOL balance & transfers
 * - Network/cluster utilities
 * - Basic transaction sending
 * 
 * For advanced features (tokens, DeFi, etc), use the default export.
 */

// 🎯 Level 1: Beginner Essentials (Core hooks only)
export { useStandardWallets } from './hooks/use-standard-wallets'
export type { UseStandardWalletsOptions, UseStandardWalletsReturn, StandardWalletInfo } from './hooks/use-standard-wallets'

export { useBalance } from './hooks/use-balance'
export type { UseBalanceOptions, UseBalanceReturn } from './hooks/use-balance'

export { useTransferSOL } from './hooks/use-transfer-sol'
export type { TransferSOLOptions, TransferSOLResult, UseTransferSOLReturn } from './hooks/use-transfer-sol'

export { useAirdrop } from './hooks/use-airdrop'
export type { UseAirdropReturn } from './hooks/use-airdrop'

export { useCluster, useCanAirdrop, useExplorerUrls } from './hooks/use-cluster'
export type { UseClusterReturn } from './hooks/use-cluster'

// Essential provider and context (now with granular performance improvements)
export { ArcProvider, useWallet, useNetwork, useArc, useArcConfig } from './core/arc-provider'
export type { ArcWebClientConfig } from './core/arc-web-client'

// Advanced client state access
export { useArcClient } from './core/arc-client-provider'

// Core utilities
export type { Cluster, ClusterInfo } from './utils/cluster'
export { 
  detectClusterFromRpcUrl,
  getClusterInfo,
  getExplorerUrl,
  getFaucetUrl,
  isOfficialRpc,
  OFFICIAL_RPC_URLS
} from './utils/cluster'

// RPC performance utilities (exposed for advanced usage)
export { getRpcStats, cleanupAllRpcConnections } from './core/rpc-manager'
export type { RpcConnectionConfig } from './core/rpc-manager'