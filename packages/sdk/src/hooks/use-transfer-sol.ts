'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useArcClient } from '../core/commerce-client-provider';
import { releaseRpcConnection } from '../core/rpc-manager';
import { createTransactionBuilder, createTransactionContext } from '../core/transaction-builder';
import { address, type Address, type TransactionSigner } from '@solana/kit';
import { createInvalidator } from '../utils/invalidate';

/**
 * Converts SOL amount string to lamports with precise string-based arithmetic
 * Avoids floating-point precision issues by handling decimal conversion manually
 */
function convertSOLToLamports(solAmount: string): bigint {
    // Validation: empty or whitespace
    if (!solAmount || !solAmount.trim()) {
        throw new Error('Amount cannot be empty');
    }

    const trimmed = solAmount.trim();

    // Check for negative sign and reject it
    if (trimmed.startsWith('-')) {
        throw new Error('Amount cannot be negative');
    }

    // Validate it's a valid number format (digits, optional decimal point, more digits)
    if (!/^\d*\.?\d*$/.test(trimmed)) {
        throw new Error('Invalid number format');
    }

    // Split on decimal point
    const [integerPart = '0', fractionalPart = ''] = trimmed.split('.');

    // Validate we have at least one digit somewhere
    if ((integerPart === '' || integerPart === '0') && fractionalPart === '') {
        throw new Error('Amount must be greater than zero');
    }

    // Handle fractional part: pad to 9 digits (right-pad with zeros) or truncate extra digits
    const paddedFractional = fractionalPart.padEnd(9, '0').slice(0, 9);

    // Convert to BigInt - integer part shifted left by 9 decimal places (1e9 lamports = 1 SOL)
    const integerLamports = BigInt(integerPart || '0') * 1_000_000_000n;
    const fractionalLamports = BigInt(paddedFractional || '0');

    const totalLamports = integerLamports + fractionalLamports;

    // Final validation
    if (totalLamports <= 0n) {
        throw new Error('Amount must be greater than zero');
    }

    return totalLamports;
}

export interface TransferSOLOptions {
    to: string | Address;
    amount: bigint;
    from?: string | Address;
}

export interface TransferSOLResult {
    signature: string;
    amount: bigint;
    from: Address;
    to: Address;
    blockTime?: number;
    slot?: number;
}

export interface UseTransferSOLReturn {
    transferSOL: (options: TransferSOLOptions) => Promise<TransferSOLResult>;
    isLoading: boolean;
    error: Error | null;
    data: TransferSOLResult | null;
    reset: () => void;

    // UI INTERACTION HELPERS
    /** Input state for recipient address */
    toInput: string;
    /** Input state for amount (in SOL) */
    amountInput: string;
    /** Set recipient address input */
    setToInput: (value: string) => void;
    /** Set amount input */
    setAmountInput: (value: string) => void;
    /** onChange handler for recipient address input */
    handleToInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** onChange handler for amount input */
    handleAmountInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** Form submission handler that transfers SOL using current input values */
    handleSubmit: (event?: { preventDefault?: () => void }) => Promise<TransferSOLResult | undefined>;
    /** Shortcut to transfer SOL using current input values */
    transferFromInputs: () => Promise<TransferSOLResult | undefined>;
}

export function useTransferSOL(initialToInput = '', initialAmountInput = ''): UseTransferSOLReturn {
    const { wallet, network, config } = useArcClient();
    const queryClient = useQueryClient();

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

    const mutation = useMutation<TransferSOLResult, Error, TransferSOLOptions>({
        mutationFn: async (options: TransferSOLOptions): Promise<TransferSOLResult> => {
            const { to, amount, from: optionsFrom } = options;

            // Verify wallet and signer are available before accessing properties
            if (!wallet || !wallet.signer) {
                throw new Error('Wallet not connected or no signer available');
            }

            const fromAddress = optionsFrom || wallet.address;

            if (!fromAddress) {
                throw new Error('No sender address provided and no wallet connected');
            }

            // After null checks, signer is guaranteed to be defined
            const signer: TransactionSigner = wallet.signer;

            // Ensure latest blockhash retrieval uses transport via builder context
            const transactionBuilder = createTransactionBuilder(
                createTransactionContext(network.rpcUrl, config.commitment || 'confirmed', true),
            );

            // Use shared SOL transfer implementation
            return await transactionBuilder.transferSOL(to, amount, signer);
        },
        onSuccess: async result => {
            // Invalidate cache for both sender and recipient
            const invalidator = createInvalidator(queryClient);
            await invalidator.invalidateAfterTransfer(result.from.toString(), result.to.toString(), { refetch: true });
        },
        onError: () => {},
    });

    const handleToInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setToInput(event.target.value);
    }, []);

    const handleAmountInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setAmountInput(event.target.value);
    }, []);

    const transferFromInputs = useCallback(async () => {
        if (!toInput || !amountInput) {
            throw new Error('Both recipient address and amount are required');
        }

        const amountInLamports = convertSOLToLamports(amountInput);

        return await mutation.mutateAsync({
            to: toInput,
            amount: amountInLamports,
        });
    }, [toInput, amountInput, mutation.mutateAsync]);

    const handleSubmit = useCallback(
        async (event?: { preventDefault?: () => void }) => {
            event?.preventDefault?.();
            return toInput && amountInput ? transferFromInputs() : undefined;
        },
        [toInput, amountInput, transferFromInputs],
    );

    return {
        transferSOL: (options: TransferSOLOptions) => mutation.mutateAsync(options),
        isLoading: mutation.isPending,
        error: mutation.error,
        data: mutation.data ?? null,
        reset: mutation.reset,
        toInput,
        amountInput,
        setToInput,
        setAmountInput,
        handleToInputChange,
        handleAmountInputChange,
        handleSubmit,
        transferFromInputs,
    };
}
