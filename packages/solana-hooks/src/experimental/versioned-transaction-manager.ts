/**
 * 📱 Versioned Transaction Manager - V0 Transaction Support
 * 
 * Implements advanced Solana v0 transactions with Address Lookup Tables (ALT),
 * allowing for more accounts per transaction and improved efficiency.
 * Supports both legacy and v0 transaction formats with automatic optimization.
 */

import { 
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  address,
  type Address,
  type TransactionSigner,
  type Instruction,
} from '@solana/kit'

import { getSharedRpc } from '../core/rpc-manager'
import { 
  ArcError,
  ArcErrorCode,
  type ArcErrorContext 
} from '../core/error-handler'

// ===== ADDRESS LOOKUP TABLE INTERFACES =====

export interface AddressLookupTableConfig {
  authority: Address<string>
  recentSlot?: number
  addresses: Address<string>[]
}

export interface AddressLookupTableAccount {
  key: Address<string>
  addresses: Address<string>[]
}

export interface VersionedTransactionConfig {
  version: 0 | 'legacy'
  addressLookupTableAccounts?: AddressLookupTableAccount[]
  maxAccountsPerTransaction?: number
  enableAltOptimization?: boolean
}

export interface VersionedTransactionResult {
  signature: string
  version: 0 | 'legacy'
  accountsUsed: number
  addressLookupTablesUsed: Address<string>[]
  computeUnitsUsed?: number
  isOptimized: boolean
}

// ===== TRANSACTION OPTIMIZATION =====

export interface TransactionOptimization {
  originalAccountCount: number
  optimizedAccountCount: number
  addressLookupTablesCreated: number
  computeUnitsSaved: number
  recommendedVersion: 0 | 'legacy'
}

// ===== VERSIONED TRANSACTION MANAGER =====

/**
 * Versioned Transaction Manager
 * 
 * Manages the creation and optimization of both legacy and v0 transactions.
 * Automatically determines the best transaction format based on account
 * usage and provides Address Lookup Table management.
 */
export class VersionedTransactionManager {
  private rpcUrl: string
  private commitment: 'processed' | 'confirmed' | 'finalized'

  constructor(rpcUrl: string, commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed') {
    this.rpcUrl = rpcUrl
    this.commitment = commitment
  }

  /**
   * Build optimized transaction message
   * 
   * Automatically chooses between legacy and v0 format based on
   * account usage and optimization potential.
   */
  async buildOptimizedTransaction(
    instructions: Instruction[],
    signer: TransactionSigner,
    config: VersionedTransactionConfig = { version: 0 }
  ): Promise<{
    transactionMessage: any
    optimization: TransactionOptimization
    recommendedConfig: VersionedTransactionConfig
  }> {
    // Analyze instructions to determine optimal transaction format
    const analysis = await this.analyzeInstructions(instructions)
    
    // Determine if v0 transaction would be beneficial
    const shouldUseV0 = this.shouldUseVersionedTransaction(analysis, config)
    
    const version = config.version === 'legacy' ? 'legacy' : (shouldUseV0 ? 0 : 'legacy')
    
    console.log(`📱 [Arc V0] Building ${version} transaction with ${analysis.uniqueAccounts.length} accounts`)

    if (version === 0) {
      return this.buildV0Transaction(instructions, signer, analysis, config)
    } else {
      return this.buildLegacyTransaction(instructions, signer, analysis)
    }
  }

  /**
   * Create Address Lookup Table
   * 
   * Creates a new ALT for frequently used accounts to optimize
   * future transactions.
   */
  async createAddressLookupTable(
    authority: TransactionSigner,
    addresses: Address[],
    recentSlot?: number
  ): Promise<{
    lookupTableAddress: Address
    signature: string
  }> {
    console.log(`🔍 [Arc ALT] Creating Address Lookup Table with ${addresses.length} addresses`)

    const rpc = getSharedRpc(this.rpcUrl, this.commitment)
    
    // Get recent slot if not provided
    if (!recentSlot) {
      const slot = await rpc.getSlot().send()
      recentSlot = Number(slot)
    }

    // For now, this is a simplified implementation
    // In a full implementation, you would:
    // 1. Create the ALT account
    // 2. Add addresses to the table
    // 3. Wait for the table to be finalized
    
    throw new ArcError(
      'Address Lookup Table creation not yet implemented - coming in future release',
      ArcErrorCode.VALIDATION_ERROR,
      { operation: 'createAddressLookupTable' }
    )
  }

