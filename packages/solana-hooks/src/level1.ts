/**
 * 🎯 Level 1: Zero Config Functions
 * 
 * Simple functions that just work™
 * - No providers required
 * - No complex setup  
 * - Smart defaults
 * - Clear error messages
 */

import { createSolanaRpc, address } from '@solana/kit'

// Smart defaults for development
const DEFAULT_NETWORKS = {
  'mainnet': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com'
} as const

let currentNetwork: keyof typeof DEFAULT_NETWORKS = 'devnet'
let rpc = createSolanaRpc(DEFAULT_NETWORKS.devnet)

// ===== CONFIGURATION =====

export interface ConfigureOptions {
  /** Network to use - defaults to devnet for development */
  network?: 'mainnet' | 'devnet' | 'testnet'
  /** Custom RPC URL - overrides network setting */
  rpcUrl?: string
}

/**
 * Configure Arc Solana (optional)
 * @param options - Configuration options
 * 
 * @example
 * ```js
 * import { configure } from '@arc/solana'
 * 
 * // Use mainnet
 * configure({ network: 'mainnet' })
 * 
 * // Use custom RPC
 * configure({ rpcUrl: 'https://my-rpc.com' })
 * ```
 */
export function configure(options: ConfigureOptions = {}) {
  if (options.rpcUrl) {
    rpc = createSolanaRpc(options.rpcUrl)
  } else if (options.network) {
    currentNetwork = options.network
    rpc = createSolanaRpc(DEFAULT_NETWORKS[options.network])
  }
}

// ===== CORE FUNCTIONS =====

export interface BalanceOptions {
  /** Address to check balance for */
  address: string
}

/**
 * Get SOL balance for any address
 * @param address - Solana address to check
 * @returns Balance in SOL (number)
 * 
 * @example
 * ```js
 * import { getBalance } from '@arc/solana'
 * 
 * const balance = await getBalance('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
 * console.log(`Balance: ${balance} SOL`)
 * ```
 */
export async function getBalance(walletAddress: string): Promise<number> {
  try {
    const response = await rpc.getBalance(address(walletAddress)).send()
    return Number(response.value) / 1_000_000_000 // Convert lamports to SOL
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to get balance for ${walletAddress}: ${message}`)
  }
}

export interface TransferOptions {
  /** Sender's private key or keypair */
  from: string | Uint8Array
  /** Recipient address */
  to: string
  /** Amount in SOL (e.g., "0.1") */
  amount: string
}

export interface TransactionResult {
  /** Transaction signature */
  signature: string
  /** Explorer URL to view transaction */
  explorerUrl: string
  /** Amount transferred in SOL */
  amount: number
}

/**
 * Transfer SOL between addresses
 * @param options - Transfer details
 * @returns Transaction result
 * 
 * @example
 * ```js
 * import { transferSOL } from '@arc/solana'
 * 
 * const result = await transferSOL({
 *   from: privateKey,  // Uint8Array or base58 string
 *   to: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
 *   amount: '0.1'  // 0.1 SOL
 * })
 * 
 * console.log(`Sent! Signature: ${result.signature}`)
 * console.log(`View: ${result.explorerUrl}`)
 * ```
 */
export async function transferSOL(options: TransferOptions): Promise<TransactionResult> {
  // TODO: Implement actual transfer using @solana/kit
  // For now, throw with clear message about what's needed
  throw new Error('transferSOL implementation needed - requires transaction building with @solana/kit')
  
  // Implementation would:
  // 1. Create keypair from private key
  // 2. Build transfer instruction 
  // 3. Send and confirm transaction
  // 4. Return result with explorer URL
}

export interface AirdropOptions {
  /** Address to receive airdrop */
  address: string
  /** Amount in SOL - defaults to "1" */
  amount?: string
}

/**
 * Request airdrop on devnet/testnet
 * @param address - Address to receive airdrop  
 * @param amount - Amount in SOL (default: "1")
 * @returns Transaction result
 * 
 * @example
 * ```js
 * import { requestAirdrop } from '@arc/solana'
 * 
 * const result = await requestAirdrop('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
 * console.log(`Airdrop complete! ${result.explorerUrl}`)
 * ```
 */
export async function requestAirdrop(
  walletAddress: string, 
  amount: string = "1"
): Promise<TransactionResult> {
  if (currentNetwork === 'mainnet') {
    throw new Error('Airdrops are not available on mainnet. Use devnet or testnet.')
  }
  
  // TODO: Implement airdrop
  throw new Error('requestAirdrop implementation needed')
}

/**
 * Get transaction details by signature
 * @param signature - Transaction signature
 * @returns Transaction details
 * 
 * @example
 * ```js
 * import { getTransaction } from '@arc/solana'
 * 
 * const tx = await getTransaction('5VERVy...')
 * console.log(`Transaction status: ${tx.status}`)
 * ```
 */
export async function getTransaction(signature: string) {
  try {
    const response = await rpc.getTransaction(signature as any).send()
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to get transaction ${signature}: ${message}`)
  }
}