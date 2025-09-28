import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSolanaPay } from '../../hooks/use-solana-pay';

// Mock the headless SDK
vi.mock('@solana-commerce/headless-sdk', () => ({
    createSolanaPayRequest: vi.fn(),
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
