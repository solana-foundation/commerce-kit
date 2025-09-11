/**
 * Minimal cluster utilities - only what we need
 */

export type ClusterInfo = {
  name: string
  rpcUrl: string
  wsUrl?: string
  isMainnet: boolean
  isDevnet: boolean
  isTestnet: boolean
}

export function getClusterInfo(network: string): ClusterInfo {
  switch (network) {
    case 'mainnet':
    case 'mainnet-beta':
      return {
        name: 'mainnet',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        wsUrl: 'wss://api.mainnet-beta.solana.com',
        isMainnet: true,
        isDevnet: false,
        isTestnet: false
      }
    case 'devnet':
      return {
        name: 'devnet', 
        rpcUrl: 'https://api.devnet.solana.com',
        wsUrl: 'wss://api.devnet.solana.com',
        isMainnet: false,
        isDevnet: true,
        isTestnet: false
      }
    case 'testnet':
      return {
        name: 'testnet',
        rpcUrl: 'https://api.testnet.solana.com', 
        wsUrl: 'wss://api.testnet.solana.com',
        isMainnet: false,
        isDevnet: false,
        isTestnet: true
      }
    default:
      // Assume custom RPC URL (treat as mainnet by default)
      return {
        name: 'custom',
        rpcUrl: network,
        isMainnet: true,
        isDevnet: false,
        isTestnet: false
      }
  }
}
