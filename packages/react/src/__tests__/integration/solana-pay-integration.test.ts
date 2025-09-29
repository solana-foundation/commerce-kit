import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSolanaPay } from '../../hooks/use-solana-pay';

// Mock the headless SDK
vi.mock('@solana-commerce/headless', () => ({
    createSolanaPayRequest: vi.fn(),
    toMinorUnits: vi.fn((amount: number, decimals: number): bigint => {
        // Real implementation for tests
        if (!Number.isFinite(amount) || decimals < 0) {
            throw new Error('Invalid amount/decimals');
        }
        const s = amount.toFixed(decimals);
        const parts = s.split('.');
        const integerPart = parts[0] || '0';
        const fractionalPartRaw = parts[1] || '';
        const normalizedFractional =
            decimals === 0 || fractionalPartRaw.length === 0
                ? decimals === 0
                    ? '0'
                    : '0'.repeat(decimals)
                : fractionalPartRaw.padEnd(decimals, '0');
        return BigInt(integerPart) * 10n ** BigInt(decimals) + BigInt(normalizedFractional);
    }),
}));

describe('Solana Pay Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should integrate useSolanaPay hook with proper types', () => {
        const { result } = renderHook(() => useSolanaPay('DemoMerchantPublicKey123456789', 10, 'USDC'));

        expect(result.current.loading).toBeDefined();
        expect(result.current.paymentRequest).toBeDefined();
    });

    it('should handle different currencies', () => {
        const { result: usdcResult } = renderHook(() => useSolanaPay('merchant123', 5, 'USDC'));

        const { result: solResult } = renderHook(() => useSolanaPay('merchant123', 5, 'SOL'));

        expect(usdcResult.current).toBeDefined();
        expect(solResult.current).toBeDefined();
    });

    it('should handle QR options', () => {
        const qrOptions = {
            size: 300,
            background: 'white',
            color: 'black',
            label: 'Test Payment',
            message: 'Test message',
        };

        const { result } = renderHook(() => useSolanaPay('merchant123', 10, 'USDC', qrOptions));

        expect(result.current).toBeDefined();
    });
});
