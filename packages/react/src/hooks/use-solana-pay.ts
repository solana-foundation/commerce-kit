import {
    createSolanaPayRequest,
    SolanaPayRequestOptions,
    toMinorUnits,
} from '@solana-commerce/headless';
import { Recipient } from '@solana-commerce/solana-pay';
import { useMemo } from 'react';
import { Currency, CurrencyMap } from '../types';
import { useAsync } from './use-async';

export interface SolanaPayQROptions extends SolanaPayRequestOptions {
    label?: string;
    message?: string;
}

/**
 * Validates that a currency is supported by checking if it exists in CurrencyMap
 * @param currency - The currency to validate
 * @throws {Error} When currency is not supported
 */
function validateCurrency(currency: Currency): void {
    if (!CurrencyMap.hasOwnProperty(currency)) {
        const supportedCurrencies = Object.keys(CurrencyMap).join(', ');
        throw new Error(`Unsupported currency: ${currency}. Supported currencies are: ${supportedCurrencies}`);
    }
}

export function useSolanaPay(recipient: string, amount: number, currency: Currency, opts?: SolanaPayQROptions) {
    const requestParams = useMemo(() => {
        if (!recipient || !amount || !currency) return null;
        
        // Validate currency before proceeding
        validateCurrency(currency);
        
        // Generate a unique reference for this payment
        const reference = `tip-${Math.floor(Math.random() * 1000000)}`;
        
        // Get token info from enhanced currency map
        const tokenInfo = CurrencyMap[currency];
        const decimals = tokenInfo === 'SOL' ? 9 : tokenInfo.decimals;
        // For native SOL, use undefined; for SPL tokens, use the mint address
        const splToken = tokenInfo === 'SOL' ? undefined : tokenInfo.mint;

        return {
            paymentData: {
                recipient: recipient as Recipient,
                amount: toMinorUnits(amount, decimals), // to minor units
                splToken,
                memo: reference,
                label: opts?.label ?? 'commerceKit',
                message: opts?.message,
            },
            qrOptions: {
                size: opts?.size ?? 256,
                background: opts?.background ?? 'white',
                color: opts?.color ?? 'black',
                // Pass through advanced QR options
                margin: opts?.margin,
                errorCorrectionLevel: opts?.errorCorrectionLevel,
                logo: opts?.logo,
                logoSize: opts?.logoSize,
                logoBackgroundColor: opts?.logoBackgroundColor,
                logoMargin: opts?.logoMargin,
                dotStyle: opts?.dotStyle,
                cornerStyle: opts?.cornerStyle,
            },
            reference,
        };
    }, [recipient, amount, currency, opts]);

    // ✅ GOOD: Use useAsync hook for proper async state management
    const asyncRequestCreation = useMemo(
        () => (requestParams 
            ? async () => {
                const request = await createSolanaPayRequest(
                    requestParams.paymentData,
                    requestParams.qrOptions,
                );

                // Add memo to the returned request
                return {
                    ...request,
                    memo: requestParams.reference,
                };
            }
            : undefined
        ),
        [requestParams]
    );

    const { data: paymentRequest, loading, error } = useAsync(
        asyncRequestCreation,
        !!requestParams // Execute immediately if we have valid params
    );

    return {
        paymentRequest,
        loading,
        error,
    };
}
