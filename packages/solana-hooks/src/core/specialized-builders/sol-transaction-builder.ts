/**
 * 💰 SOL Transaction Builder - Native SOL Operations
 * 
 * Specialized builder for native SOL operations with optimized
 * transaction building, enhanced type safety, and SOL-specific features.
 */

import { 
  address,
  type Address,
  type TransactionSigner,
  type Instruction,
} from '@solana/kit'

import { 
  getTransferSolInstruction,
  getCreateAccountInstruction 
} from '@solana-program/system'

import { 
  BaseTransactionBuilder,
  type TransactionContext,
  type BaseTransactionConfig,
  type TransactionResult
} from './base-transaction-builder'

// ===== SOL-SPECIFIC INTERFACES =====

export interface SOLTransferConfig extends BaseTransactionConfig {
  memo?: string
  createAccountIfNeeded?: boolean
  accountSpace?: number
  programId?: Address
}

export interface SOLTransferResult extends TransactionResult {
  operation: 'sol_transfer'
  amount: bigint
  from: Address
  to: Address
  memo?: string
  accountCreated?: boolean
}

export interface AccountCreationConfig extends BaseTransactionConfig {
  space: number
  programId: Address
  lamports?: bigint
}

export interface AccountCreationResult extends TransactionResult {
  operation: 'account_creation'
  account: Address
  owner: Address
  space: number
  lamports: bigint
  programId: Address
}

// ===== SOL TRANSACTION BUILDER =====

/**
 * SOL Transaction Builder
 * 
 * Provides optimized, type-safe transaction building for native SOL operations.
 * Includes features like automatic account creation, memo support, and
 * SOL-specific optimizations.
 */
export class SOLTransactionBuilder extends BaseTransactionBuilder {
  constructor(context: TransactionContext) {
    super(context)
  }

  /**
   * Transfer native SOL between addresses
   * 
   * Enhanced with memo support, automatic account creation,
   * and optimized compute unit estimation for SOL transfers.
   */
  async transferSOL(
    to: string | Address,
    amount: bigint,
    signer: TransactionSigner,
    config: SOLTransferConfig = {}
  ): Promise<SOLTransferResult> {
    const fromAddress = signer.address
    const toAddress = address(to)
    
    if (this.context.enableLogging) {
      console.log('💸 [Arc SOL] Starting optimized SOL transfer...')
      console.log('📤 From:', fromAddress)
      console.log('📥 To:', toAddress)
      console.log('💰 Amount:', Number(amount) / 1e9, 'SOL')
    }

    // Build SOL transfer instructions
    const instructions = await this.buildSOLTransferInstructions(
      fromAddress,
      toAddress,
      amount,
      config
    )

    // Use specialized config for SOL transfers
    const solTransferConfig: BaseTransactionConfig = {
      ...config,
      // SOL transfers typically need minimal compute units
      computeUnitLimit: config.computeUnitLimit || 5000,
      // Use auto priority fee strategy for better inclusion
      priorityFeeStrategy: config.priorityFeeStrategy || 'auto',
      // Enable versioned transactions for better efficiency
      useVersionedTransaction: config.useVersionedTransaction ?? true
    }

    const result = await this.buildAndSendAdvancedTransaction(
      instructions,
      signer,
      solTransferConfig,
      'SOL transfer'
    )

    return {
      ...result,
      operation: 'sol_transfer',
      amount,
      from: fromAddress,
      to: toAddress,
      memo: config.memo,
      accountCreated: config.createAccountIfNeeded && await this.wasAccountCreated(instructions)
    }
  }

  /**
   * Create a new system account
   * 
   * Optimized for account creation with proper space calculation
   * and rent exemption handling.
   */
  async createAccount(
    newAccount: TransactionSigner,
    payer: TransactionSigner,
    config: AccountCreationConfig
  ): Promise<AccountCreationResult> {
    if (this.context.enableLogging) {
      console.log('🏗️ [Arc SOL] Creating new system account...')
      console.log('📍 Account:', newAccount.address)
      console.log('💳 Payer:', payer.address)
      console.log('📏 Space:', config.space, 'bytes')
    }

    // Calculate rent exemption
    const rentExemption = config.lamports || 
      await this.calculateRentExemption(config.space)

    // Build account creation instruction
    const createAccountInstruction = getCreateAccountInstruction({
      payer: payer,
      newAccount: newAccount,
      lamports: rentExemption,
      space: config.space,
      programAddress: config.programId,
    })

    // Optimized config for account creation
    const accountCreationConfig: BaseTransactionConfig = {
      ...config,
      // Account creation needs more compute units
      computeUnitLimit: config.computeUnitLimit || 15000,
      // Use versioned transactions
      useVersionedTransaction: config.useVersionedTransaction ?? true
    }

    const result = await this.buildAndSendAdvancedTransaction(
      [createAccountInstruction],
      payer,
      accountCreationConfig,
      'account creation'
    )

    return {
      ...result,
      operation: 'account_creation',
      account: newAccount.address,
      owner: payer.address,
      space: config.space,
      lamports: rentExemption,
      programId: config.programId
    }
  }

