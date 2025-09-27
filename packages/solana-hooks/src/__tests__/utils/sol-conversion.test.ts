import { describe, it, expect } from 'vitest';

// We need to extract the convertSOLToLamports function for testing
// Since it's internal to useTransferSOL, we'll test it through a utility export

/**
 * Extract and test the SOL to lamports conversion logic
 * This is the same function from useTransferSOL but exported for testing
 */
export function convertSOLToLamports(solAmount: string): bigint {
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

describe('SOL to Lamports Conversion', () => {
    describe('Valid conversions', () => {
        it('should convert whole SOL amounts correctly', () => {
            expect(convertSOLToLamports('1')).toBe(1_000_000_000n);
            expect(convertSOLToLamports('5')).toBe(5_000_000_000n);
            expect(convertSOLToLamports('10')).toBe(10_000_000_000n);
        });

        it('should convert decimal SOL amounts correctly', () => {
            expect(convertSOLToLamports('0.1')).toBe(100_000_000n);
            expect(convertSOLToLamports('0.5')).toBe(500_000_000n);
            expect(convertSOLToLamports('1.5')).toBe(1_500_000_000n);
            expect(convertSOLToLamports('2.25')).toBe(2_250_000_000n);
        });

        it('should handle precise fractional amounts', () => {
            expect(convertSOLToLamports('0.000000001')).toBe(1n); // 1 lamport
            expect(convertSOLToLamports('0.123456789')).toBe(123_456_789n);
            expect(convertSOLToLamports('1.000000001')).toBe(1_000_000_001n);
        });

        it('should truncate extra decimal places beyond 9', () => {
            expect(convertSOLToLamports('1.123456789999')).toBe(1_123_456_789n);
            expect(convertSOLToLamports('0.0000000019')).toBe(1n); // Truncated to 1 lamport
        });

        it('should handle leading zeros', () => {
            expect(convertSOLToLamports('01')).toBe(1_000_000_000n);
            expect(convertSOLToLamports('001.5')).toBe(1_500_000_000n);
            expect(convertSOLToLamports('0.100')).toBe(100_000_000n);
        });

        it('should handle trailing zeros', () => {
            expect(convertSOLToLamports('1.0')).toBe(1_000_000_000n);
            expect(convertSOLToLamports('1.500000000')).toBe(1_500_000_000n);
        });

        it('should handle whitespace', () => {
            expect(convertSOLToLamports(' 1 ')).toBe(1_000_000_000n);
            expect(convertSOLToLamports('  0.5  ')).toBe(500_000_000n);
        });
    });

    describe('Edge cases', () => {
        it('should handle minimum amount', () => {
            expect(convertSOLToLamports('0.000000001')).toBe(1n);
        });

        it('should handle large amounts', () => {
            expect(convertSOLToLamports('1000000')).toBe(1_000_000_000_000_000n);
            expect(convertSOLToLamports('999999999.999999999')).toBe(999_999_999_999_999_999n);
        });

        it('should handle decimal-only amounts', () => {
            expect(convertSOLToLamports('.5')).toBe(500_000_000n);
            expect(convertSOLToLamports('.1')).toBe(100_000_000n);
            expect(convertSOLToLamports('.000000001')).toBe(1n);
        });
    });

    describe('Invalid inputs', () => {
        it('should reject empty strings', () => {
            expect(() => convertSOLToLamports('')).toThrow('Amount cannot be empty');
            expect(() => convertSOLToLamports('   ')).toThrow('Amount cannot be empty');
        });

        it('should reject negative amounts', () => {
            expect(() => convertSOLToLamports('-1')).toThrow('Amount cannot be negative');
            expect(() => convertSOLToLamports('-0.1')).toThrow('Amount cannot be negative');
        });

        it('should reject zero amounts', () => {
            expect(() => convertSOLToLamports('0')).toThrow('Amount must be greater than zero');
            expect(() => convertSOLToLamports('0.0')).toThrow('Amount must be greater than zero');
            expect(() => convertSOLToLamports('0.000000000')).toThrow('Amount must be greater than zero');
        });

        it('should reject invalid number formats', () => {
            expect(() => convertSOLToLamports('abc')).toThrow('Invalid number format');
            expect(() => convertSOLToLamports('1.2.3')).toThrow('Invalid number format');
            expect(() => convertSOLToLamports('1e5')).toThrow('Invalid number format');
            expect(() => convertSOLToLamports('1,000')).toThrow('Invalid number format');
            expect(() => convertSOLToLamports('1 SOL')).toThrow('Invalid number format');
        });

        it('should reject special characters', () => {
            expect(() => convertSOLToLamports('1.5+')).toThrow('Invalid number format');
            expect(() => convertSOLToLamports('$1.5')).toThrow('Invalid number format');
            expect(() => convertSOLToLamports('1.5%')).toThrow('Invalid number format');
        });

        it('should reject infinity and NaN representations', () => {
            expect(() => convertSOLToLamports('Infinity')).toThrow('Invalid number format');
            expect(() => convertSOLToLamports('NaN')).toThrow('Invalid number format');
        });
    });

    describe('Type handling', () => {
        it('should reject number inputs', () => {
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports(1)).toThrow();
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports(1.5)).toThrow();
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports(0)).toThrow();
        });

        it('should reject null and undefined inputs', () => {
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports(null)).toThrow();
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports(undefined)).toThrow();
        });

        it('should reject non-string objects', () => {
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports({})).toThrow();
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports([])).toThrow();
            // @ts-expect-error - Testing runtime behavior with wrong types
            expect(() => convertSOLToLamports(true)).toThrow();
        });
    });

    describe('Precision handling', () => {
        it('should maintain precision for max decimals', () => {
            // Test the maximum precision Solana supports
            const maxPrecision = '1.123456789';
            expect(convertSOLToLamports(maxPrecision)).toBe(1_123_456_789n);
        });

        it('should handle floating point edge cases', () => {
            // These amounts might cause floating point precision issues in naive implementations
            expect(convertSOLToLamports('0.1')).toBe(100_000_000n);
            expect(convertSOLToLamports('0.2')).toBe(200_000_000n);
            expect(convertSOLToLamports('0.3')).toBe(300_000_000n);
        });

        it('should handle repeated decimals correctly', () => {
            expect(convertSOLToLamports('0.333333333')).toBe(333_333_333n);
            expect(convertSOLToLamports('0.666666666')).toBe(666_666_666n);
            expect(convertSOLToLamports('0.999999999')).toBe(999_999_999n);
        });
    });
});
