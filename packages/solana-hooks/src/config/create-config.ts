import type { Transport } from '../transports/types'
import { createHttpTransport } from '../transports/http'

export interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export interface SolanaConfigInit {
  transport?: Transport
  rpcUrl?: string
  network?: 'mainnet' | 'devnet' | 'testnet'
  storage?: StorageAdapter
  autoConnect?: boolean
  debug?: boolean
}

export interface SolanaConfig extends Required<Omit<SolanaConfigInit, 'rpcUrl' | 'network'>> {
  rpcUrl: string
  network: 'mainnet' | 'devnet' | 'testnet'
}

function inferRpcUrl(network?: 'mainnet' | 'devnet' | 'testnet'): string {
  if (network === 'mainnet') return 'https://api.mainnet-beta.solana.com'
  if (network === 'testnet') return 'https://api.testnet.solana.com'
  return 'https://api.devnet.solana.com'
}

export function createSolanaConfig(init: SolanaConfigInit = {}): SolanaConfig {
  const rpcUrl = init.rpcUrl ?? inferRpcUrl(init.network)
  const transport = init.transport ?? createHttpTransport({ url: rpcUrl, timeoutMs: 15000, retry: { attempts: 2, strategy: 'exponential', baseDelayMs: 300, jitter: true } })
  return {
    transport,
    rpcUrl,
    network: init.network ?? 'devnet',
    storage: init.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined as any),
    autoConnect: init.autoConnect ?? false,
    debug: init.debug ?? false,
  }
}


