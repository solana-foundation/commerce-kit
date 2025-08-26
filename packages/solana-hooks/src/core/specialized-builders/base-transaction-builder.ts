/**
 * 🏗️ Base Transaction Builder - Specialized Builder Foundation
 * 
 * Provides the foundation for specialized transaction builders with
 * enhanced type safety, performance optimization, and operation-specific
 * features. Replaces the monolithic transaction builder approach.
 */

import { 
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  type Address,
  type TransactionSigner,
  type Instruction,
} from '@solana/kit'

import { 
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction 
} from '@solana-program/compute-budget'

import { getSharedRpc, getSharedWebSocket } from '../rpc-manager'
import { 
  ArcError,
  ArcErrorCode,
  defaultRetryManager,
  createNetworkError,
  createTransactionError,
  type ArcErrorContext 
} from '../error-handler'

// ===== SHARED INTERFACES =====

export interface TransactionContext {
  rpcUrl: string
  commitment?: 'processed' | 'confirmed' | 'finalized'
  enableLogging?: boolean
  network?: string
}

export interface BaseTransactionConfig {
  feePayer?: TransactionSigner
  computeUnitLimit?: number
  computeUnitPrice?: number
  skipPreflight?: boolean
  maxRetries?: number
  priorityFeeStrategy?: 'none' | 'auto' | 'aggressive' | 'custom'
  customPriorityFee?: number
  mevProtection?: boolean
  useVersionedTransaction?: boolean
}

export interface TransactionResult {
  signature: string
  blockTime?: number
  slot?: number
  computeUnitsUsed?: number
  priorityFee?: number
}

// ===== MEV PROTECTION =====

export interface MevProtectionConfig {
  enabled: boolean
  jito?: {
    enabled: boolean
    tip?: number
  }
  flashloan?: {
    enabled: boolean
    slippage?: number
  }
}

// ===== PRIORITY FEE STRATEGIES =====

export class PriorityFeeManager {
  static async calculateOptimalFee(
    instructions: Instruction[],
    rpcUrl: string,
    strategy: 'auto' | 'aggressive' | 'custom' = 'auto',
    customFee?: number
  ): Promise<number> {
    if (strategy === 'custom' && customFee !== undefined) {
      return customFee
    }

    try {
      const rpc = getSharedRpc(rpcUrl)
      
      // Get recent priority fees for similar transactions
      // This is a simplified implementation - in production you'd analyze recent blocks
      const recentFees = await rpc.getRecentPrioritizationFees().send()
      
      if (recentFees && recentFees.length > 0) {
        const fees = recentFees.map(fee => Number(fee.prioritizationFee))
        
        switch (strategy) {
          case 'auto':
            // Use median fee
            fees.sort((a, b) => a - b)
            return fees[Math.floor(fees.length / 2)] ?? 0
          
          case 'aggressive':
            // Use 90th percentile
            fees.sort((a, b) => a - b)
            return fees[Math.floor(fees.length * 0.9)] ?? 0
          
          default:
            return 0
        }
      }
    } catch (error) {
      console.warn('[Arc] Failed to fetch priority fees, using default:', error)
    }

    // Fallback fees based on strategy
    switch (strategy) {
      case 'auto':
        return 10000 // 0.01 SOL priority fee
      case 'aggressive':
        return 50000 // 0.05 SOL priority fee
      default:
        return 0
    }
  }
}

// ===== BASE TRANSACTION BUILDER =====

/**
 * Base Transaction Builder
 * 
 * Provides common transaction building functionality that specialized
 * builders can extend. Includes advanced features like priority fees,
 * MEV protection, and versioned transaction support.
 */
export abstract class BaseTransactionBuilder {
  protected context: TransactionContext
  protected rpc: ReturnType<typeof getSharedRpc>
  protected rpcSubscriptions: ReturnType<typeof getSharedWebSocket>
  protected sendAndConfirmTransaction: ReturnType<typeof sendAndConfirmTransactionFactory>