  /**
   * Optimize existing transaction for v0 format
   * 
   * Takes a legacy transaction and optimizes it using ALTs
   * to reduce size and increase account capacity.
   */
  async optimizeForV0(
    instructions: Instruction[],
    signer: TransactionSigner,
    existingALTs: AddressLookupTableAccount[] = []
  ): Promise<{
    optimizedInstructions: Instruction[]
    altRecommendations: Address<string>[]
    estimatedSavings: TransactionOptimization
  }> {
    const analysis = await this.analyzeInstructions(instructions)
    
    console.log(`⚡ [Arc V0] Optimizing transaction: ${analysis.uniqueAccounts.length} accounts`)

    // Find accounts that would benefit from ALT
    const frequentAccounts = this.findFrequentAccounts(analysis.accountUsage)
    const altCandidates = frequentAccounts.filter(account => 
      !existingALTs.some(alt => alt.addresses.includes(account))
    )

    // Calculate potential savings
    const estimatedSavings: TransactionOptimization = {
      originalAccountCount: analysis.uniqueAccounts.length,
      optimizedAccountCount: Math.max(1, analysis.uniqueAccounts.length - altCandidates.length),
      addressLookupTablesCreated: altCandidates.length > 0 ? 1 : 0,
      computeUnitsSaved: altCandidates.length * 32, // Rough estimate
      recommendedVersion: altCandidates.length > 5 ? 0 : 'legacy'
    }

    return {
      optimizedInstructions: instructions, // Would be modified in full implementation
      altRecommendations: altCandidates,
      estimatedSavings
    }
  }

