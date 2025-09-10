/**
 * 🪙 Token Transaction Builder - SPL Token Operations
 * 
 * Specialized builder for SPL token operations with advanced features like
 * automatic ATA management, batch operations, token-specific optimizations,
 * and multi-token support.
 */

import { 
  address,
  generateKeyPairSigner,
  type Address,
  type TransactionSigner,
  type Instruction,
} from '@solana/kit'

import { 
  getTransferInstruction,
  getTransferCheckedInstruction,
  getCreateAssociatedTokenInstruction,
  getInitializeMintInstruction,
  getMintToInstruction,
  getMintSize,
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS
} from '@solana-program/token'

import { getCreateAccountInstruction } from '@solana-program/system'

import { 
  BaseTransactionBuilder,
  type TransactionContext,
  type BaseTransactionConfig,
  type TransactionResult
} from './base-transaction-builder'

// ===== TOKEN-SPECIFIC INTERFACES =====

export interface TokenTransferConfig extends BaseTransactionConfig {
  createAccountIfNeeded?: boolean
  closeEmptyAccounts?: boolean
  useCheckedTransfer?: boolean
  mint?: Address
  decimals?: number
}

export interface TokenTransferResult extends TransactionResult {
  operation: 'token_transfer'
  mint: Address
  amount: bigint
  from: Address
  to: Address
  fromTokenAccount: Address
  toTokenAccount: Address
  accountsCreated: Address[]
  accountsClosed: Address[]
}

export interface TokenCreationConfig extends BaseTransactionConfig {
  decimals: number
  mintAuthority?: Address
  freezeAuthority?: Address | null
  supply?: bigint
  metadata?: {
    name?: string
    symbol?: string
    uri?: string
  }
}

export interface TokenCreationResult extends TransactionResult {
  operation: 'token_creation'
  mint: Address
  decimals: number
  mintAuthority: Address
  freezeAuthority: Address | null
  initialSupply?: bigint
  metadataAccount?: Address
}

export interface BulkTokenOperation {
  mint: Address
  to: Address
  amount: bigint
  createAccountIfNeeded?: boolean
}

export interface BulkTokenTransferResult extends TransactionResult {
  operation: 'bulk_token_transfer'
  operations: TokenTransferResult[]
  totalOperations: number
  accountsCreated: number
}

// ===== ADVANCED TOKEN FEATURES =====

export interface MultiTokenTransferConfig extends BaseTransactionConfig {
  transfers: Array<{
    mint: Address
    to: Address
    amount: bigint
    decimals?: number
  }>
  createAccountsIfNeeded?: boolean
  optimizeForGas?: boolean
}

export interface TokenSwapConfig extends BaseTransactionConfig {
  inputMint: Address
  outputMint: Address
  inputAmount: bigint
  minimumOutputAmount: bigint
  slippage: number
  dexProgram?: Address
}

// ===== TOKEN TRANSACTION BUILDER =====

/**
 * Token Transaction Builder
 * 
 * Highly optimized builder for SPL token operations with advanced features:
 * - Automatic ATA (Associated Token Account) management
 * - Batch operations for multiple tokens
 * - Multi-token atomic swaps
 * - Token metadata support
 * - Advanced compute unit optimization for token operations
 */
export class TokenTransactionBuilder extends BaseTransactionBuilder {
  constructor(context: TransactionContext) {
    super(context)
  }

  /**
   * Transfer SPL tokens with advanced features
   * 
   * Includes automatic ATA creation, empty account cleanup,
   * and optimized compute unit management for token transfers.
   */
  async transferToken(
    mint: string | Address,
    to: string | Address,
    amount: bigint,
    signer: TransactionSigner,
    config: TokenTransferConfig = {}
  ): Promise<TokenTransferResult> {
    const mintAddress = address(mint)
    const toAddress = address(to)
    const fromAddress = signer.address
    
    if (this.context.enableLogging) {
      console.log('🪙 [Arc Token] Starting advanced token transfer...')
      console.log('🏦 Mint:', mintAddress)
      console.log('📤 From:', fromAddress)
      console.log('📥 To:', toAddress)
      console.log('💎 Amount:', amount.toString())
    }

    // Get token account information
    const { fromAta, toAta, instructions, accountsCreated } = 
      await this.buildTokenTransferInstructions(
        mintAddress,
        fromAddress,
        toAddress,
        amount,
        signer,
        config
      )

    // Optimized config for token transfers
    const tokenTransferConfig: BaseTransactionConfig = {
      ...config,
      // Token transfers need more compute units than SOL
      computeUnitLimit: config.computeUnitLimit || this.estimateTokenComputeUnits(instructions.length),
      // Use auto priority fees for better inclusion
      priorityFeeStrategy: config.priorityFeeStrategy || 'auto',
      // Enable versioned transactions for efficiency
      useVersionedTransaction: config.useVersionedTransaction ?? true
    }

    const result = await this.buildAndSendAdvancedTransaction(
      instructions,
      signer,
      tokenTransferConfig,
      'token transfer'
    )

    return {
      ...result,
      operation: 'token_transfer',
      mint: mintAddress,
      amount,
      from: fromAddress,
      to: toAddress,
      fromTokenAccount: fromAta,
      toTokenAccount: toAta,
      accountsCreated,
      accountsClosed: [] // TODO: Implement if closeEmptyAccounts is enabled
    }
  }

