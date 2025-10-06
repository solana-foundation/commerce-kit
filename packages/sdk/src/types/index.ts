/**
 * @solana-commerce/sdk - Type Exports
 *
 * Central location for all public types.
 * Internal types should remain in their respective modules.
 */

// ===== CORE TYPES =====
export * from '.'; // Core types from types.ts
// ===== HOOK OPTION TYPES =====
export interface UseSwapOptions {
    providers?: string[];
    strategy?: 'best-price' | 'fastest' | 'lowest-fees';
    maxSlippage?: number;
}

export interface UseTransactionOptions {
    confirmationStrategy?: 'processed' | 'confirmed' | 'finalized';
    skipPreflight?: boolean;
    computeUnitLimit?: number;
    computeUnitPrice?: number;
}

// ===== STATE TYPES =====
export interface SwapState {
    isLoading: boolean;
    error: Error | null;
    quotes: unknown[];
    selectedQuote: unknown | null;
}
