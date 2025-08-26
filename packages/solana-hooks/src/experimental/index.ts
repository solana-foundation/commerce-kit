/**
 * @arc/solana/experimental - Advanced Features Export
 * 
 * Cutting-edge Solana features for power users:
 * - Versioned transactions (v0) with Address Lookup Tables
 * - Priority fee optimization & MEV protection
 * - Specialized transaction builders
 * - Enterprise RPC management
 * 
 * ⚠️ These APIs may change in minor versions
 */



// Versioned Transaction Support
export { 
  VersionedTransactionManager,
  createVersionedTransactionManager,
  buildV0Transaction
} from './versioned-transaction-manager'
export type { 
  AddressLookupTableConfig,
  AddressLookupTableAccount,
  VersionedTransactionConfig,
  VersionedTransactionResult,
  TransactionOptimization
} from './versioned-transaction-manager'

// Priority Fee Optimization & MEV Protection
export { 
  PriorityFeeOptimizer,
  createPriorityFeeOptimizer,
  getQuickFeeRecommendation,
  getMevProtectedFee
} from './priority-fee-optimizer'
export type { 
  PriorityFeeConfig,
  FeeAnalysis,
  FeeRecommendation,
  MevProtectionConfig,
  MevAnalysis
} from './priority-fee-optimizer'

// Specialized Transaction Builders
export { 
  BaseTransactionBuilder,
  PriorityFeeManager
} from '../core/specialized-builders/base-transaction-builder'
export type { 
  TransactionContext,
  BaseTransactionConfig,
  TransactionResult,
  MevProtectionConfig as BaseMevProtectionConfig
} from '../core/specialized-builders/base-transaction-builder'

// SOL Transaction Builder
export { 
  SOLTransactionBuilder,
  createSOLTransactionBuilder,
  quickSOLTransfer
} from '../core/specialized-builders/sol-transaction-builder'
export type { 
  SOLTransferConfig,
  SOLTransferResult,
  AccountCreationConfig,
  AccountCreationResult
} from '../core/specialized-builders/sol-transaction-builder'

// Token Transaction Builder
export { 
  TokenTransactionBuilder,
  createTokenTransactionBuilder
} from '../core/specialized-builders/token-transaction-builder'
export type { 
  TokenTransferConfig,
  TokenTransferResult,
  TokenCreationConfig,
  TokenCreationResult,
  BulkTokenOperation,
  BulkTokenTransferResult,
  MultiTokenTransferConfig,
  TokenSwapConfig
} from '../core/specialized-builders/token-transaction-builder'

// Enterprise RPC Management
export { 
  EnterpriseRpcManager,
  createEnterpriseRpcManager,
  getEnterpriseRpc,
  getEnterpriseWebSocket,
  defaultEnterpriseConfig
} from '../core/enterprise-rpc-manager'
export type { 
  RpcEndpointConfig,
  EnterpriseRpcConfig,
  ConnectionMetrics,
  EndpointHealth
} from '../core/enterprise-rpc-manager'

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Quick setup for advanced Arc features
 * 
 * Initializes all advanced features with optimal settings for production use.
 */
export async function initializeAdvancedArc(config: {
  rpcUrl: string
  commitment?: 'processed' | 'confirmed' | 'finalized'
  enableEnterpriseRpc?: boolean
  enableVersionedTransactions?: boolean
  enablePriorityFeeOptimization?: boolean
  enableMevProtection?: boolean
}): Promise<{
  versionedTransactionManager?: any
  priorityFeeOptimizer?: any
  enterpriseRpcManager?: any
  solBuilder: any
  tokenBuilder: any
}> {
  const { 
    rpcUrl, 
    commitment = 'confirmed',
    enableEnterpriseRpc = true,
    enableVersionedTransactions = true,
    enablePriorityFeeOptimization = true,
    enableMevProtection = true
  } = config

  console.log('🚀 [Arc Advanced] Initializing advanced features...')

  // Initialize enterprise RPC if enabled
  let enterpriseRpcManager: any
  if (enableEnterpriseRpc) {
    const { createEnterpriseRpcManager } = await import('../core/enterprise-rpc-manager')
    enterpriseRpcManager = createEnterpriseRpcManager({
      endpoints: [
        {
          url: rpcUrl,
          weight: 100,
          priority: 1,
          region: 'primary'
        }
      ],
      loadBalancingStrategy: 'weighted',
      healthCheckInterval: 30000,
      circuitBreakerThreshold: 5,
      enableMetrics: true,
      enableRegionalFailover: false
    })
    console.log('✅ [Arc Advanced] Enterprise RPC manager initialized')
  }

  // Initialize versioned transaction manager if enabled
  let versionedTransactionManager: any
  if (enableVersionedTransactions) {
    const { createVersionedTransactionManager } = await import('./versioned-transaction-manager')
    versionedTransactionManager = createVersionedTransactionManager(rpcUrl, commitment)
    console.log('✅ [Arc Advanced] Versioned transaction manager initialized')
  }

  // Initialize priority fee optimizer if enabled
  let priorityFeeOptimizer: any
  if (enablePriorityFeeOptimization) {
    const { createPriorityFeeOptimizer } = await import('./priority-fee-optimizer')
    priorityFeeOptimizer = createPriorityFeeOptimizer(rpcUrl, commitment)
    console.log('✅ [Arc Advanced] Priority fee optimizer initialized')
  }

  // Initialize specialized builders
  const transactionContext = {
    rpcUrl,
    commitment,
    enableLogging: true
  }

  const { createSOLTransactionBuilder } = await import('../core/specialized-builders/sol-transaction-builder')
  const { createTokenTransactionBuilder } = await import('../core/specialized-builders/token-transaction-builder')
  const solBuilder = createSOLTransactionBuilder(transactionContext)
  const tokenBuilder = createTokenTransactionBuilder(transactionContext)

  console.log('✅ [Arc Advanced] Specialized transaction builders initialized')
  console.log('🎉 [Arc Advanced] All advanced features ready!')

  return {
    versionedTransactionManager,
    priorityFeeOptimizer,
    enterpriseRpcManager,
    solBuilder,
    tokenBuilder
  }
}