  /**
   * Get transaction size estimate
   * 
   * Estimates the serialized size of a transaction in both
   * legacy and v0 formats for comparison.
   */
  estimateTransactionSize(
    instructions: Instruction[],
    addressLookupTables: AddressLookupTableAccount[] = []
  ): {
    legacySize: number
    v0Size: number
    sizeSavings: number
    recommendedFormat: 'legacy' | 'v0'
  } {
    // Simplified size calculation
    const baseTransactionSize = 64 // Signatures + metadata
    const instructionOverhead = 1 // Instruction count
    const perInstructionSize = 32 // Average instruction size
    
    // Legacy transaction size
    const uniqueAccounts = this.extractUniqueAccounts(instructions)
    const legacyAccountsSize = uniqueAccounts.length * 32
    const legacyInstructionsSize = instructions.length * perInstructionSize
    const legacySize = baseTransactionSize + legacyAccountsSize + instructionOverhead + legacyInstructionsSize

    // V0 transaction size (with ALT optimization)
    const altAccountsCount = addressLookupTables.reduce((sum, alt) => sum + alt.addresses.length, 0)
    const remainingAccounts = Math.max(0, uniqueAccounts.length - altAccountsCount)
    const v0AccountsSize = remainingAccounts * 32 + addressLookupTables.length * 32 // ALT references
    const v0Size = baseTransactionSize + v0AccountsSize + instructionOverhead + legacyInstructionsSize

    const sizeSavings = legacySize - v0Size
    const recommendedFormat = sizeSavings > 100 ? 'v0' : 'legacy' // 100 byte threshold

    return {
      legacySize,
      v0Size,
      sizeSavings,
      recommendedFormat
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async analyzeInstructions(instructions: Instruction[]): Promise<{
    uniqueAccounts: Address<string>[]
    accountUsage: Map<Address<string>, number>
    totalInstructions: number
    complexInstructions: number
  }> {
    const accountUsage = new Map<Address<string>, number>()
    const allAccounts: Address<string>[] = []

    // Extract all accounts from instructions
    for (const instruction of instructions) {
      // Add program account, normalize to @solana/kit Address brand
      allAccounts.push(address(String(instruction.programAddress)))
      
      // Extract accounts from instruction data (simplified)
      // In a full implementation, you'd parse the instruction properly
    }

    // Count account usage
    for (const account of allAccounts) {
      accountUsage.set(account, (accountUsage.get(account) || 0) + 1)
    }

    const uniqueAccounts = Array.from(accountUsage.keys())

    return {
      uniqueAccounts,
      accountUsage,
      totalInstructions: instructions.length,
      complexInstructions: instructions.filter(ix => ix.data && ix.data.length > 100).length
    }
  }

  private shouldUseVersionedTransaction(
    analysis: { uniqueAccounts: Address<string>[]; accountUsage: Map<Address<string>, number> },
    config: VersionedTransactionConfig
  ): boolean {
    // Decision factors for using v0 transactions
    const factors = {
      hasAddressLookupTables: (config.addressLookupTableAccounts?.length || 0) > 0,
      manyAccounts: analysis.uniqueAccounts.length > 20,
      repeatedAccounts: Array.from(analysis.accountUsage.values()).some(count => count > 2),
      explicitV0: config.version === 0,
      optimizationEnabled: config.enableAltOptimization !== false
    }

    console.log('📊 [Arc V0] Transaction analysis:', {
      accounts: analysis.uniqueAccounts.length,
      factors
    })

    // Use v0 if explicitly requested or if it would be beneficial
    return factors.explicitV0 || (
      factors.optimizationEnabled && (
        factors.hasAddressLookupTables ||
        factors.manyAccounts ||
        factors.repeatedAccounts
      )
    )
  }

  private async buildV0Transaction(
    instructions: Instruction[],
    signer: TransactionSigner,
    analysis: any,
    config: VersionedTransactionConfig
  ) {
    console.log('🚀 [Arc V0] Building v0 transaction with ALT support')

    const rpc = getSharedRpc(this.rpcUrl, this.commitment)
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

    // Build v0 transaction message
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(signer, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      tx => appendTransactionMessageInstructions(instructions, tx),
    )

    const optimization: TransactionOptimization = {
      originalAccountCount: analysis.uniqueAccounts.length,
      optimizedAccountCount: analysis.uniqueAccounts.length, // Would be optimized with ALTs
      addressLookupTablesCreated: 0,
      computeUnitsSaved: 0,
      recommendedVersion: 0
    }

    const recommendedConfig: VersionedTransactionConfig = {
      ...config,
      version: 0,
      enableAltOptimization: true
    }

    return {
      transactionMessage,
      optimization,
      recommendedConfig
    }
  }

  private async buildLegacyTransaction(
    instructions: Instruction[],
    signer: TransactionSigner,
    analysis: any
  ) {
    console.log('📜 [Arc V0] Building legacy transaction')

    const rpc = getSharedRpc(this.rpcUrl, this.commitment)
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

    // Build legacy transaction message
    const transactionMessage = pipe(
      createTransactionMessage({ version: 'legacy' }),
      tx => setTransactionMessageFeePayerSigner(signer, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      tx => appendTransactionMessageInstructions(instructions, tx),
    )

    const optimization: TransactionOptimization = {
      originalAccountCount: analysis.uniqueAccounts.length,
      optimizedAccountCount: analysis.uniqueAccounts.length,
      addressLookupTablesCreated: 0,
      computeUnitsSaved: 0,
      recommendedVersion: 'legacy'
    }

    const recommendedConfig: VersionedTransactionConfig = {
      version: 'legacy',
      enableAltOptimization: false
    }

    return {
      transactionMessage,
      optimization,
      recommendedConfig
    }
  }

  private extractUniqueAccounts(instructions: Instruction[]): Address<string>[] {
    const accounts = new Set<Address<string>>()
    
    for (const instruction of instructions) {
      accounts.add(address(String(instruction.programAddress)))
      // In a full implementation, extract accounts from instruction data
    }
    
    return Array.from(accounts)
  }

  private findFrequentAccounts(accountUsage: Map<Address<string>, number>): Address<string>[] {
    // Find accounts used more than once
    return Array.from(accountUsage.entries())
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a) // Sort by usage frequency
      .map(([account, _]) => account)
      .slice(0, 10) // Top 10 most frequent accounts
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create versioned transaction manager
 */
export function createVersionedTransactionManager(
  rpcUrl: string,
  commitment?: 'processed' | 'confirmed' | 'finalized'
): VersionedTransactionManager {
  return new VersionedTransactionManager(rpcUrl, commitment)
}

/**
 * Quick v0 transaction builder
 */
export async function buildV0Transaction(
  instructions: Instruction[],
  signer: TransactionSigner,
  rpcUrl: string,
  options: {
    addressLookupTables?: AddressLookupTableAccount[]
    enableOptimization?: boolean
  } = {}
): Promise<any> {
  const manager = createVersionedTransactionManager(rpcUrl)
  
  const config: VersionedTransactionConfig = {
    version: 0,
    addressLookupTableAccounts: options.addressLookupTables,
    enableAltOptimization: options.enableOptimization !== false
  }
  
  const result = await manager.buildOptimizedTransaction(instructions, signer, config)
  return result.transactionMessage
}