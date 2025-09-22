'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useArcClient } from '../core/arc-client-provider';
import { getSharedRpc, getSharedWebSocket, releaseRpcConnection } from '../core/rpc-manager';
import type { Transport } from '../transports/types';
import {
    sendAndConfirmTransactionFactory,
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
} from '@solana/kit';
import {
    TOKEN_PROGRAM_ADDRESS,
    findAssociatedTokenPda,
    getTransferInstruction,
    getCreateAssociatedTokenInstruction,
} from '@solana-program/token';
import { createInvalidator } from '../utils/invalidate';
import { validateAndNormalizeAmount } from '../utils/schema-validation';

export class BlockhashExpirationError extends Error {
    constructor(
        message: string,
        public originalError?: Error,
    ) {
        super(message);
        this.name = 'BlockhashExpirationError';
    }
}

export interface TransferTokenOptions {
    mint: string | Address; // mint address
    to: string | Address; // recipient wallet address
    amount: bigint; // amount in token's smallest unit (considering decimals)
    from?: string | Address; // auto: Uses connected wallet if not provided
    createAccountIfNeeded?: boolean; // auto-create recipient's ATA if it doesn't exist
    retryConfig?: TransferRetryConfig; // optional retry configuration
}

/**
 * Configuration for transaction retry behavior when blockhash expires.
 *
 * @example
 * ```tsx
 * const { transferToken } = useTransferToken();
 *
 * // With custom retry configuration
 * await transferToken({
 *   mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
 *   to: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
 *   amount: BigInt(1000000), // 1 USDC
 *   retryConfig: {
 *     maxAttempts: 5,
 *     baseDelay: 2000,
 *     backoffMultiplier: 1.5 // exponential backoff
 *   }
 * });
 * ```
 */
export interface TransferRetryConfig {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Base delay in milliseconds between retry attempts (default: 1000ms) */
    baseDelay?: number;
    /** Backoff multiplier for exponential backoff (default: 1 for linear backoff) */
    backoffMultiplier?: number;
}

export interface TransferTokenResult {
    signature: string;
    mint: Address;
    amount: bigint;
    from: Address;
    to: Address;
    fromTokenAccount: Address;
    toTokenAccount: Address;
    createdAccount?: boolean;
    blockTime?: number;
    slot?: number;
}

export interface UseTransferTokenReturn {
    transferToken: (options: TransferTokenOptions) => Promise<TransferTokenResult>;
    isLoading: boolean;
    error: Error | null;
    data: TransferTokenResult | null;
    reset: () => void;

    // UI INTERACTION HELPERS
    /** Input state for token mint address */
    mintInput: string;
    /** Input state for recipient address */
    toInput: string;
    /** Input state for amount (in token units) */
    amountInput: string;
    /** Set mint input */
    setMintInput: (value: string) => void;
    /** Set recipient address input */
    setToInput: (value: string) => void;
    /** Set amount input */
    setAmountInput: (value: string) => void;
    /** onChange handler for mint input */
    handleMintInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** onChange handler for recipient address input */
    handleToInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** onChange handler for amount input */
    handleAmountInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** Form submission handler that transfers tokens using current input values */
    handleSubmit: (event?: { preventDefault?: () => void }) => Promise<TransferTokenResult | undefined>;
    /** Shortcut to transfer tokens using current input values */
    transferFromInputs: () => Promise<TransferTokenResult | undefined>;
}

