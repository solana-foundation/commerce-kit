import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

export interface InvalidateOptions {
    refetch?: boolean;
}

/**
 * Invalidate queries after a transaction or state change
 */
export class QueryInvalidator {
    constructor(private queryClient: QueryClient) {}

    // Invalidate all queries for an address (balance, token accounts, etc)
    async invalidateAddress(address: string, options?: InvalidateOptions) {
        await Promise.all([
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.balance(address),
                ...options,
            }),
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.account(address),
                ...options,
            }),
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.tokenAccountsByOwner(address),
                ...options,
            }),
        ]);
    }

    // Invalidate after SOL transfer
    async invalidateAfterTransfer(from: string, to: string, options?: InvalidateOptions) {
        await Promise.all([this.invalidateAddress(from, options), this.invalidateAddress(to, options)]);
    }

    // Invalidate after token transfer
    async invalidateAfterTokenTransfer(from: string, to: string, mint: string, options?: InvalidateOptions) {
        await Promise.all([
            this.invalidateAddress(from, options),
            this.invalidateAddress(to, options),
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.tokenAccount(from, mint),
                ...options,
            }),
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.tokenAccount(to, mint),
                ...options,
            }),
        ]);
    }

    // Invalidate after mint operation
    async invalidateAfterMint(mint: string, recipient: string, options?: InvalidateOptions) {
        await Promise.all([
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.mint(mint),
                ...options,
            }),
            this.invalidateAddress(recipient, options),
        ]);
    }

    // Clear all Arc queries
    async invalidateAll(options?: InvalidateOptions) {
        await this.queryClient.invalidateQueries({
            queryKey: queryKeys.all,
            ...options,
        });
    }

    // Remove specific queries from cache
    removeAddress(address: string) {
        this.queryClient.removeQueries({ queryKey: queryKeys.balance(address) });
        this.queryClient.removeQueries({ queryKey: queryKeys.account(address) });
        this.queryClient.removeQueries({ queryKey: queryKeys.tokenAccountsByOwner(address) });
    }

    removeAll() {
        this.queryClient.removeQueries({ queryKey: queryKeys.all });
    }
}

// Convenience functions for hooks
export function createInvalidator(queryClient: QueryClient) {
    return new QueryInvalidator(queryClient);
}