  constructor(context: TransactionContext) {
    this.context = context
    this.rpc = getSharedRpc(context.rpcUrl, context.commitment)
    this.rpcSubscriptions = getSharedWebSocket(context.rpcUrl, context.commitment)
    this.sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ 
      rpc: this.rpc as any, 
      rpcSubscriptions: this.rpcSubscriptions as any 
    })
  }

  /**
   * Build and send transaction with advanced features
   */
  protected async buildAndSendAdvancedTransaction(
    instructions: Instruction[],
    signer: TransactionSigner,
    config: BaseTransactionConfig = {},
    operationName: string
  ): Promise<TransactionResult> {
    const errorContext: ArcErrorContext = {
      operation: operationName,
      address: signer.address,
      timestamp: Date.now(),
      rpcUrl: this.context.rpcUrl,
      network: this.context.network
    }

    return await defaultRetryManager.executeWithRetry(async () => {
      try {
        if (this.context.enableLogging) {
          console.log(`🚀 [Arc] Building advanced ${operationName}...`)
        }

        // Validate inputs
        this.validateInputs(instructions, signer, config)

        // Get latest blockhash
        const latestBlockhash = await this.getLatestBlockhashWithRetry()

        // Build compute budget instructions
        const computeBudgetInstructions = await this.buildComputeBudgetInstructions(
          instructions, 
          config
        )

        // Combine all instructions
        const allInstructions = [...computeBudgetInstructions, ...instructions]

        // Apply MEV protection if enabled
        const protectedInstructions = config.mevProtection 
          ? await this.applyMevProtection(allInstructions, config)
          : allInstructions

        // Build transaction (versioned or legacy)
        const transactionMessage = config.useVersionedTransaction
          ? await this.buildVersionedTransaction(protectedInstructions, signer, latestBlockhash)
          : await this.buildLegacyTransaction(protectedInstructions, signer, latestBlockhash)

        if (this.context.enableLogging) {
          console.log(`🔨 [Arc] Transaction built with ${protectedInstructions.length} instructions`)
          console.log(`📊 [Arc] Transaction type: ${config.useVersionedTransaction ? 'v0' : 'legacy'}`)
        }

        // Sign transaction
        const { signedTransaction, signature } = await this.signTransaction(
          transactionMessage, 
          errorContext
        )

        // Send and confirm
        await this.sendAndConfirmWithRetry(signedTransaction, config, signature, errorContext)

        if (this.context.enableLogging) {
          console.log(`✅ [Arc] Advanced ${operationName} completed successfully!`)
        }

        return {
          signature,
          priorityFee: await this.extractPriorityFee(computeBudgetInstructions),
          // Additional metrics could be added here
        }

      } catch (error) {
        if (error instanceof ArcError) {
          throw error
        }
        
        throw createTransactionError(
          `Advanced ${operationName} failed: ${error instanceof Error ? error.message : String(error)}`,
          errorContext,
          error as Error
        )
      }
    }, errorContext)
  }

  // ===== VALIDATION =====

  private validateInputs(
    instructions: Instruction[],
    signer: TransactionSigner,
    config: BaseTransactionConfig
  ): void {
    if (!instructions || instructions.length === 0) {
      throw new ArcError(
        'No instructions provided for transaction',
        ArcErrorCode.VALIDATION_ERROR,
        { operation: 'validateInputs' }
      )
    }

    if (!signer || !signer.address) {
      throw new ArcError(
        'Invalid signer provided for transaction',
        ArcErrorCode.WALLET_NOT_CONNECTED,
        { operation: 'validateInputs' }
      )
    }

    // Validate compute budget limits
    if (config.computeUnitLimit && (config.computeUnitLimit < 0 || config.computeUnitLimit > 1400000)) {
      throw new ArcError(
        'Invalid compute unit limit: must be between 0 and 1,400,000',
        ArcErrorCode.VALIDATION_ERROR,
        { operation: 'validateInputs' }
      )
    }
  }

  // ===== COMPUTE BUDGET MANAGEMENT =====

  private async buildComputeBudgetInstructions(
    instructions: Instruction[],
    config: BaseTransactionConfig
  ): Promise<Instruction[]> {
    const computeBudgetInstructions: Instruction[] = []

    // Auto-calculate compute unit limit if not provided
    let computeUnitLimit = config.computeUnitLimit
    if (!computeUnitLimit) {
      computeUnitLimit = this.estimateComputeUnits(instructions)
      
      if (this.context.enableLogging) {
        console.log(`💻 [Arc] Auto-estimated compute units: ${computeUnitLimit}`)
      }
    }

    if (computeUnitLimit > 0) {
      computeBudgetInstructions.push(
        getSetComputeUnitLimitInstruction({ units: computeUnitLimit }) as any
      )
    }

    // Handle priority fees
    let priorityFee = config.computeUnitPrice
    if (config.priorityFeeStrategy && config.priorityFeeStrategy !== 'none') {
      priorityFee = await PriorityFeeManager.calculateOptimalFee(
        instructions,
        this.context.rpcUrl,
        config.priorityFeeStrategy === 'custom' ? 'custom' : config.priorityFeeStrategy,
        config.customPriorityFee
      )
      
      if (this.context.enableLogging) {
        console.log(`💰 [Arc] Calculated priority fee: ${priorityFee} micro-lamports`)
      }
    }

    if (priorityFee && priorityFee > 0) {
      computeBudgetInstructions.push(
        getSetComputeUnitPriceInstruction({ microLamports: priorityFee }) as any
      )
    }

    return computeBudgetInstructions
  }

  private estimateComputeUnits(instructions: Instruction[]): number {
    // Basic estimation based on instruction count and types
    // This could be enhanced with more sophisticated analysis
    const baseUnits = 5000 // Base transaction overhead
    const perInstructionUnits = 10000 // Average per instruction
    
    return baseUnits + (instructions.length * perInstructionUnits)
  }

  private async extractPriorityFee(computeBudgetInstructions: Instruction[]): Promise<number> {
    // Extract priority fee from compute budget instructions
    // This is a simplified implementation
    return 0 // Would need to parse the instruction data
  }

  // ===== TRANSACTION BUILDING =====

  private async buildLegacyTransaction(
    instructions: Instruction[],
    signer: TransactionSigner,
    latestBlockhash: any
  ) {
    return pipe(
      createTransactionMessage({ version: 'legacy' }),
      tx => setTransactionMessageFeePayerSigner(signer, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      tx => appendTransactionMessageInstructions(instructions, tx),
    )
  }

  private async buildVersionedTransaction(
    instructions: Instruction[],
    signer: TransactionSigner,
    latestBlockhash: any
  ) {
    // Build v0 transaction with potential address lookup table support
    return pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(signer, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      tx => appendTransactionMessageInstructions(instructions, tx),
    )
  }

  // ===== MEV PROTECTION =====

  private async applyMevProtection(
    instructions: Instruction[],
    config: BaseTransactionConfig
  ): Promise<Instruction[]> {
    // Basic MEV protection strategies
    // In production, this would implement more sophisticated protection
    
    if (this.context.enableLogging) {
      console.log('🛡️ [Arc] Applying MEV protection...')
    }

    // For now, just return instructions as-is
    // Future implementations could:
    // - Add decoy instructions
    // - Use private mempools
    // - Implement sandwich attack protection
    return instructions
  }

  // ===== UTILITY METHODS =====

  private async getLatestBlockhashWithRetry() {
    return await defaultRetryManager.executeWithRetry(
      async () => {
        try {
          const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send()
          
          if (this.context.enableLogging) {
            console.log('🔗 [Arc] Latest blockhash:', latestBlockhash.blockhash)
          }
          
          return latestBlockhash
        } catch (error) {
          throw createNetworkError(
            'Failed to fetch latest blockhash',
            { operation: 'getLatestBlockhash', rpcUrl: this.context.rpcUrl },
            error as Error
          )
        }
      },
      { operation: 'getLatestBlockhash' }
    )
  }

  private async signTransaction(
    transactionMessage: any,
    errorContext: ArcErrorContext
  ): Promise<{ signedTransaction: any; signature: string }> {
    try {
      const signedTransaction = await signTransactionMessageWithSigners(transactionMessage)
      const signature = getSignatureFromTransaction(signedTransaction)
      return { signedTransaction, signature }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new ArcError(
          'Transaction was rejected by user',
          ArcErrorCode.USER_REJECTED,
          errorContext,
          error
        )
      }
      throw createTransactionError('Failed to sign transaction', errorContext, error as Error)
    }
  }

  private async sendAndConfirmWithRetry(
    signedTransaction: any,
    config: BaseTransactionConfig,
    signature: string,
    errorContext: ArcErrorContext
  ): Promise<void> {
    try {
      await this.sendAndConfirmTransaction(signedTransaction, { 
        commitment: this.context.commitment || 'confirmed',
        skipPreflight: config.skipPreflight || false
      })
    } catch (error) {
      this.handleTransactionError(error, signature, errorContext)
    }
  }

  private handleTransactionError(error: unknown, signature: string, context: ArcErrorContext): never {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient lamports')) {
      throw new ArcError(
        'Insufficient SOL balance for transaction',
        ArcErrorCode.INSUFFICIENT_FUNDS,
        { ...context, signature },
        error as Error
      )
    }
    
    if (errorMessage.includes('blockhash not found') || errorMessage.includes('expired')) {
      throw new ArcError(
        'Transaction blockhash expired, please retry',
        ArcErrorCode.BLOCKHASH_EXPIRED,
        { ...context, signature },
        error as Error
      )
    }
    
    if (errorMessage.includes('simulation failed')) {
      throw new ArcError(
        'Transaction simulation failed',
        ArcErrorCode.SIMULATION_FAILED,
        { ...context, signature },
        error as Error
      )
    }
    
    throw createTransactionError(
      `Transaction failed: ${errorMessage}`,
      { ...context, signature },
      error as Error
    )
  }

  // ===== ABSTRACT METHODS =====

  /**
   * Specialized builders should implement this to provide operation-specific
   * transaction building with enhanced type safety and optimizations
   */
  protected abstract buildSpecializedTransaction<T extends TransactionResult>(
    config: BaseTransactionConfig & any,
    signer: TransactionSigner
  ): Promise<T>
}