export function useTransferToken(
    initialMintInput: string = '',
    initialToInput: string = '',
    initialAmountInput: string = '',
): UseTransferTokenReturn {
    const { wallet, network, config } = useArcClient();
    const queryClient = useQueryClient();

    // Capture transport at component level to avoid calling useArcClient in async functions
    const transport = config.transport as Transport;

    const [mintInput, setMintInput] = useState(initialMintInput);
    const [toInput, setToInput] = useState(initialToInput);
    const [amountInput, setAmountInput] = useState(initialAmountInput);

    const stableOptionsRef = useRef({
        network: network.rpcUrl,
        commitment: config.commitment || 'confirmed',
    });

    useEffect(() => {
        stableOptionsRef.current = {
            network: network.rpcUrl,
            commitment: config.commitment || 'confirmed',
        };
    }, [network.rpcUrl, config.commitment]);

    useEffect(() => {
        return () => {
            releaseRpcConnection(network.rpcUrl);
        };
    }, [network.rpcUrl]);

    const mutation = useMutation<TransferTokenResult, Error, TransferTokenOptions>({
        mutationFn: async (options: TransferTokenOptions): Promise<TransferTokenResult> => {
            const { mint, to, amount, from: optionsFrom, createAccountIfNeeded = true } = options;

            const fromAddress = optionsFrom || wallet.address;

            if (!fromAddress) {
                throw new Error('No sender address provided and no wallet connected');
            }

            if (!wallet.signer) {
                throw new Error('Wallet not connected or no signer available');
            }

            // Robust transaction submission and confirmation
            const submitAndConfirmTransactionRobust = async (
                signedTransaction: any,
                signature: string,
                transport: any,
                sendAndConfirm: any,
            ) => {
                try {
                    // Use the standard sendAndConfirm first
                    await sendAndConfirm(signedTransaction, {
                        commitment: 'confirmed',
                        skipPreflight: false,
                    });
                } catch (confirmError: any) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(
                            '[useTransferToken] Standard confirmation failed, using robust polling:',
                            confirmError.message,
                        );
                    }

                    // If standard confirmation fails, use custom polling
                    await waitForTransactionConfirmation(signature, transport);
                }
            };

            // Custom confirmation polling that's more resilient to RPC issues
            const waitForTransactionConfirmation = async (
                signature: string,
                transport: any,
                maxWaitTime: number = 30000,
            ) => {
                const startTime = Date.now();
                let lastError: any;

                while (Date.now() - startTime < maxWaitTime) {
                    try {
                        const statusResponse: any = await transport.request({
                            method: 'getSignatureStatuses',
                            params: [[signature], { searchTransactionHistory: true }],
                        });

                        const status = statusResponse?.value?.[0];
                        if (status) {
                            if (
                                status.confirmationStatus === 'confirmed' ||
                                status.confirmationStatus === 'finalized'
                            ) {
                                if (process.env.NODE_ENV !== 'production') {
                                    console.log('[useTransferToken] Transaction confirmed via polling');
                                }
                                return; // Success
                            }

                            if (status.err) {
                                throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
                            }
                        }

                        // Wait before polling again
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error: any) {
                        lastError = error;
                        // Continue polling unless it's a clear transaction error
                        if (error.message?.includes('Transaction failed:')) {
                            throw error;
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                // Timeout - throw the last error or a timeout error
                throw lastError || new Error('Transaction confirmation timed out');
            };

            // Helper function to execute transaction with retry mechanism for blockhash expiration
            const executeTransactionWithRetry = async (
                retryConfig: TransferRetryConfig = {},
            ): Promise<TransferTokenResult> => {
                const { maxAttempts = 3, baseDelay = 1000, backoffMultiplier = 1 } = retryConfig;
                let lastError: any;

                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    try {
                        const rpc = getSharedRpc(network.rpcUrl);

                        const [fromTokenAccount] = await findAssociatedTokenPda({
                            mint: address(mint),
                            owner: address(fromAddress),
                            tokenProgram: TOKEN_PROGRAM_ADDRESS,
                        });

                        const [toTokenAccount] = await findAssociatedTokenPda({
                            mint: address(mint),
                            owner: address(to),
                            tokenProgram: TOKEN_PROGRAM_ADDRESS,
                        });

                        // Check account info on first attempt only to avoid redundant calls
                        if (attempt === 0) {
                            const fromAccountInfo: any = await transport.request({
                                method: 'getAccountInfo',
                                params: [fromTokenAccount, { encoding: 'base64' }],
                            });

                            if (!fromAccountInfo.value) {
                                throw new Error(
                                    `Sender does not have a ${mint} token account. Please ensure you have this token in your wallet.`,
                                );
                            }

                            const toAccountInfo: any = await transport.request({
                                method: 'getAccountInfo',
                                params: [toTokenAccount, { encoding: 'base64' }],
                            });

                            if (!toAccountInfo.value && !createAccountIfNeeded) {
                                throw new Error(
                                    'Recipient token account does not exist and createAccountIfNeeded is false',
                                );
                            }
                        }

                        // Get fresh blockhash on each attempt
                        const { value: latestBlockhash }: any = await transport.request({
                            method: 'getLatestBlockhash',
                            params: [],
                        });

                        const instructions: Instruction[] = [];

                        // Check if we need to create account (only on first attempt)
                        if (attempt === 0 && createAccountIfNeeded) {
                            const toAccountInfo: any = await transport.request({
                                method: 'getAccountInfo',
                                params: [toTokenAccount, { encoding: 'base64' }],
                            });

                            if (!toAccountInfo.value) {
                                const createAccountInstruction = getCreateAssociatedTokenInstruction({
                                    payer: wallet.signer as TransactionSigner,
                                    ata: toTokenAccount,
                                    owner: address(to),
                                    mint: address(mint),
                                });
                                instructions.push(createAccountInstruction);
                            }
                        }

                        const transferInstruction = getTransferInstruction({
                            source: fromTokenAccount,
                            destination: toTokenAccount,
                            authority: address(fromAddress),
                            amount,
                        });
                        instructions.push(transferInstruction);

                        const rpcSubscriptions = getSharedWebSocket(network.rpcUrl);
                        const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
                            rpc: rpc as any,
                            rpcSubscriptions: rpcSubscriptions as any,
                        });

                        const transactionMessage = pipe(
                            createTransactionMessage({ version: 0 }),
                            tx => setTransactionMessageFeePayerSigner(wallet.signer as TransactionSigner, tx),
                            tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
                            tx => appendTransactionMessageInstructions(instructions, tx),
                        );

                        const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
                        const signature = getSignatureFromTransaction(signedTransaction);

                        // Submit transaction and get robust confirmation
                        await submitAndConfirmTransactionRobust(
                            signedTransaction,
                            signature,
                            transport,
                            sendAndConfirmTransaction,
                        );

                        // If successful, return the result
                        const result: TransferTokenResult = {
                            signature,
                            mint: address(mint),
                            amount,
                            from: address(fromAddress),
                            to: address(to),
                            fromTokenAccount,
                            toTokenAccount,
                            createdAccount: attempt === 0 && createAccountIfNeeded, // Only true if account was created on first attempt
                        };

                        return result;
                    } catch (error: any) {
                        lastError = error;
                        const errorMessage = error?.message || String(error);

                        // Check if this is a blockhash expiration error
                        const isBlockhashExpired =
                            errorMessage.includes('block height') ||
                            errorMessage.includes('blockhash') ||
                            errorMessage.includes('last block for which this transaction could have been committed');

                        // Log attempt for debugging
                        if (process.env.NODE_ENV !== 'production') {
                            console.log(
                                `[useTransferToken] Attempt ${attempt + 1}/${maxAttempts} failed:`,
                                errorMessage,
                            );
                            if (isBlockhashExpired) {
                                console.log(
                                    '[useTransferToken] Detected blockhash expiration, will retry with fresh blockhash',
                                );
                            }
                        }

                        // If this is the last attempt, provide a better error message
                        if (attempt === maxAttempts - 1) {
                            if (isBlockhashExpired) {
                                throw new BlockhashExpirationError(
                                    `Transaction failed after ${maxAttempts} attempts due to blockhash expiration. ` +
                                        `This can happen during network congestion. Please try again.`,
                                    error,
                                );
                            }
                            throw error;
                        }

                        // If not a blockhash error, don't retry
                        if (!isBlockhashExpired) {
                            throw error;
                        }

                        // Wait with configurable delay and backoff before retrying
                        const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }

                // This should never be reached, but just in case
                throw lastError;
            };

            return executeTransactionWithRetry(options.retryConfig);
        },
        onSuccess: async result => {
            // Invalidate cache for both sender and recipient token accounts
            const invalidator = createInvalidator(queryClient);
            await invalidator.invalidateAfterTokenTransfer(
                result.from.toString(),
                result.to.toString(),
                result.mint.toString(),
                { refetch: true },
            );
        },
        onError: () => {},
    });

    const handleMintInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setMintInput(event.target.value);
    }, []);

    const handleToInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setToInput(event.target.value);
    }, []);

    const handleAmountInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setAmountInput(event.target.value);
    }, []);

    const transferFromInputs = useCallback(async () => {
        if (!mintInput || !toInput || !amountInput) {
            throw new Error('Mint address, recipient address, and amount are all required');
        }

        try {
            // Validate and normalize the amount input with proper decimal handling
            const validatedAmount = validateAndNormalizeAmount(amountInput, {
                decimals: 9, // Default to 9 decimals for standard SPL tokens
                allowDecimals: true,
            });

            return await mutation.mutateAsync({
                mint: mintInput,
                to: toInput,
                amount: validatedAmount.amount,
                createAccountIfNeeded: true, // Default to auto-create
            });
        } catch (error) {
            // Re-throw validation errors with user-friendly messages
            if (error instanceof Error) {
                throw new Error(`Invalid amount: ${error.message}`);
            }
            throw error;
        }
    }, [mintInput, toInput, amountInput, mutation.mutateAsync]);

    const handleSubmit = useCallback(
        async (event?: { preventDefault?: () => void }) => {
            event?.preventDefault?.();
            return mintInput && toInput && amountInput ? transferFromInputs() : undefined;
        },
        [mintInput, toInput, amountInput, transferFromInputs],
    );

    return {
        transferToken: (options: TransferTokenOptions) => mutation.mutateAsync(options),
        isLoading: mutation.isPending,
        error: mutation.error,
        data: mutation.data || null,
        reset: mutation.reset,
        mintInput,
        toInput,
        amountInput,
        setMintInput,
        setToInput,
        setAmountInput,
        handleMintInputChange,
        handleToInputChange,
        handleAmountInputChange,
        handleSubmit,
        transferFromInputs,
    };
}
