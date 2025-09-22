import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    validateCustomerInfo,
    validatePaymentMethod,
    calculateTotal,
    createPaymentReference,
    validateWalletAddress,
    createPaymentUrl,
    validatePaymentRequest,
    formatSolAmount,
    parseSolAmount,
    isValidSolanaAddress,
    lamportsToDisplay,
    displayToLamports,
} from '../utils';

// Mock gill address function
vi.mock('gill', () => ({
    address: vi.fn(addr => {
        // Mock successful validation for known addresses
        if (
            addr === '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' ||
            addr === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' ||
            addr === '11111111111111111111111111111112'
        ) {
            return { toString: () => addr };
        }
        throw new Error('Invalid address');
    }),
}));

describe('Utils', () => {
    describe('validateCustomerInfo', () => {
        describe('Email Validation', () => {
            it('should validate correct email format', () => {
                const result = validateCustomerInfo('test@example.com');
                expect(result.valid).toBe(true);
                expect(result.errors).toEqual({});
            });

            it('should require email', () => {
                const result = validateCustomerInfo();
                expect(result.valid).toBe(false);
                expect(result.errors.email).toBe('Email is required');
            });

            it('should reject invalid email formats', () => {
                const invalidEmails = [
                    'invalid-email',
                    'test@',
                    '@example.com',
                    'test.example.com',
                    'test @example.com',
                    'test@.com',
                    'test@example',
                    '',
                ];

                invalidEmails.forEach(email => {
                    const result = validateCustomerInfo(email);
                    expect(result.valid).toBe(false);
                    if (email === '' || !email) {
                        expect(result.errors.email).toBe('Email is required');
                    } else {
                        expect(result.errors.email).toBe('Please enter a valid email');
                    }
                });
            });

            it('should accept various valid email formats', () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@domain.co.uk',
                    'test+tag@example.org',
                    'number123@test.io',
                    'a@b.co',
                ];

                validEmails.forEach(email => {
                    const result = validateCustomerInfo(email);
                    expect(result.valid).toBe(true);
                });
            });
        });

        describe('Name Validation', () => {
            it('should not require name for non-cart mode', () => {
                const result = validateCustomerInfo('test@example.com', undefined, 'payment');
                expect(result.valid).toBe(true);
                expect(result.errors.name).toBeUndefined();
            });

            it('should require name for cart mode', () => {
                const result = validateCustomerInfo('test@example.com', undefined, 'cart');
                expect(result.valid).toBe(false);
                expect(result.errors.name).toBe('Name is required for cart checkout');
            });

            it('should accept name when provided for cart mode', () => {
                const result = validateCustomerInfo('test@example.com', 'John Doe', 'cart');
                expect(result.valid).toBe(true);
                expect(result.errors).toEqual({});
            });

            it('should accept empty name for non-cart modes', () => {
                const result = validateCustomerInfo('test@example.com', '', 'payment');
                expect(result.valid).toBe(true);
            });
        });

        describe('Mode Handling', () => {
            it('should handle undefined mode', () => {
                const result = validateCustomerInfo('test@example.com', 'John Doe');
                expect(result.valid).toBe(true);
            });

            it('should handle different mode values', () => {
                const modes = ['payment', 'tip', 'subscription', 'custom'];

                modes.forEach(mode => {
                    const result = validateCustomerInfo('test@example.com', 'John Doe', mode);
                    expect(result.valid).toBe(true);
                });
            });
        });

        describe('Combined Validation', () => {
            it('should return multiple errors when both email and name invalid', () => {
                const result = validateCustomerInfo('invalid-email', undefined, 'cart');
                expect(result.valid).toBe(false);
                expect(result.errors.email).toBe('Please enter a valid email');
                expect(result.errors.name).toBe('Name is required for cart checkout');
            });

            it('should handle edge cases', () => {
                const result = validateCustomerInfo('', '', 'cart');
                expect(result.valid).toBe(false);
                expect(Object.keys(result.errors)).toHaveLength(2);
            });
        });
    });

    describe('validatePaymentMethod', () => {
        describe('Default Allowed Mints', () => {
            it('should allow SOL by default', () => {
                const result = validatePaymentMethod('SOL');
                expect(result.valid).toBe(true);
                expect(result.error).toBeUndefined();
            });

            it('should reject non-SOL methods by default', () => {
                const result = validatePaymentMethod('USDC');
                expect(result.valid).toBe(false);
                expect(result.error).toBe('USDC is not allowed');
            });
        });

        describe('Custom Allowed Mints', () => {
            it('should validate against custom allowed mints', () => {
                const allowedMints = ['SOL', 'USDC', 'USDT'];

                expect(validatePaymentMethod('SOL', allowedMints).valid).toBe(true);
                expect(validatePaymentMethod('USDC', allowedMints).valid).toBe(true);
                expect(validatePaymentMethod('USDT', allowedMints).valid).toBe(true);
                expect(validatePaymentMethod('DAI', allowedMints).valid).toBe(false);
            });

            it('should handle empty allowed mints array', () => {
                const result = validatePaymentMethod('SOL', []);
                expect(result.valid).toBe(false);
                expect(result.error).toBe('SOL is not allowed');
            });

            it('should handle case sensitivity', () => {
                const allowedMints = ['SOL', 'usdc'];

                expect(validatePaymentMethod('SOL', allowedMints).valid).toBe(true);
                expect(validatePaymentMethod('USDC', allowedMints).valid).toBe(false);
                expect(validatePaymentMethod('usdc', allowedMints).valid).toBe(true);
            });
        });

        describe('Edge Cases', () => {
            it('should handle special mint names', () => {
                const allowedMints = ['SOL', 'CUSTOM-TOKEN-123', 'token.with.dots'];

                expect(validatePaymentMethod('CUSTOM-TOKEN-123', allowedMints).valid).toBe(true);
                expect(validatePaymentMethod('token.with.dots', allowedMints).valid).toBe(true);
            });
        });
    });

    describe('calculateTotal', () => {
        const mockProducts = [
            { price: 100, name: 'Product 1' },
            { price: 250, name: 'Product 2' },
            { price: 75, name: 'Product 3' },
        ];

        describe('Cart Mode', () => {
            it('should sum all products in cart mode', () => {
                const total = calculateTotal(mockProducts, 'cart');
                expect(total).toBe(425); // 100 + 250 + 75
            });

            it('should handle empty cart', () => {
                const total = calculateTotal([], 'cart');
                expect(total).toBe(0);
            });

            it('should handle single item cart', () => {
                const total = calculateTotal([{ price: 50 }], 'cart');
                expect(total).toBe(50);
            });

            it('should handle zero-priced items', () => {
                const products = [{ price: 0 }, { price: 100 }, { price: 0 }];
                const total = calculateTotal(products, 'cart');
                expect(total).toBe(100);
            });
        });

        describe('Non-Cart Mode', () => {
            it('should return first product price for single purchase', () => {
                const total = calculateTotal(mockProducts, 'buy-now');
                expect(total).toBe(100); // First product only
            });

            it('should return first product price for tip mode', () => {
                const total = calculateTotal(mockProducts, 'tip');
                expect(total).toBe(100);
            });

            it('should handle single product', () => {
                const total = calculateTotal([{ price: 75 }], 'payment');
                expect(total).toBe(75);
            });

            it('should return 0 for empty products in non-cart mode', () => {
                const total = calculateTotal([], 'payment');
                expect(total).toBe(0);
            });
        });

        describe('Error Handling', () => {
            it('should handle null/undefined products', () => {
                expect(calculateTotal(null as any, 'cart')).toBe(0);
                expect(calculateTotal(undefined as any, 'cart')).toBe(0);
            });

            it('should handle products without price property', () => {
                const products = [{ name: 'Product' }, { price: 100 }];
                const total = calculateTotal(products as any, 'cart');
                expect(total).toBeNaN(); // Products without price cause NaN in sum
            });

            it('should handle negative prices', () => {
                const products = [{ price: -50 }, { price: 100 }];
                const total = calculateTotal(products, 'cart');
                expect(total).toBe(50); // -50 + 100
            });
        });
    });

    describe('createPaymentReference', () => {
        it('should create unique references', () => {
            const ref1 = createPaymentReference();
            const ref2 = createPaymentReference();

            expect(ref1).not.toBe(ref2);
            expect(ref1).toMatch(/^commerce-\d+-[a-z0-9]+$/);
            expect(ref2).toMatch(/^commerce-\d+-[a-z0-9]+$/);
        });

        it('should include timestamp component', () => {
            const beforeTime = Date.now();
            const reference = createPaymentReference();
            const afterTime = Date.now();

            const timestampPart = reference.split('-')[1];
            const timestamp = parseInt(timestampPart);

            expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(timestamp).toBeLessThanOrEqual(afterTime);
        });

        it('should include random component', () => {
            const reference = createPaymentReference();
            const parts = reference.split('-');

            expect(parts).toHaveLength(3);
            expect(parts[0]).toBe('commerce');
            expect(parts[2]).toMatch(/^[a-z0-9]+$/);
            expect(parts[2].length).toBeGreaterThan(0);
        });

        it('should create many unique references', () => {
            const references = Array(100)
                .fill(0)
                .map(() => createPaymentReference());
            const uniqueReferences = new Set(references);

            expect(uniqueReferences.size).toBe(100); // All should be unique
        });
    });

    describe('validateWalletAddress', () => {
        it('should validate correct Solana addresses', () => {
            const validAddresses = [
                '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '11111111111111111111111111111112',
            ];

            validAddresses.forEach(addr => {
                expect(validateWalletAddress(addr)).toBe(true);
            });
        });

        it('should reject invalid addresses', () => {
            const invalidAddresses = [
                'invalid',
                '',
                '123',
                'not-base58-address',
                '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAW0', // Invalid character
            ];

            invalidAddresses.forEach(addr => {
                expect(validateWalletAddress(addr)).toBe(false);
            });
        });

        it('should be consistent with isValidSolanaAddress', () => {
            const testAddresses = [
                '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                'invalid-address',
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '',
            ];

            testAddresses.forEach(addr => {
                expect(validateWalletAddress(addr)).toBe(isValidSolanaAddress(addr));
            });
        });
    });

    describe('createPaymentUrl', () => {
        const validRecipient = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

        describe('Valid URLs', () => {
            it('should create basic payment URL', () => {
                const url = createPaymentUrl(validRecipient, 1.5, 'Test Merchant');

                expect(url).toContain('solana:');
                expect(url).toContain(validRecipient);
                expect(url).toContain('amount=1.5');
                expect(url).toContain('label=Test+Merchant');
                expect(url).toContain('reference=commerce-');
            });

            it('should create tip payment URL', () => {
                const url = createPaymentUrl(validRecipient, 0.1, 'Coffee Shop', 'tip');

                expect(url).toContain('solana:');
                expect(url).toContain('amount=0.1');
                expect(url).toContain('message=Thank+you+for+your+support%21');
            });

            it('should create purchase payment URL', () => {
                const url = createPaymentUrl(validRecipient, 2.5, 'Store Name', 'payment');

                expect(url).toContain('message=Purchase+from+Store+Name');
            });

            it('should include all required parameters', () => {
                const url = createPaymentUrl(validRecipient, 1.0, 'Merchant');

                expect(url).toContain('amount=');
                expect(url).toContain('reference=');
                expect(url).toContain('label=');
                expect(url).toContain('message=');
            });
        });

        describe('Invalid Inputs', () => {
            it('should return empty string for invalid recipient', () => {
                const url = createPaymentUrl('invalid-address', 1.0, 'Merchant');
                expect(url).toBe('');
            });

            it('should return empty string for zero amount', () => {
                const url = createPaymentUrl(validRecipient, 0, 'Merchant');
                expect(url).toBe('');
            });

            it('should return empty string for negative amount', () => {
                const url = createPaymentUrl(validRecipient, -1.0, 'Merchant');
                expect(url).toBe('');
            });

            it('should handle empty merchant name', () => {
                const url = createPaymentUrl(validRecipient, 1.0, '');
                expect(url).toContain('label=');
            });
        });

        describe('URL Format', () => {
            it('should follow Solana Pay spec format', () => {
                const url = createPaymentUrl(validRecipient, 1.0, 'Test');

                expect(url).toMatch(/^solana:[1-9A-HJ-NP-Za-km-z]{32,44}\?/);
                expect(url).toContain('amount=');
                expect(url).toContain('reference=');
            });

            it('should properly encode special characters', () => {
                const url = createPaymentUrl(validRecipient, 1.0, 'Test & Co.', 'payment');

                expect(url).toContain('Test+%26+Co.');
            });

            it('should handle unicode characters in merchant name', () => {
                const url = createPaymentUrl(validRecipient, 1.0, '测试商店', 'payment');

                expect(url).toContain(encodeURIComponent('测试商店'));
            });
        });
    });

    describe('validatePaymentRequest', () => {
        describe('Valid Requests', () => {
            it('should validate complete payment request', () => {
                const request = {
                    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                    amount: 1.5,
                };

                const result = validatePaymentRequest(request);
                expect(result.valid).toBe(true);
                expect(result.errors).toEqual([]);
            });

            it('should validate minimal payment request', () => {
                const request = {
                    recipient: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    amount: 0.001,
                };

                const result = validatePaymentRequest(request);
                expect(result.valid).toBe(true);
            });
        });

        describe('Invalid Recipients', () => {
            it('should reject invalid recipient addresses', () => {
                const invalidRequests = [
                    { recipient: 'invalid', amount: 1 },
                    { recipient: '', amount: 1 },
                    { recipient: 'short', amount: 1 },
                    { recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAW0', amount: 1 }, // Invalid char
                ];

                invalidRequests.forEach(request => {
                    const result = validatePaymentRequest(request);
                    expect(result.valid).toBe(false);
                    expect(result.errors).toContain('Invalid recipient wallet address');
                });
            });

            it('should reject missing recipient', () => {
                const request = { amount: 1 };
                const result = validatePaymentRequest(request);

                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Invalid recipient wallet address');
            });
        });

        describe('Invalid Amounts', () => {
            it('should reject zero amount', () => {
                const request = {
                    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                    amount: 0,
                };

                const result = validatePaymentRequest(request);
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Amount must be greater than 0');
            });

            it('should reject negative amounts', () => {
                const request = {
                    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                    amount: -1,
                };

                const result = validatePaymentRequest(request);
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Amount must be greater than 0');
            });

            it('should reject missing amount', () => {
                const request = {
                    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                };

                const result = validatePaymentRequest(request);
                expect(result.valid).toBe(false);
                expect(result.errors).toContain('Amount must be greater than 0');
            });
        });

        describe('Multiple Errors', () => {
            it('should return all validation errors', () => {
                const request = {
                    recipient: 'invalid',
                    amount: 0,
                };

                const result = validatePaymentRequest(request);
                expect(result.valid).toBe(false);
                expect(result.errors).toHaveLength(2);
                expect(result.errors).toContain('Invalid recipient wallet address');
                expect(result.errors).toContain('Amount must be greater than 0');
            });
        });
    });

    describe('formatSolAmount', () => {
        describe('Basic Formatting', () => {
            it('should format lamports to SOL with default decimals', () => {
                expect(formatSolAmount(1000000000)).toBe('1.000'); // 1 SOL
                expect(formatSolAmount(500000000)).toBe('0.500'); // 0.5 SOL
                expect(formatSolAmount(1500000000)).toBe('1.500'); // 1.5 SOL
            });

            it('should format with custom decimal places', () => {
                expect(formatSolAmount(1000000000, 2)).toBe('1.00');
                expect(formatSolAmount(1000000000, 6)).toBe('1.000000');
                expect(formatSolAmount(1000000000, 0)).toBe('1');
            });

            it('should handle small amounts', () => {
                expect(formatSolAmount(1)).toBe('0.000'); // 1 lamport
                expect(formatSolAmount(1000000)).toBe('0.001'); // 0.001 SOL
                expect(formatSolAmount(10000000)).toBe('0.010'); // 0.01 SOL
            });

            it('should handle large amounts', () => {
                expect(formatSolAmount(1000000000000000)).toBe('1000000.000'); // 1M SOL
            });
        });

        describe('Edge Cases', () => {
            it('should handle zero lamports', () => {
                expect(formatSolAmount(0)).toBe('0.000');
                expect(formatSolAmount(0, 6)).toBe('0.000000');
            });

            it('should handle decimal precision edge cases', () => {
                expect(formatSolAmount(1, 9)).toBe('0.000000001'); // 1 lamport with max precision
                expect(formatSolAmount(999999999, 3)).toBe('1.000'); // Just under 1 SOL
            });
        });
    });

    describe('parseSolAmount', () => {
        describe('Valid Parsing', () => {
            it('should parse SOL amounts to lamports', () => {
                expect(parseSolAmount('1')).toBe(1000000000);
                expect(parseSolAmount('0.5')).toBe(500000000);
                expect(parseSolAmount('1.5')).toBe(1500000000);
                expect(parseSolAmount('0.001')).toBe(1000000);
            });

            it('should handle string formatting variations', () => {
                expect(parseSolAmount('1.0')).toBe(1000000000);
                expect(parseSolAmount('01.5')).toBe(1500000000);
                expect(parseSolAmount('0.500')).toBe(500000000);
            });

            it('should handle very small amounts', () => {
                expect(parseSolAmount('0.000000001')).toBe(1); // 1 lamport
                expect(parseSolAmount('0.000001')).toBe(1000); // 1000 lamports
            });

            it('should handle large amounts', () => {
                expect(parseSolAmount('1000000')).toBe(1000000000000000); // 1M SOL
            });
        });

        describe('Invalid Parsing', () => {
            it('should return 0 for invalid input', () => {
                expect(parseSolAmount('invalid')).toBe(0);
                expect(parseSolAmount('')).toBe(0);
                expect(parseSolAmount('not-a-number')).toBe(0);
            });

            it('should handle edge case strings', () => {
                expect(parseSolAmount('NaN')).toBe(0);
                expect(parseSolAmount('Infinity')).toBe(Infinity);
                expect(parseSolAmount('-Infinity')).toBe(-Infinity);
            });
        });

        describe('Precision Handling', () => {
            it('should round to nearest lamport', () => {
                expect(parseSolAmount('0.0000000015')).toBe(2); // Rounds 1.5 to 2
                expect(parseSolAmount('0.0000000014')).toBe(1); // Rounds 1.4 to 1
            });

            it('should handle maximum precision', () => {
                expect(parseSolAmount('0.999999999')).toBe(999999999);
            });
        });

        describe('Roundtrip Conversion', () => {
            it('should be consistent with formatSolAmount for whole numbers', () => {
                const originalLamports = 1000000000;
                const solAmount = formatSolAmount(originalLamports, 9);
                const backToLamports = parseSolAmount(solAmount);

                expect(backToLamports).toBe(originalLamports);
            });

            it('should handle roundtrip for common amounts', () => {
                const testAmounts = [500000000, 1500000000, 2000000000];

                testAmounts.forEach(lamports => {
                    const sol = formatSolAmount(lamports, 9);
                    const backToLamports = parseSolAmount(sol);
                    expect(backToLamports).toBe(lamports);
                });
            });
        });
    });

    describe('lamportsToDisplay & displayToLamports', () => {
        describe('SOL Conversion', () => {
            it('should convert lamports to SOL display', () => {
                expect(lamportsToDisplay(1000000000)).toBe('1.000000000');
                expect(lamportsToDisplay(500000000)).toBe('0.500000000');
                expect(lamportsToDisplay(1500000000)).toBe('1.500000000');
            });

            it('should convert SOL display to lamports', () => {
                expect(displayToLamports(1)).toBe(1000000000);
                expect(displayToLamports(0.5)).toBe(500000000);
                expect(displayToLamports(1.5)).toBe(1500000000);
            });
        });

        describe('Stablecoin Conversion', () => {
            it('should handle USDC conversion', () => {
                // USDC has 6 decimals
                expect(lamportsToDisplay(1000000, 'USDC')).toBe('1.000000');
                expect(lamportsToDisplay(500000, 'USDC')).toBe('0.500000');

                expect(displayToLamports(1, 'USDC')).toBe(1000000);
                expect(displayToLamports(0.5, 'USDC')).toBe(500000);
            });

            it('should handle USDT conversion', () => {
                // USDT has 6 decimals
                expect(lamportsToDisplay(2000000, 'USDT')).toBe('2.000000');
                expect(displayToLamports(2, 'USDT')).toBe(2000000);
            });

            it('should handle unknown currency as SOL', () => {
                expect(lamportsToDisplay(1000000000, 'UNKNOWN')).toBe('1.000000000');
                expect(displayToLamports(1, 'UNKNOWN')).toBe(1000000000);
            });
        });

        describe('Precision Handling', () => {
            it('should maintain precision for different currencies', () => {
                // SOL (9 decimals)
                expect(lamportsToDisplay(1, 'SOL')).toBe('0.000000001');

                // USDC (6 decimals)
                expect(lamportsToDisplay(1, 'USDC')).toBe('0.000001');
            });

            it('should round to nearest unit in display to lamports conversion', () => {
                expect(displayToLamports(1.5555555, 'USDC')).toBe(1555556); // Rounds 1555555.5
                expect(displayToLamports(0.0000001)).toBe(100); // 0.1 lamports, rounded to 100
            });
        });

        describe('Edge Cases', () => {
            it('should handle zero amounts', () => {
                expect(lamportsToDisplay(0)).toBe('0.000000000');
                expect(lamportsToDisplay(0, 'USDC')).toBe('0.000000');

                expect(displayToLamports(0)).toBe(0);
                expect(displayToLamports(0, 'USDC')).toBe(0);
            });

            it('should handle very large amounts', () => {
                const largeLamports = 1000000000000000; // 1M SOL in lamports
                expect(lamportsToDisplay(largeLamports)).toBe('1000000.000000000');

                const largeSol = 1000000;
                expect(displayToLamports(largeSol)).toBe(1000000000000000);
            });

            it('should handle fractional precision limits', () => {
                // Test maximum precision for different currencies
                expect(displayToLamports(0.000000001)).toBe(1); // 1 lamport
                expect(displayToLamports(0.000001, 'USDC')).toBe(1); // 1 micro-USDC
            });
        });
    });

    describe('Integration Tests', () => {
        describe('Payment Flow Helpers', () => {
            it('should work together for complete payment validation', () => {
                // Valid customer info
                const customerValidation = validateCustomerInfo('test@example.com', 'John Doe', 'cart');
                expect(customerValidation.valid).toBe(true);

                // Valid payment method
                const methodValidation = validatePaymentMethod('SOL', ['SOL', 'USDC']);
                expect(methodValidation.valid).toBe(true);

                // Valid payment URL creation
                const paymentUrl = createPaymentUrl('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 1.5, 'Test Store');
                expect(paymentUrl).toBeTruthy();

                // Valid payment request
                const request = {
                    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                    amount: 1.5,
                };
                const requestValidation = validatePaymentRequest(request);
                expect(requestValidation.valid).toBe(true);
            });

            it('should handle complete invalid payment flow', () => {
                // Invalid customer info
                const customerValidation = validateCustomerInfo('invalid-email', undefined, 'cart');
                expect(customerValidation.valid).toBe(false);

                // Invalid payment method
                const methodValidation = validatePaymentMethod('UNKNOWN', ['SOL']);
                expect(methodValidation.valid).toBe(false);

                // Invalid payment URL
                const paymentUrl = createPaymentUrl('invalid-address', -1, 'Store');
                expect(paymentUrl).toBe('');

                // Invalid payment request
                const request = { recipient: 'invalid', amount: 0 };
                const requestValidation = validatePaymentRequest(request);
                expect(requestValidation.valid).toBe(false);
            });
        });

        describe('Amount Formatting Consistency', () => {
            it('should maintain consistency between formatting functions', () => {
                const testAmounts = [1000000000, 500000000, 1, 999999999];

                testAmounts.forEach(lamports => {
                    const formatted = formatSolAmount(lamports, 9);
                    const parsed = parseSolAmount(formatted);
                    expect(parsed).toBe(lamports);
                });
            });

            it('should work with display conversion functions', () => {
                const testAmounts = [1, 0.5, 1.5, 0.001];

                testAmounts.forEach(sol => {
                    const lamports = displayToLamports(sol);
                    const backToDisplay = lamportsToDisplay(lamports);
                    const backToSol = parseFloat(backToDisplay);
                    expect(Math.abs(backToSol - sol)).toBeLessThan(0.000000001);
                });
            });
        });
    });

    describe('Performance', () => {
        it('should validate customer info quickly', () => {
            const emails = Array(1000).fill('test@example.com');

            const startTime = Date.now();
            emails.forEach(email => validateCustomerInfo(email));
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should create payment references quickly', () => {
            const startTime = Date.now();
            const references = Array(1000)
                .fill(0)
                .map(() => createPaymentReference());
            const endTime = Date.now();

            expect(references).toHaveLength(1000);
            expect(endTime - startTime).toBeLessThan(200);
        });

        it('should format amounts quickly', () => {
            const amounts = Array(1000).fill(1000000000);

            const startTime = Date.now();
            amounts.forEach(amount => formatSolAmount(amount));
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(50);
        });
    });
});
