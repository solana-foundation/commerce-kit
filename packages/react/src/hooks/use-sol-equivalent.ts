/**
 * useSolEquivalent Hook
 * Properly calculates SOL equivalent for USD amounts using useAsync pattern
 */

import { useMemo } from 'react';
import { useAsync } from './use-async';
import { convertUsdToSol } from '../utils';
import type { Currency } from '../types';

export interface UseSolEquivalentReturn {
    solEquivalent: string | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook to calculate SOL equivalent for USD amounts
 * Uses proper async patterns instead of useEffect for data transformation
 */
export function useSolEquivalent(currency: Currency, amount: number): UseSolEquivalentReturn {
    // Only calculate for SOL currencies
    const isSOL = currency === 'SOL' || currency === 'SOL_DEVNET';
    const shouldCalculate = isSOL && amount > 0;

    // Create stable async function reference
    const asyncCalculation = useMemo(
        () => (shouldCalculate 
            ? async () => {
                const solAmount = await convertUsdToSol(amount);
                return `${solAmount.toFixed(4)} SOL`;
            }
            : undefined
        ),
        [shouldCalculate, amount]
    );

    // Use the existing useAsync hook for proper async state management
    const { data: solEquivalent, loading: isLoading, error } = useAsync(
        asyncCalculation,
        shouldCalculate // Execute immediately if we should calculate
    );

    return {
        solEquivalent: shouldCalculate ? solEquivalent : null,
        isLoading: shouldCalculate ? isLoading : false,
        error: shouldCalculate ? error : null,
    };
}
