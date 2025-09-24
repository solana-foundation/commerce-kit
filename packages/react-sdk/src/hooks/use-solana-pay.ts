import { createSolanaPayRequest } from '@solana-commerce/headless-sdk';
import { Recipient } from '@solana-commerce/solana-pay';
import { useMemo } from 'react';
import { Currency, CurrencyMap } from '../types';
import { CURRENCY_DECIMALS } from '../constants/tip-modal';
import { useAsync } from './use-async';

// Converts a decimal `amount` to minor units as bigint using string math.
export function toMinorUnits(amt: number, decimals: number): bigint {
    if (!Number.isFinite(amt) || decimals < 0) throw new Error('Invalid amount/decimals');
    const s = amt.toFixed(decimals); // stable string with exactly `decimals` fraction digits
    const parts = s.split('.');
    const i = parts[0] || '0';
    const f = parts[1] || '';
    return BigInt(i) * 10n ** BigInt(decimals) + BigInt(f.padEnd(decimals, '0'));
}

export interface SolanaPayQROptions {
    size?: number;
    background?: string;
    color?: string;
    label?: string;
    message?: string;
    // Advanced QR customization options
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    logo?: string;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    dotStyle?: 'dots' | 'rounded' | 'square';
    cornerStyle?: 'square' | 'rounded' | 'extra-rounded' | 'full-rounded' | 'maximum-rounded';
}

export function useSolanaPay(recipient: string, amount: number, currency: Currency, opts?: SolanaPayQROptions) {
    // ✅ GOOD: Use useMemo for synchronous data derivation
    const requestParams = useMemo(() => {
        if (!recipient || !amount || !currency) return null;
        
        // Generate a unique reference for this payment
        const reference = `tip-${Math.floor(Math.random() * 1000000)}`;
        
        // Get token address and decimals from currency
        const decimals = CURRENCY_DECIMALS[currency];
        // For native SOL, use undefined; for SPL tokens, use the mint address
        const splToken = currency === 'SOL' || currency === 'SOL_DEVNET' ? undefined : CurrencyMap[currency];

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