/**
 * Create optimized transaction with all advanced features
 * 
 * Combines versioned transactions, priority fee optimization,
 * and MEV protection into a single convenient function.
 */
export async function createOptimizedTransaction(config: {
  rpcUrl: string
  signer: import('@solana/kit').TransactionSigner
  instructions: import('@solana/kit').Instruction[]
  transactionType?: 'sol_transfer' | 'token_transfer' | 'swap' | 'defi' | 'other'
  transactionValue?: number
  priorityStrategy?: 'conservative' | 'moderate' | 'aggressive' | 'ultra'
  enableMevProtection?: boolean
  useVersionedTransaction?: boolean
}): Promise<{
  transactionMessage: any
  priorityFee: number
  mevProtection?: any
  optimization: any
  estimatedCost: number
}> {
  const {
    rpcUrl,
    signer,
    instructions,
    transactionType = 'other',
    transactionValue = 0,
    priorityStrategy = 'moderate',
    enableMevProtection = false,
    useVersionedTransaction = true
  } = config

  console.log('⚡ [Arc Advanced] Creating optimized transaction...')

  // Initialize managers
  const { createVersionedTransactionManager } = await import('./versioned-transaction-manager')
  const { createPriorityFeeOptimizer, getMevProtectedFee } = await import('./priority-fee-optimizer')
  const versionedTxManager = createVersionedTransactionManager(rpcUrl)
  const feeOptimizer = createPriorityFeeOptimizer(rpcUrl)

  // Get optimal priority fee
  let feeRecommendation: any
  let mevProtection: any

  if (enableMevProtection) {
    const mevResult = await getMevProtectedFee(rpcUrl, transactionValue, transactionType as any)
    feeRecommendation = {
      microLamports: mevResult.priorityFee,
      estimatedConfirmationTime: 15,
      confidence: 0.9,
      strategy: 'mev-protected',
      reasoning: 'MEV protection enabled with optimized fees'
    }
    mevProtection = mevResult.mevProtection
  } else {
    feeRecommendation = await feeOptimizer.getOptimalFee({ strategy: priorityStrategy })
  }

  // Build optimized transaction
  const versionedConfig = {
    version: useVersionedTransaction ? 0 as const : 'legacy' as const,
    enableAltOptimization: true
  }

  const { transactionMessage, optimization } = await versionedTxManager.buildOptimizedTransaction(
    instructions,
    signer,
    versionedConfig
  )

  const estimatedCost = feeRecommendation.microLamports + (mevProtection?.jitoTips?.tipAmount || 0)

  console.log('✅ [Arc Advanced] Optimized transaction created')
  console.log(`💰 [Arc Advanced] Estimated cost: ${estimatedCost} micro-lamports`)

  return {
    transactionMessage,
    priorityFee: feeRecommendation.microLamports,
    mevProtection,
    optimization,
    estimatedCost
  }
}

// ===== FEATURE FLAGS =====

/**
 * Check if advanced features are available
 */
export function getAdvancedFeatureSupport(): {
  versionedTransactions: boolean
  addressLookupTables: boolean
  priorityFeeOptimization: boolean
  mevProtection: boolean
  enterpriseRpc: boolean
  specializedBuilders: boolean
} {
  return {
    versionedTransactions: true,
    addressLookupTables: false, // Not fully implemented yet
    priorityFeeOptimization: true,
    mevProtection: true,
    enterpriseRpc: true,
    specializedBuilders: true
  }
}

/**
 * Get version info for advanced features
 */
export function getAdvancedVersion(): {
  version: string
  features: string[]
  experimental: string[]
} {
  return {
    version: '1.0.0-advanced',
    features: [
      'Versioned Transactions (v0)',
      'Priority Fee Optimization',
      'MEV Protection',
      'Enterprise RPC Management',
      'Specialized Transaction Builders',
      'Advanced Error Handling'
    ],
    experimental: [
      'Address Lookup Tables',
      'Private Mempool Integration',
      'Cross-chain Bridging'
    ]
  }
}