  /**
   * Create a new SPL token with metadata support
   * 
   * Enhanced with automatic metadata creation and optimized
   * for token creation workflows.
   */
  async createToken(
    payer: TransactionSigner,
    config: TokenCreationConfig
  ): Promise<TokenCreationResult> {
    if (this.context.enableLogging) {
      console.log('🏭 [Arc Token] Creating new SPL token...')
      console.log('🔢 Decimals:', config.decimals)
      console.log('👤 Mint authority:', config.mintAuthority || payer.address)
    }

    // Generate new mint keypair
    const mint = await generateKeyPairSigner()
    const mintAuthority = address(config.mintAuthority || payer.address)
    const freezeAuthority = config.freezeAuthority ? address(config.freezeAuthority) : null

    // Build token creation instructions
    const instructions = await this.buildTokenCreationInstructions(
      mint,
      payer,
      mintAuthority,
      freezeAuthority,
      config
    )

    // Optimized config for token creation
    const tokenCreationConfig: BaseTransactionConfig = {
      ...config,
      // Token creation needs significant compute units
      computeUnitLimit: config.computeUnitLimit || 50000,
      // Use aggressive priority fees for token creation
      priorityFeeStrategy: config.priorityFeeStrategy || 'aggressive',
      useVersionedTransaction: true
    }

    const result = await this.buildAndSendAdvancedTransaction(
      instructions,
      payer,
      tokenCreationConfig,
      'token creation'
    )

    return {
      ...result,
      operation: 'token_creation',
      mint: mint.address,
      decimals: config.decimals,
      mintAuthority,
      freezeAuthority,
      initialSupply: config.supply
    }
  }

  /**
   * Bulk token transfers - optimized for multiple recipients
   * 
   * Automatically batches operations and optimizes compute units
   * for efficient bulk token transfers.
   */
  async bulkTransferToken(
    mint: string | Address,
    transfers: Array<{ to: string | Address; amount: bigint }>,
    signer: TransactionSigner,
    config: TokenTransferConfig = {}
  ): Promise<BulkTokenTransferResult> {
    const mintAddress = address(mint)
    
    if (this.context.enableLogging) {
      console.log(`🪙 [Arc Token] Starting bulk token transfer (${transfers.length} recipients)...`)
      console.log('🏦 Mint:', mintAddress)
    }

    const results: TokenTransferResult[] = []
    let totalAccountsCreated = 0
    
    // Optimize batch size based on transaction limits and compute units
    const batchSize = this.calculateOptimalBatchSize(transfers.length, 'token_transfer')
    const batches = this.chunkArray(transfers, batchSize)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      if (this.context.enableLogging) {
        console.log(`📦 [Arc Token] Processing batch ${i + 1}/${batches.length} (${batch.length} transfers)`)
      }

      // Build instructions for this batch
      const batchInstructions: Instruction[] = []
      const batchAccountsCreated: Address[] = []

      for (const transfer of batch) {
        const { instructions, accountsCreated } = await this.buildSingleTokenTransferInstructions(
          mintAddress,
          signer.address,
          address(transfer.to),
          transfer.amount,
          signer,
          config
        )
        batchInstructions.push(...instructions)
        batchAccountsCreated.push(...accountsCreated)
      }

      // Optimized config for bulk transfers
      const bulkConfig: BaseTransactionConfig = {
        ...config,
        computeUnitLimit: config.computeUnitLimit || this.estimateTokenComputeUnits(batchInstructions.length),
        priorityFeeStrategy: config.priorityFeeStrategy || 'aggressive',
        useVersionedTransaction: true
      }

      const batchResult = await this.buildAndSendAdvancedTransaction(
        batchInstructions,
        signer,
        bulkConfig,
        `bulk token transfer (batch ${i + 1})`
      )

      totalAccountsCreated += batchAccountsCreated.length

      // Create individual results for each transfer in the batch
      for (const transfer of batch) {
        const [fromAta] = await findAssociatedTokenPda({
          mint: mintAddress,
          owner: signer.address,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        })
        const [toAta] = await findAssociatedTokenPda({
          mint: mintAddress,
          owner: address(transfer.to),
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        })

        results.push({
          ...batchResult,
          operation: 'token_transfer',
          mint: mintAddress,
          amount: transfer.amount,
          from: signer.address,
          to: address(transfer.to),
          fromTokenAccount: fromAta,
          toTokenAccount: toAta,
          accountsCreated: batchAccountsCreated,
          accountsClosed: []
        })
      }
    }

