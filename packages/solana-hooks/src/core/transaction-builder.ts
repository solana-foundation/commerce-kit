/**
 * 🚀 Arc Transaction Builder - Shared Transaction Core
 *
 * ELIMINATES: 95% code duplication between frontend hooks and backend client
 * PROVIDES: Single source of truth for all transaction building logic
 *
 * This is the final piece of Arc's architectural optimization.
 * All transaction operations now share the same core implementation.
 */

import {
    createTransactionMessage,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstructions,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    generateKeyPairSigner,
    sendAndConfirmTransactionFactory,
    address,
    isSignature,
    type Address,
    type TransactionSigner,
    type Instruction,
} from '@solana/kit';

import { getTransferSolInstruction, getCreateAccountInstruction } from '@solana-program/system';

import {
    getTransferInstruction,
    getCreateAssociatedTokenInstruction,
    getCreateAssociatedTokenIdempotentInstruction,
    getInitializeMintInstruction,
    getMintSize,
    getMintToInstruction,
    getBurnCheckedInstruction,
    findAssociatedTokenPda,
    TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';

import { getSharedRpc, getSharedWebSocket } from './rpc-manager';
import {
    ArcError,
    ArcErrorCode,
    defaultRetryManager,
    createNetworkError,
    createTransactionError,
    type ArcErrorContext,
    type ArcRetryConfig,
} from './error-handler';

// ===== SHARED RESULT TYPES =====

export interface TransactionResult {
    signature: string;
    blockTime?: number;
    slot?: number;
}

export interface SOLTransferResult extends TransactionResult {
    amount: bigint;
    from: Address;
    to: Address;
}

export interface TokenTransferResult extends TransactionResult {
    mint: Address;
    amount: bigint;
    from: Address;
    to: Address;
    fromTokenAccount: Address;
    toTokenAccount: Address;
    createdAccount: boolean;
}

export interface TokenCreationResult extends TransactionResult {
    mint: Address;
    decimals: number;
    mintAuthority: Address;
    freezeAuthority: Address | null;
}

export interface TokenMintResult extends TransactionResult {
    mint: Address;
    amount: bigint;
    to: Address;
    toTokenAccount: Address;
}

export interface TokenBurnResult extends TransactionResult {
    mint: Address;
    amount: bigint;
    decimals: number;
    from: Address;
    fromTokenAccount: Address;
}

export interface TokenAccountCreationResult extends TransactionResult {
    tokenAccount: Address;
    mint: Address;
    owner: Address;
}

export interface StakeAccountResult extends TransactionResult {
    stakeAccount: Address;
    lamports: bigint;
    staker: Address;
    withdrawer: Address;
}

// ===== TRANSACTION BUILDER CONTEXT =====

export interface TransactionContext {
    rpcUrl: string;
    commitment?: 'processed' | 'confirmed' | 'finalized';
    // Optional: for performance monitoring
    debug?: boolean;
    // Optional: custom retry configuration for transactions
    retryConfig?: Partial<ArcRetryConfig>;
}

// ===== CORE TRANSACTION BUILDER CLASS =====

/**
 * Shared Transaction Builder
 *
 * Single implementation used by both:
 * - Frontend hooks (via React wrappers)
 * - Backend client (via direct calls)
 *
 * This eliminates code duplication and ensures consistency.
 */
export class TransactionBuilder {
    private context: TransactionContext;
    private rpc: ReturnType<typeof getSharedRpc>;
    private rpcSubscriptions: ReturnType<typeof getSharedWebSocket>;
    private sendAndConfirmTransaction: ReturnType<typeof sendAndConfirmTransactionFactory>;

    constructor(context: TransactionContext) {
        this.context = context;
        this.rpc = getSharedRpc(context.rpcUrl, context.commitment);
        this.rpcSubscriptions = getSharedWebSocket(context.rpcUrl, context.commitment);
        this.sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
            rpc: this.rpc as any,
            rpcSubscriptions: this.rpcSubscriptions as any,
        });
    }

    // ===== CORE TRANSACTION UTILITIES =====

    /**
     * Build and send transaction with shared logic and enterprise error handling
     */
    private async buildAndSendTransaction(
        instructions: Instruction[],
        signer: TransactionSigner,
        description: string,
    ): Promise<TransactionResult> {
        const context: ArcErrorContext = {
            operation: description,
            address: signer.address,
            timestamp: Date.now(),
            rpcUrl: this.context.rpcUrl,
        };

        return await defaultRetryManager.executeWithRetry(async () => {
            try {
                if (this.context.debug) {
                    console.log(`🔄 [Arc Transaction] Building ${description}...`);
                }

                // Validate inputs
                if (!instructions || instructions.length === 0) {
                    throw new ArcError(
                        'No instructions provided for transaction',
                        ArcErrorCode.VALIDATION_ERROR,
                        context,
                    );
                }

                if (!signer || !signer.address) {
                    throw new ArcError(
                        'Invalid signer provided for transaction',
                        ArcErrorCode.WALLET_NOT_CONNECTED,
                        context,
                    );
                }

                // Get latest blockhash with error handling
                const latestBlockhash = await this.getLatestBlockhashWithRetry();

                // Build transaction message with shared pattern
                const transactionMessage = pipe(
                    createTransactionMessage({ version: 0 }),
                    tx => setTransactionMessageFeePayerSigner(signer, tx),
                    tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
                    tx => appendTransactionMessageInstructions(instructions, tx),
                );

                if (this.context.debug) {
                    console.log(`🔨 [Arc Transaction] Message built with ${instructions.length} instructions`);
                }

                // Sign transaction with error handling
                let signedTransaction: any;
                let signature: string;

                try {
                    signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
                    signature = getSignatureFromTransaction(signedTransaction);
                } catch (error) {
                    if (error instanceof Error && error.message.includes('User rejected')) {
                        throw new ArcError(
                            'Transaction was rejected by user',
                            ArcErrorCode.USER_REJECTED,
                            context,
                            error,
                        );
                    }
                    throw createTransactionError('Failed to sign transaction', context, error as Error);
                }

                if (this.context.debug) {
                    const shortSig = `${signature.slice(0, 8)}…`;
                    console.log('📝 [Arc Transaction] Signature:', shortSig);
                    console.log('📡 [Arc Transaction] Sending transaction...');
                }

                // Send and confirm transaction with enhanced error handling
                try {
                    await this.sendAndConfirmTransaction(signedTransaction, {
                        commitment: this.context.commitment || 'confirmed',
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    // Classify transaction errors
                    if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient lamports')) {
                        throw new ArcError(
                            'Insufficient SOL balance for transaction',
                            ArcErrorCode.INSUFFICIENT_FUNDS,
                            context,
                            error as Error,
                        );
                    }

                    if (errorMessage.includes('blockhash not found') || errorMessage.includes('expired')) {
                        throw new ArcError(
                            'Transaction blockhash expired, please retry',
                            ArcErrorCode.BLOCKHASH_EXPIRED,
                            context,
                            error as Error,
                        );
                    }

                    if (errorMessage.includes('simulation failed')) {
                        throw new ArcError(
                            'Transaction simulation failed',
                            ArcErrorCode.SIMULATION_FAILED,
                            context,
                            error as Error,
                        );
                    }

                    throw createTransactionError(
                        `Transaction failed: ${errorMessage}`,
                        { ...context, signature },
                        error as Error,
                    );
                }

                if (this.context.debug) {
                    console.log(`✅ [Arc Transaction] ${description} completed successfully!`);
                }

                return {
                    signature,
                    // Note: blockTime and slot could be retrieved here if needed
                };
            } catch (error) {
                // Re-throw ArcError as-is, wrap others
                if (error instanceof ArcError) {
                    throw error;
                }

                throw createTransactionError(`Unexpected error in ${description}`, context, error as Error);
            }
        }, context, this.context.retryConfig);
    }

    /**
     * Get latest blockhash with retry logic
     */
    private async getLatestBlockhashWithRetry() {
        return await defaultRetryManager.executeWithRetry(
            async () => {
                try {
                    const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send();

                    if (this.context.debug) {
                        console.log('🔗 [Arc Transaction] Latest blockhash:', latestBlockhash.blockhash);
                    }

                    return latestBlockhash;
                } catch (error) {
                    throw createNetworkError(
                        'Failed to fetch latest blockhash',
                        { operation: 'getLatestBlockhash', rpcUrl: this.context.rpcUrl },
                        error as Error,
                    );
                }
            },
            { operation: 'getLatestBlockhash' },
            this.context.retryConfig,
        );
    }

    // ===== SOL OPERATIONS =====

    /**
     * Transfer native SOL between addresses
     *
     * Used by:
     * - Frontend: useTransferSOL() hook
     * - Backend: ArcClient.transferSOL() method
     */
    async transferSOL(to: string | Address, amount: bigint, signer: TransactionSigner): Promise<SOLTransferResult> {
        const fromAddress = signer.address;

        if (this.context.debug) {
            console.log('💸 [Arc] Starting SOL transfer...');
            console.log('📤 From:', fromAddress);
            console.log('📥 To:', to);
            console.log('💰 Amount:', Number(amount) / 1e9, 'SOL');
        }

        // Create transfer instruction
        const transferInstruction = getTransferSolInstruction({
            source: signer,
            destination: address(to),
            amount: amount,
        });

        // Build and send transaction
        const result = await this.buildAndSendTransaction([transferInstruction], signer, 'SOL transfer');

        return {
            ...result,
            amount,
            from: fromAddress,
            to: address(to),
        };
    }

    // ===== TOKEN OPERATIONS =====

    /**
     * Transfer SPL tokens between addresses
     *
     * Used by:
     * - Frontend: useTransferToken() hook
     * - Backend: ArcClient.transferToken() method
     */
    async transferToken(
        mint: string | Address,
        to: string | Address,
        amount: bigint,
        signer: TransactionSigner,
        createAccountIfNeeded: boolean = true,
    ): Promise<TokenTransferResult> {
        const fromAddress = signer.address;
        const mintAddress = address(mint);
        const toAddress = address(to);

        if (this.context.debug) {
            console.log('🪙 [Arc] Starting token transfer...');
            console.log('🏦 Mint:', mint);
            console.log('📤 From:', fromAddress);
            console.log('📥 To:', to);
            console.log('💎 Amount:', amount.toString());
        }

        // Find associated token accounts
        const [fromAta] = await findAssociatedTokenPda({
            mint: mintAddress,
            owner: fromAddress,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        const [toAta] = await findAssociatedTokenPda({
            mint: mintAddress,
            owner: toAddress,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        const instructions: Instruction[] = [];
        let createdAccount = false;

        // Create recipient token account if needed (idempotent)
        if (createAccountIfNeeded) {
            let accountAlreadyExists = false;
            try {
                const { value } = await this.rpc.getAccountInfo(toAta).send();
                accountAlreadyExists = Boolean(value);
            } catch (error) {
                if (this.context.debug) {
                    console.log('⚠️ [Arc] Unable to prefetch recipient ATA state; assuming creation is required.', error);
                }
            }

            const createAtaInstruction = getCreateAssociatedTokenIdempotentInstruction({
                mint: mintAddress,
                owner: toAddress,
                ata: toAta,
                payer: signer,
                tokenProgram: TOKEN_PROGRAM_ADDRESS,
            });

            instructions.push(createAtaInstruction);
            createdAccount = !accountAlreadyExists;

            if (this.context.debug) {
                if (createdAccount) {
                    console.log('🏗️ [Arc] Creating recipient token account:', toAta);
                } else {
                    console.log('ℹ️ [Arc] Recipient token account already exists, idempotent instruction will no-op:', toAta);
                }
            }
        }

        // Create transfer instruction
        const transferInstruction = getTransferInstruction({
            source: fromAta,
            destination: toAta,
            amount,
            authority: signer,
        });

        instructions.push(transferInstruction);

        // Build and send transaction
        const result = await this.buildAndSendTransaction(instructions, signer, 'token transfer');

        return {
            ...result,
            mint: mintAddress,
            amount,
            from: fromAddress,
            to: toAddress,
            fromTokenAccount: fromAta,
            toTokenAccount: toAta,
            createdAccount,
        };
    }

    /**
     * Create a new SPL token (mint account)
     *
     * Used by:
     * - Frontend: useCreateToken() hook
     * - Backend: ArcClient.createToken() method
     */
    async createToken(
        decimals: number,
        payer: TransactionSigner,
        options: {
            mintAuthority?: string | Address;
            freezeAuthority?: string | Address | null;
        } = {},
    ): Promise<TokenCreationResult> {
        if (this.context.debug) {
            console.log('🪙 [Arc] Creating new token...');
            console.log('🔢 Decimals:', decimals);
        }

        // Generate new mint keypair
        const mint = await generateKeyPairSigner();
        const mintAuthority = address(options.mintAuthority || payer.address);
        const freezeAuthority = options.freezeAuthority ? address(options.freezeAuthority) : null;

        if (this.context.debug) {
            console.log('🔑 [Arc] New mint address:', mint.address);
            console.log('👤 Mint authority:', mintAuthority);
            console.log('🧊 Freeze authority:', freezeAuthority || 'None');
        }

        // Get rent exemption amount
        const mintRent = await this.rpc.getMinimumBalanceForRentExemption(BigInt(getMintSize())).send();

        if (this.context.debug) {
            console.log('💰 [Arc] Mint rent exemption:', Number(mintRent) / 1e9, 'SOL');
        }

        // Create account instruction
        const createAccountInstruction = getCreateAccountInstruction({
            payer: payer,
            newAccount: mint,
            lamports: mintRent,
            space: getMintSize(),
            programAddress: TOKEN_PROGRAM_ADDRESS,
        });

        // Initialize mint instruction
        const initializeMintInstruction = getInitializeMintInstruction({
            mint: mint.address,
            decimals,
            mintAuthority,
            freezeAuthority,
        });

        // Build and send transaction
        const result = await this.buildAndSendTransaction(
            [createAccountInstruction, initializeMintInstruction],
            payer,
            'token creation',
        );

        return {
            ...result,
            mint: mint.address,
            decimals,
            mintAuthority,
            freezeAuthority,
        };
    }

    /**
     * Mint tokens to a specified account
     *
     * Used by:
     * - Frontend: useMintTokens() hook
     * - Backend: ArcClient.mintTokens() method
     */
    async mintTokens(
        mint: string | Address,
        to: string | Address,
        amount: bigint,
        mintAuthority: TransactionSigner,
    ): Promise<TokenMintResult> {
        const mintAddress = address(mint);
        const toAddress = address(to);

        if (this.context.debug) {
            console.log('🏭 [Arc] Minting tokens...');
            console.log('🪙 Mint:', mint);
            console.log('📥 To:', to);
            console.log('💎 Amount:', amount.toString());
        }

        // Find recipient token account
        const [toAta] = await findAssociatedTokenPda({
            mint: mintAddress,
            owner: toAddress,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        // Create mint instruction
        const mintInstruction = getMintToInstruction({
            mint: mintAddress,
            token: toAta,
            amount,
            mintAuthority: mintAuthority,
        });

        // Build and send transaction
        const result = await this.buildAndSendTransaction([mintInstruction], mintAuthority, 'token minting');

        return {
            ...result,
            mint: mintAddress,
            amount,
            to: toAddress,
            toTokenAccount: toAta,
        };
    }

    /**
     * Burn tokens from an account
     *
     * Used by:
     * - Frontend: useBurnTokens() hook
     * - Backend: ArcClient.burnTokens() method
     */
    async burnTokens(
        mint: string | Address,
        amount: bigint,
        decimals: number,
        owner: TransactionSigner,
    ): Promise<TokenBurnResult> {
        const mintAddress = address(mint);
        const ownerAddress = owner.address;

        if (this.context.debug) {
            console.log('🔥 [Arc] Burning tokens...');
            console.log('🪙 Mint:', mint);
            console.log('👤 Owner:', ownerAddress);
            console.log('💎 Amount:', amount.toString());
        }

        // Find owner token account
        const [ownerAta] = await findAssociatedTokenPda({
            mint: mintAddress,
            owner: ownerAddress,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        // Create burn instruction
        const burnInstruction = getBurnCheckedInstruction({
            mint: mintAddress,
            account: ownerAta,
            amount,
            decimals,
            authority: owner,
        });

        // Build and send transaction
        const result = await this.buildAndSendTransaction([burnInstruction], owner, 'token burning');

        return {
            ...result,
            mint: mintAddress,
            amount,
            decimals,
            from: ownerAddress,
            fromTokenAccount: ownerAta,
        };
    }

    /**
     * Create associated token account
     *
     * Used by:
     * - Frontend: useCreateTokenAccount() hook
     * - Backend: ArcClient.createTokenAccount() method
     */
    async createTokenAccount(
        mint: string | Address,
        owner: string | Address,
        payer: TransactionSigner,
    ): Promise<TokenAccountCreationResult> {
        const mintAddress = address(mint);
        const ownerAddress = address(owner);

        if (this.context.debug) {
            console.log('🏦 [Arc] Creating token account...');
            console.log('🪙 Mint:', mint);
            console.log('👤 Owner:', owner);
        }

        // Find associated token account address
        const [ata] = await findAssociatedTokenPda({
            mint: mintAddress,
            owner: ownerAddress,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        if (this.context.debug) {
            console.log('🏦 [Arc] ATA address:', ata);
        }

        // Create associated token account instruction
        const createAtaInstruction = getCreateAssociatedTokenInstruction({
            mint: mintAddress,
            owner: ownerAddress,
            ata: ata,
            payer: payer,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        // Build and send transaction
        const result = await this.buildAndSendTransaction([createAtaInstruction], payer, 'token account creation');

        return {
            ...result,
            tokenAccount: ata,
            mint: mintAddress,
            owner: ownerAddress,
        };
    }

    /**
     * Confirm a transaction with retries
     */
    async confirmTransaction(signature: string): Promise<{ confirmed: boolean; signature: string }> {
        try {
            if (!isSignature(signature)) {
                throw new Error('Invalid signature');
            }
            
            const result = await defaultRetryManager.executeWithRetry(
                async () => {
                    const response = await this.rpc.getSignatureStatuses([signature]).send();
                    const status = response?.value?.[0];

                    if (!status) {
                        throw new Error('Transaction not found');
                    }

                    if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                        return { confirmed: true, signature };
                    }

                    if (status.err) {
                        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
                    }

                    // If not confirmed yet, throw to trigger retry
                    throw new Error('Transaction not yet confirmed');
                },
                { operation: 'confirmTransaction', signature },
                this.context.retryConfig,
            );

            return result;
        } catch (error) {
            if (error instanceof Error && error.message.includes('not yet confirmed')) {
                throw new Error('Transaction confirmation timeout');
            }
            throw createTransactionError(
                `Transaction confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                {
                    signature,
                    operation: 'confirmTransaction',
                },
                error instanceof Error ? error : undefined,
            );
        }
    }

    /**
     * Calculate transaction fees based on signature count
     */
    async calculateFees(signatureCount: number): Promise<bigint> {
        try {
            // Base fee per signature (5000 lamports = 0.000005 SOL)
            const feePerSignature = 5000n;
            return BigInt(signatureCount) * feePerSignature;
        } catch (error) {
            throw createTransactionError(
                `Fee calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                {
                    operation: 'calculateFees',
                },
                error instanceof Error ? error : undefined,
            );
        }
    }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create transaction builder instance
 *
 * Used by both frontend hooks and backend client
 */
export function createTransactionBuilder(context: TransactionContext): TransactionBuilder {
    return new TransactionBuilder(context);
}

/**
 * Create transaction context from network configuration
 *
 * Helper for consistent context creation
 */
export function createTransactionContext(
    rpcUrl: string,
    commitment?: 'processed' | 'confirmed' | 'finalized',
    debug?: boolean,
    retryConfig?: Partial<ArcRetryConfig>,
): TransactionContext {
    return {
        rpcUrl,
        commitment: commitment ?? 'confirmed',
        debug: debug ?? false,
        retryConfig,
    };
}
