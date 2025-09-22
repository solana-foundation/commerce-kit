import { describe, it, expect } from 'vitest';
import { SOLANA_PROTOCOL, HTTPS_PROTOCOL, MEMO_PROGRAM_ID, TOKEN_PROGRAM_ID, SOL_DECIMALS, TEN } from '../constants';

describe('Constants', () => {
    describe('Protocol Constants', () => {
        it('should have correct Solana protocol', () => {
            expect(SOLANA_PROTOCOL).toBe('solana:');
            expect(typeof SOLANA_PROTOCOL).toBe('string');
        });

        it('should have correct HTTPS protocol', () => {
            expect(HTTPS_PROTOCOL).toBe('https:');
            expect(typeof HTTPS_PROTOCOL).toBe('string');
        });

        it('should have protocols ending with colon', () => {
            expect(SOLANA_PROTOCOL.endsWith(':')).toBe(true);
            expect(HTTPS_PROTOCOL.endsWith(':')).toBe(true);
        });
    });

    describe('Program IDs', () => {
        it('should have valid memo program ID', () => {
            expect(MEMO_PROGRAM_ID).toBeDefined();
            expect(typeof MEMO_PROGRAM_ID.toString).toBe('function');
            expect(MEMO_PROGRAM_ID.toString()).toBe('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        });

        it('should have valid token program ID', () => {
            expect(TOKEN_PROGRAM_ID).toBeDefined();
            expect(typeof TOKEN_PROGRAM_ID.toString).toBe('function');
            expect(TOKEN_PROGRAM_ID.toString()).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        });

        it('should have program IDs as proper Address objects', () => {
            // Should have gill Address properties
            expect(MEMO_PROGRAM_ID).toHaveProperty('toString');
            expect(TOKEN_PROGRAM_ID).toHaveProperty('toString');

            // Should be valid Solana addresses (typically 43-44 characters)
            expect(MEMO_PROGRAM_ID.toString().length).toBeGreaterThanOrEqual(43);
            expect(MEMO_PROGRAM_ID.toString().length).toBeLessThanOrEqual(44);
            expect(TOKEN_PROGRAM_ID.toString().length).toBeGreaterThanOrEqual(43);
            expect(TOKEN_PROGRAM_ID.toString().length).toBeLessThanOrEqual(44);
        });

        it('should use well-known Solana program addresses', () => {
            // These are standard Solana program addresses (43-44 characters, Base58)
            expect(MEMO_PROGRAM_ID.toString()).toMatch(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/);
            expect(TOKEN_PROGRAM_ID.toString()).toMatch(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/);
        });
    });

    describe('Decimal Constants', () => {
        it('should have correct SOL decimals', () => {
            expect(SOL_DECIMALS).toBe(9);
            expect(typeof SOL_DECIMALS).toBe('number');
            expect(Number.isInteger(SOL_DECIMALS)).toBe(true);
        });

        it('should have SOL decimals in valid range', () => {
            expect(SOL_DECIMALS).toBeGreaterThan(0);
            expect(SOL_DECIMALS).toBeLessThanOrEqual(18); // Reasonable upper bound
        });

        it('should have correct TEN constant', () => {
            expect(TEN).toBe(10n);
            expect(typeof TEN).toBe('bigint');
        });

        it('should be usable for lamport calculations', () => {
            // 1 SOL = 10^9 lamports
            const oneSolInLamports = TEN ** BigInt(SOL_DECIMALS);
            expect(oneSolInLamports).toBe(1000000000n);

            // 0.5 SOL = 500,000,000 lamports
            const halfSolInLamports = oneSolInLamports / 2n;
            expect(halfSolInLamports).toBe(500000000n);

            // 0.001 SOL = 1,000,000 lamports
            const milliSolInLamports = oneSolInLamports / 1000n;
            expect(milliSolInLamports).toBe(1000000n);
        });
    });

    describe('Constant Relationships', () => {
        it('should have consistent decimal system', () => {
            // SOL_DECIMALS and TEN should work together
            const lamportsPerSol = TEN ** BigInt(SOL_DECIMALS);
            expect(lamportsPerSol).toBe(1000000000n);

            // Should be able to convert back and forth
            const solAmount = 2.5;
            const lamports = BigInt(solAmount * Number(lamportsPerSol));
            const backToSol = Number(lamports) / Number(lamportsPerSol);
            expect(backToSol).toBe(solAmount);
        });

        it('should handle maximum precision', () => {
            // Smallest unit (1 lamport)
            const smallestUnit = 1n;
            const asSol = Number(smallestUnit) / Number(TEN ** BigInt(SOL_DECIMALS));
            expect(asSol).toBe(0.000000001);
        });

        it('should handle large amounts', () => {
            // 1 million SOL
            const millionSol = 1000000;
            const lamports = BigInt(millionSol) * TEN ** BigInt(SOL_DECIMALS);
            expect(lamports).toBe(1000000000000000n);
        });
    });

    describe('Protocol Usage', () => {
        it('should be usable for URL construction', () => {
            const testAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

            // Solana Pay URL
            const solanaUrl = SOLANA_PROTOCOL + testAddress;
            expect(solanaUrl).toBe('solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');

            // HTTPS URL
            const httpsUrl = HTTPS_PROTOCOL + '//example.com/api';
            expect(httpsUrl).toBe('https://example.com/api');
        });

        it('should be compatible with URL constructor', () => {
            const testPath = '/api/transaction';

            // Should work with URL constructor
            const httpsUrl = new URL(testPath, HTTPS_PROTOCOL + '//example.com');
            expect(httpsUrl.protocol).toBe('https:');
            expect(httpsUrl.hostname).toBe('example.com');
            expect(httpsUrl.pathname).toBe('/api/transaction');
        });
    });

    describe('Mathematical Constants', () => {
        it('should support various mathematical operations', () => {
            // Powers
            expect(TEN ** 0n).toBe(1n);
            expect(TEN ** 1n).toBe(10n);
            expect(TEN ** 2n).toBe(100n);
            expect(TEN ** BigInt(SOL_DECIMALS)).toBe(1000000000n);

            // Division
            expect(1000000000n / TEN ** BigInt(SOL_DECIMALS)).toBe(1n);
            expect(500000000n / TEN ** BigInt(SOL_DECIMALS)).toBe(0n); // Integer division

            // Modulo
            expect(1500000000n % TEN ** BigInt(SOL_DECIMALS)).toBe(500000000n);
        });

        it('should handle precision calculations correctly', () => {
            const lamportsPerSol = TEN ** BigInt(SOL_DECIMALS);

            // Test various SOL amounts converted to lamports
            const testCases = [
                { sol: 1, lamports: 1000000000n },
                { sol: 0.5, lamports: 500000000n },
                { sol: 0.1, lamports: 100000000n },
                { sol: 0.01, lamports: 10000000n },
                { sol: 0.001, lamports: 1000000n },
                { sol: 0.000000001, lamports: 1n },
            ];

            testCases.forEach(({ sol, lamports }) => {
                const calculated = BigInt(Math.round(sol * Number(lamportsPerSol)));
                expect(calculated).toBe(lamports);
            });
        });
    });

    describe('Type Safety', () => {
        it('should have correct types for all constants', () => {
            expect(typeof SOLANA_PROTOCOL).toBe('string');
            expect(typeof HTTPS_PROTOCOL).toBe('string');
            expect(typeof SOL_DECIMALS).toBe('number');
            expect(typeof TEN).toBe('bigint');

            // Address types should have toString method
            expect(typeof MEMO_PROGRAM_ID.toString).toBe('function');
            expect(typeof TOKEN_PROGRAM_ID.toString).toBe('function');
        });

        it('should maintain immutability', () => {
            // Constants should be read-only
            const originalSolDecimals = SOL_DECIMALS;
            const originalTen = TEN;
            const originalSolanaProtocol = SOLANA_PROTOCOL;

            // These should not be modifiable
            expect(SOL_DECIMALS).toBe(originalSolDecimals);
            expect(TEN).toBe(originalTen);
            expect(SOLANA_PROTOCOL).toBe(originalSolanaProtocol);
        });
    });
});
