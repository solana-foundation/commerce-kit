/**
 * Minimal config types - only what we need
 */

export interface SolanaConfig {
  network?: 'mainnet' | 'devnet' | 'testnet'
  rpcUrl?: string
}

export function createSolanaConfig(config: SolanaConfig): SolanaConfig {
  return {
    network: config.network || 'mainnet',
    rpcUrl: config.rpcUrl || 'https://api.mainnet-beta.solana.com',
    ...config
  }
}