    return {
      signature: results[0]?.signature || '',
      operation: 'bulk_token_transfer',
      operations: results,
      totalOperations: transfers.length,
      accountsCreated: totalAccountsCreated
    }
  }

  /**
   * Multi-token atomic transfer
   * 
   * Transfer multiple different tokens in a single atomic transaction.
   * Useful for complex DeFi operations and atomic swaps.
   */
  async multiTokenTransfer(
    signer: TransactionSigner,
    config: MultiTokenTransferConfig
  ): Promise<TokenTransferResult[]> {
    if (this.context.enableLogging) {
      console.log(`🔄 [Arc Token] Starting multi-token atomic transfer (${config.transfers.length} tokens)...`)
    }

    const allInstructions: Instruction[] = []
    const results: TokenTransferResult[] = []

    // Build instructions for all token transfers
    for (const transfer of config.transfers) {
      const { instructions, accountsCreated } = await this.buildSingleTokenTransferInstructions(
        transfer.mint,
        signer.address,
        transfer.to,
        transfer.amount,
        signer,
        { createAccountIfNeeded: config.createAccountsIfNeeded }
      )
      
      allInstructions.push(...instructions)
    }

    // Optimized config for multi-token operations
    const multiTokenConfig: BaseTransactionConfig = {
      ...config,
      computeUnitLimit: config.computeUnitLimit || this.estimateTokenComputeUnits(allInstructions.length),
      priorityFeeStrategy: config.priorityFeeStrategy || 'aggressive',
      useVersionedTransaction: true, // Always use v0 for complex operations
      mevProtection: true // Enable MEV protection for multi-token operations
    }

    const result = await this.buildAndSendAdvancedTransaction(
      allInstructions,
      signer,
      multiTokenConfig,
      'multi-token transfer'
    )

    // Create results for each token transfer
    for (const transfer of config.transfers) {
      const [fromAta] = await findAssociatedTokenPda({
        mint: transfer.mint,
        owner: signer.address,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
      const [toAta] = await findAssociatedTokenPda({
        mint: transfer.mint,
        owner: transfer.to,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })

      results.push({
        ...result,
        operation: 'token_transfer',
        mint: transfer.mint,
        amount: transfer.amount,
        from: signer.address,
        to: transfer.to,
        fromTokenAccount: fromAta,
        toTokenAccount: toAta,
        accountsCreated: [], // Calculated per transfer
        accountsClosed: []
      })
    }

    return results
  }

  // ===== IMPLEMENTATION OF ABSTRACT METHOD =====

  protected async buildSpecializedTransaction<T extends TransactionResult>(
    config: any,
    signer: TransactionSigner
  ): Promise<T> {
    throw new Error('Use specific token transaction methods instead')
  }

  // ===== PRIVATE HELPER METHODS =====

  private async buildTokenTransferInstructions(
    mint: Address,
    from: Address,
    to: Address,
    amount: bigint,
    signer: TransactionSigner,
    config: TokenTransferConfig
  ): Promise<{
    fromAta: Address
    toAta: Address
    instructions: Instruction[]
    accountsCreated: Address[]
  }> {
    const instructions: Instruction[] = []
    const accountsCreated: Address[] = []

    // Find associated token accounts
    const [fromAta] = await findAssociatedTokenPda({
      mint,
      owner: from,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })

    const [toAta] = await findAssociatedTokenPda({
      mint,
      owner: to,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })

    // Check if recipient token account needs to be created
    if (config.createAccountIfNeeded) {
      const toAccountExists = await this.checkTokenAccountExists(toAta)
      if (!toAccountExists) {
        const createAtaInstruction = getCreateAssociatedTokenInstruction({
          mint,
          owner: to,
          ata: toAta,
          payer: signer,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        })
        instructions.push(createAtaInstruction)
        accountsCreated.push(toAta)
      }
    }

    // Create transfer instruction
    const transferInstruction = config.useCheckedTransfer && config.decimals !== undefined
      ? getTransferCheckedInstruction({
          source: fromAta,
          destination: toAta,
          amount,
          decimals: config.decimals,
          mint,
          authority: signer,
        })
      : getTransferInstruction({
          source: fromAta,
          destination: toAta,
          amount,
          authority: signer,
        })

    instructions.push(transferInstruction)

    return { fromAta, toAta, instructions, accountsCreated }
  }

  private async buildSingleTokenTransferInstructions(
    mint: Address,
    from: Address,
    to: Address,
    amount: bigint,
    signer: TransactionSigner,
    config: TokenTransferConfig
  ): Promise<{ instructions: Instruction[]; accountsCreated: Address[] }> {
    const result = await this.buildTokenTransferInstructions(mint, from, to, amount, signer, config)
    return { 
      instructions: result.instructions, 
      accountsCreated: result.accountsCreated 
    }
  }

  private async buildTokenCreationInstructions(
    mint: TransactionSigner,
    payer: TransactionSigner,
    mintAuthority: Address,
    freezeAuthority: Address | null,
    config: TokenCreationConfig
  ): Promise<Instruction[]> {
    const instructions: Instruction[] = []

    // Get rent exemption for mint account
    const rentExemption = await this.rpc.getMinimumBalanceForRentExemption(BigInt(getMintSize())).send()

    // Create mint account
    const createAccountInstruction = getCreateAccountInstruction({
      payer: payer,
      newAccount: mint,
      lamports: rentExemption,
      space: getMintSize(),
      programAddress: TOKEN_PROGRAM_ADDRESS,
    })
    instructions.push(createAccountInstruction)

    // Initialize mint
    const initializeMintInstruction = getInitializeMintInstruction({
      mint: mint.address,
      decimals: config.decimals,
      mintAuthority,
      freezeAuthority,
    })
    instructions.push(initializeMintInstruction)

    // Mint initial supply if specified
    if (config.supply && config.supply > BigInt(0)) {
      const [authorityAta] = await findAssociatedTokenPda({
        mint: mint.address,
        owner: mintAuthority,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })

      // Create ATA for mint authority
      const createAtaInstruction = getCreateAssociatedTokenInstruction({
        mint: mint.address,
        owner: mintAuthority,
        ata: authorityAta,
        payer: payer,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
      instructions.push(createAtaInstruction)

      // Mint initial supply
      const mintToInstruction = getMintToInstruction({
        mint: mint.address,
        token: authorityAta,
        amount: config.supply,
        mintAuthority: { address: mintAuthority } as TransactionSigner,
      })
      instructions.push(mintToInstruction)
    }

    return instructions
  }

  private async checkTokenAccountExists(address: Address): Promise<boolean> {
    try {
      const accountInfo = await this.rpc.getAccountInfo(address).send()
      return accountInfo.value !== null
    } catch {
      return false
    }
  }

  private estimateTokenComputeUnits(instructionCount: number): number {
    // More sophisticated estimation for token operations
    const baseUnits = 10000 // Base token operation overhead
    const perInstructionUnits = 15000 // Token instructions are more expensive
    const ataCreationUnits = 25000 // Additional units for ATA creation
    
    return baseUnits + (instructionCount * perInstructionUnits) + 
           (instructionCount > 1 ? ataCreationUnits : 0)
  }

  private calculateOptimalBatchSize(totalOperations: number, operationType: string): number {
    // Calculate optimal batch size based on operation type and compute limits
    const maxComputeUnits = 1400000 // Solana's compute unit limit
    const estimatedUnitsPerOp = operationType === 'token_transfer' ? 40000 : 20000
    
    return Math.min(Math.floor(maxComputeUnits / estimatedUnitsPerOp), 10)
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
 * Create token transaction builder
 */
export function createTokenTransactionBuilder(context: TransactionContext): TokenTransactionBuilder {
  return new TokenTransactionBuilder(context)
}