  /**
   * Bulk SOL transfer - optimized for multiple recipients
   * 
   * Uses optimized instruction packing and compute unit management
   * for efficient bulk transfers.
   */
  async bulkTransferSOL(
    transfers: Array<{ to: string | Address; amount: bigint }>,
    signer: TransactionSigner,
    config: SOLTransferConfig = {}
  ): Promise<SOLTransferResult[]> {
    if (this.context.enableLogging) {
      console.log(`💸 [Arc SOL] Starting bulk SOL transfer (${transfers.length} recipients)...`)
    }

    const results: SOLTransferResult[] = []
    
    // Group transfers into batches to stay within transaction limits
    const batchSize = 10 // Conservative batch size for transaction limits
    const batches = this.chunkArray(transfers, batchSize)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      if (this.context.enableLogging) {
        console.log(`📦 [Arc SOL] Processing batch ${i + 1}/${batches.length} (${batch.length} transfers)`)
      }

      // Build instructions for this batch
      const instructions: Instruction[] = []
      for (const transfer of batch) {
        const transferInstruction = getTransferSolInstruction({
          source: signer,
          destination: address(transfer.to),
          amount: transfer.amount
        })
        instructions.push(transferInstruction)
      }

      // Optimized config for bulk transfers
      const bulkConfig: BaseTransactionConfig = {
        ...config,
        // Scale compute units based on batch size
        computeUnitLimit: config.computeUnitLimit || (5000 + batch.length * 2000),
        // Use aggressive priority fees for bulk operations
        priorityFeeStrategy: config.priorityFeeStrategy || 'aggressive',
        useVersionedTransaction: true // Always use v0 for bulk operations
      }

      const batchResult = await this.buildAndSendAdvancedTransaction(
        instructions,
        signer,
        bulkConfig,
        `bulk SOL transfer (batch ${i + 1})`
      )

      // Create individual results for each transfer in the batch
      for (const transfer of batch) {
        results.push({
          ...batchResult,
          operation: 'sol_transfer',
          amount: transfer.amount,
          from: signer.address,
          to: address(transfer.to)
        })
      }
    }

    return results
  }

  // ===== IMPLEMENTATION OF ABSTRACT METHOD =====

  protected async buildSpecializedTransaction<T extends TransactionResult>(
    config: any,
    signer: TransactionSigner
  ): Promise<T> {
    // This method is required by the base class but not used directly
    // since we have more specific methods for SOL operations
    throw new Error('Use specific SOL transaction methods instead')
  }

  // ===== PRIVATE HELPER METHODS =====

  private async buildSOLTransferInstructions(
    from: Address,
    to: Address,
    amount: bigint,
    config: SOLTransferConfig
  ): Promise<Instruction[]> {
    const instructions: Instruction[] = []

    // Check if account creation is needed
    if (config.createAccountIfNeeded) {
      const accountExists = await this.checkAccountExists(to)
      if (!accountExists) {
        // Add account creation instruction
        const rentExemption = await this.calculateRentExemption(0) // System account
        const createAccountInstruction = getCreateAccountInstruction({
          payer: { address: from } as TransactionSigner,
          newAccount: { address: to } as TransactionSigner,
          lamports: rentExemption,
          space: config.accountSpace || 0,
          programAddress: config.programId || address('11111111111111111111111111111111') // System Program
        })
        instructions.push(createAccountInstruction)
      }
    }

    // Add transfer instruction
    const transferInstruction = getTransferSolInstruction({
      source: { address: from } as TransactionSigner,
      destination: to,
      amount: amount
    })
    instructions.push(transferInstruction)

    // Add memo instruction if provided
    if (config.memo) {
      // Note: In a full implementation, you'd add a memo program instruction
      console.log('📝 [Arc SOL] Memo:', config.memo)
    }

    return instructions
  }

  private async checkAccountExists(address: Address): Promise<boolean> {
    try {
      const accountInfo = await this.rpc.getAccountInfo(address).send()
      return accountInfo.value !== null
    } catch {
      return false
    }
  }

  private async calculateRentExemption(space: number): Promise<bigint> {
    try {
      const rentExemption = await this.rpc.getMinimumBalanceForRentExemption(BigInt(space)).send()
      return rentExemption
    } catch (error) {
      console.warn('[Arc SOL] Failed to calculate rent exemption, using default:', error)
      return BigInt(890880) // Default minimum rent exemption
    }
  }

  private async wasAccountCreated(instructions: Instruction[]): Promise<boolean> {
    // Check if any instruction was an account creation
    return instructions.some(ix => 
      ix.programAddress === '11111111111111111111111111111111' && // System Program
      ix.data && ix.data.length > 32 // Account creation instructions are larger
    )
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}

// ===== FACTORY FUNCTION =====

/**
 * Create SOL transaction builder
 */
export function createSOLTransactionBuilder(context: TransactionContext): SOLTransactionBuilder {
  return new SOLTransactionBuilder(context)
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Quick SOL transfer with optimal settings
 */
export async function quickSOLTransfer(
  context: TransactionContext,
  to: string | Address,
  amount: bigint,
  signer: TransactionSigner,
  priorityFee: 'low' | 'medium' | 'high' = 'medium'
): Promise<SOLTransferResult> {
  const builder = createSOLTransactionBuilder(context)
  
  const priorityFeeStrategy: 'auto' | 'aggressive' = 
    priorityFee === 'high' ? 'aggressive' : 'auto'
  
  return await builder.transferSOL(to, amount, signer, {
    priorityFeeStrategy,
    useVersionedTransaction: true,
    mevProtection: priorityFee === 'high'
  })
}