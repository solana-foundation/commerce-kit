import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBuyNowRequest } from '../actions/buy-now';
import { createCartRequest } from '../actions/cart';
import { createTipRequest } from '../actions/tip';
import { verifyPayment, waitForConfirmation, createCommercePaymentRequest } from '../actions/payment';
import type { CommerceClient } from '../client';

// Mock gill for payment verification
vi.mock('gill', () => ({
    signature: vi.fn(sig => ({ toString: () => sig })),
    address: vi.fn(addr => ({ toString: () => addr })),
}));

vi.mock('gill/programs/token', () => ({
    getAssociatedTokenAccountAddress: vi.fn().mockResolvedValue({ toString: () => 'mock-ata-address' }),
    TOKEN_PROGRAM_ADDRESS: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    TOKEN_2022_PROGRAM_ADDRESS: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
}));

describe('Payment Actions', () => {
    describe('createBuyNowRequest', () => {
        const testProduct = {
            name: 'Test Product',
            price: 1.5,
            currency: 'SOL',
            id: 'prod-123',
        };

        const testRecipient = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

        describe('Basic Request Creation', () => {
            it('should create basic buy now request', () => {
                const request = createBuyNowRequest(testRecipient, testProduct);

                expect(request.recipient).toBe(testRecipient);
                expect(request.amount).toBe(1.5);
                expect(request.currency).toBe('SOL');
                expect(request.products).toEqual([testProduct]);
                expect(request.memo).toBe('Purchase: Test Product');
                expect(request.label).toBe('Test Product');
                expect(request.message).toBe('Thank you for purchasing Test Product!');
            });

            it('should use product properties correctly', () => {
                const expensiveProduct = {
                    name: 'Premium Item',
                    price: 10.0,
                    currency: 'USDC',
                };

                const request = createBuyNowRequest(testRecipient, expensiveProduct);

                expect(request.amount).toBe(10.0);
                expect(request.currency).toBe('USDC');
                expect(request.label).toBe('Premium Item');
                expect(request.memo).toBe('Purchase: Premium Item');
            });
        });

        describe('Custom Options', () => {
            it('should accept custom memo', () => {
                const options = { memo: 'Custom purchase memo' };
                const request = createBuyNowRequest(testRecipient, testProduct, options);

                expect(request.memo).toBe('Custom purchase memo');
            });

            it('should accept custom label', () => {
                const options = { label: 'Custom Label' };
                const request = createBuyNowRequest(testRecipient, testProduct, options);

                expect(request.label).toBe('Custom Label');
            });

            it('should accept custom message', () => {
                const options = { message: 'Custom thank you message' };
                const request = createBuyNowRequest(testRecipient, testProduct, options);

                expect(request.message).toBe('Custom thank you message');
            });

            it('should accept all custom options together', () => {
                const options = {
                    memo: 'Custom memo',
                    label: 'Custom label',
                    message: 'Custom message',
                };

                const request = createBuyNowRequest(testRecipient, testProduct, options);

                expect(request.memo).toBe('Custom memo');
                expect(request.label).toBe('Custom label');
                expect(request.message).toBe('Custom message');
            });

            it('should handle empty options object', () => {
                const request = createBuyNowRequest(testRecipient, testProduct, {});

                expect(request.memo).toBe('Purchase: Test Product');
                expect(request.label).toBe('Test Product');
                expect(request.message).toBe('Thank you for purchasing Test Product!');
            });
        });

        describe('Edge Cases', () => {
            it('should handle products with special characters in name', () => {
                const specialProduct = {
                    name: 'Product & Co. (Premium!) 🎁',
                    price: 5.0,
                    currency: 'SOL',
                };

                const request = createBuyNowRequest(testRecipient, specialProduct);

                expect(request.label).toBe('Product & Co. (Premium!) 🎁');
                expect(request.memo).toBe('Purchase: Product & Co. (Premium!) 🎁');
                expect(request.message).toBe('Thank you for purchasing Product & Co. (Premium!) 🎁!');
            });

            it('should handle zero-priced products', () => {
                const freeProduct = { name: 'Free Sample', price: 0, currency: 'SOL' };
                const request = createBuyNowRequest(testRecipient, freeProduct);

                expect(request.amount).toBe(0);
            });

            it('should handle products without currency', () => {
                const product = { name: 'No Currency', price: 1.0 };
                const request = createBuyNowRequest(testRecipient, product);

                expect(request.currency).toBeUndefined();
            });
        });
    });

    describe('createCartRequest', () => {
        const testProducts = [
            { name: 'Product 1', price: 1.0, currency: 'SOL' },
            { name: 'Product 2', price: 2.5, currency: 'SOL' },
            { name: 'Product 3', price: 0.5, currency: 'SOL' },
        ];

        const testRecipient = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

        describe('Basic Cart Creation', () => {
            it('should create cart request with product total', () => {
                const request = createCartRequest(testRecipient, testProducts);

                expect(request.recipient).toBe(testRecipient);
                expect(request.amount).toBe(4.0); // 1.0 + 2.5 + 0.5
                expect(request.products).toBe(testProducts);
                expect(request.memo).toBe('Cart purchase (3 items)');
                expect(request.label).toBe('Cart Checkout');
                expect(request.message).toBe('Thank you for your purchase!');
            });

            it('should handle single product cart', () => {
                const singleProduct = [{ name: 'Solo Item', price: 2.0 }];
                const request = createCartRequest(testRecipient, singleProduct);

                expect(request.amount).toBe(2.0);
                expect(request.memo).toBe('Cart purchase (1 items)');
            });

            it('should handle empty cart', () => {
                const request = createCartRequest(testRecipient, []);

                expect(request.amount).toBe(0);
                expect(request.memo).toBe('Cart purchase (0 items)');
            });
        });

        describe('Custom Options', () => {
            it('should accept custom memo', () => {
                const options = { memo: 'Bulk order purchase' };
                const request = createCartRequest(testRecipient, testProducts, options);

                expect(request.memo).toBe('Bulk order purchase');
            });

            it('should accept custom label', () => {
                const options = { label: 'Wholesale Order' };
                const request = createCartRequest(testRecipient, testProducts, options);

                expect(request.label).toBe('Wholesale Order');
            });

            it('should accept custom message', () => {
                const options = { message: 'Thanks for the bulk order!' };
                const request = createCartRequest(testRecipient, testProducts, options);

                expect(request.message).toBe('Thanks for the bulk order!');
            });

            it('should accept custom currency', () => {
                const options = { currency: 'USDC' };
                const request = createCartRequest(testRecipient, testProducts, options);

                expect(request.currency).toBe('USDC');
            });

            it('should handle all options together', () => {
                const options = {
                    memo: 'Custom cart memo',
                    label: 'Custom cart label',
                    message: 'Custom cart message',
                    currency: 'USDT',
                };

                const request = createCartRequest(testRecipient, testProducts, options);

                expect(request.memo).toBe('Custom cart memo');
                expect(request.label).toBe('Custom cart label');
                expect(request.message).toBe('Custom cart message');
                expect(request.currency).toBe('USDT');
            });
        });

        describe('Total Calculation', () => {
            it('should sum all product prices', () => {
                const products = [{ price: 1.11 }, { price: 2.22 }, { price: 3.33 }];

                const request = createCartRequest(testRecipient, products);
                expect(request.amount).toBeCloseTo(6.66, 2);
            });

            it('should handle products with missing prices', () => {
                const products = [
                    { price: 1.0 },
                    { name: 'No price' }, // Missing price
                    { price: 2.0 },
                ];

                const request = createCartRequest(testRecipient, products as any);
                // Should handle NaN gracefully
                expect(request.amount).toBeNaN();
            });

            it('should handle negative prices', () => {
                const products = [
                    { price: 10.0 },
                    { price: -2.0 }, // Discount/refund
                    { price: 5.0 },
                ];

                const request = createCartRequest(testRecipient, products);
                expect(request.amount).toBe(13.0);
            });
        });
    });

    describe('createTipRequest', () => {
        const testRecipient = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

        describe('Basic Tip Creation', () => {
            it('should create basic tip request', () => {
                const request = createTipRequest(testRecipient, 0.1);

                expect(request.recipient).toBe(testRecipient);
                expect(request.amount).toBe(0.1);
                expect(request.memo).toBe('Thank you for your support!');
                expect(request.label).toBe('Tip');
                expect(request.message).toBe('Thanks for the tip!');
                expect(request.currency).toBeUndefined();
            });

            it('should handle different tip amounts', () => {
                const amounts = [0.01, 0.1, 1.0, 10.0];

                amounts.forEach(amount => {
                    const request = createTipRequest(testRecipient, amount);
                    expect(request.amount).toBe(amount);
                });
            });
        });

        describe('Custom Options', () => {
            it('should accept custom currency', () => {
                const options = { currency: 'USDC' };
                const request = createTipRequest(testRecipient, 5.0, options);

                expect(request.currency).toBe('USDC');
            });

            it('should accept custom memo', () => {
                const options = { memo: 'Thanks for the great service!' };
                const request = createTipRequest(testRecipient, 1.0, options);

                expect(request.memo).toBe('Thanks for the great service!');
            });

            it('should accept custom label', () => {
                const options = { label: 'Service Tip' };
                const request = createTipRequest(testRecipient, 1.0, options);

                expect(request.label).toBe('Service Tip');
            });

            it('should accept custom message', () => {
                const options = { message: 'You deserve this tip!' };
                const request = createTipRequest(testRecipient, 1.0, options);

                expect(request.message).toBe('You deserve this tip!');
            });

            it('should handle all options together', () => {
                const options = {
                    currency: 'USDT',
                    memo: 'Custom tip memo',
                    label: 'Custom tip label',
                    message: 'Custom tip message',
                };

                const request = createTipRequest(testRecipient, 2.5, options);

                expect(request.currency).toBe('USDT');
                expect(request.memo).toBe('Custom tip memo');
                expect(request.label).toBe('Custom tip label');
                expect(request.message).toBe('Custom tip message');
            });
        });

        describe('Edge Cases', () => {
            it('should handle zero tip amount', () => {
                const request = createTipRequest(testRecipient, 0);
                expect(request.amount).toBe(0);
            });

            it('should handle very small tip amounts', () => {
                const request = createTipRequest(testRecipient, 0.000000001);
                expect(request.amount).toBe(0.000000001);
            });

            it('should handle large tip amounts', () => {
                const request = createTipRequest(testRecipient, 1000.0);
                expect(request.amount).toBe(1000.0);
            });

            it('should handle empty options', () => {
                const request = createTipRequest(testRecipient, 1.0, {});

                expect(request.memo).toBe('Thank you for your support!');
                expect(request.label).toBe('Tip');
                expect(request.message).toBe('Thanks for the tip!');
            });
        });
    });

    describe('verifyPayment', () => {
        let mockClient: CommerceClient;

        beforeEach(() => {
            mockClient = {
                rpc: {
                    getTransaction: vi.fn(),
                    getSignatureStatuses: vi.fn(),
                },
                sendAndConfirmTransaction: vi.fn(),
                network: 'mainnet',
            } as any;
        });

        describe('Basic Verification', () => {
            it('should verify confirmed transaction', async () => {
                const mockTransaction = {
                    blockTime: 1234567890,
                    transaction: {
                        message: {
                            accountKeys: [
                                { pubkey: { toString: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' } },
                            ],
                        },
                    },
                    meta: {
                        preBalances: [0],
                        postBalances: [1000000000], // 1 SOL received
                    },
                };

                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockResolvedValue(mockTransaction),
                });

                const result = await verifyPayment(mockClient, 'test-signature');

                expect(result.verified).toBe(true);
                expect(result.signature).toBe('test-signature');
            });

            it('should handle transaction not found', async () => {
                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockResolvedValue(null),
                });

                const result = await verifyPayment(mockClient, 'non-existent-signature');

                expect(result.verified).toBe(false);
                expect(result.error).toBe('Transaction not found');
            });

            it('should handle unconfirmed transaction', async () => {
                const mockTransaction = {
                    blockTime: null, // Not confirmed
                    transaction: { message: { accountKeys: [] } },
                    meta: {},
                };

                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockResolvedValue(mockTransaction),
                });

                const result = await verifyPayment(mockClient, 'unconfirmed-signature');

                expect(result.verified).toBe(false);
            });
        });

        describe('Amount Verification', () => {
            it('should verify SOL transfer amount', async () => {
                const mockTransaction = {
                    blockTime: 1234567890,
                    transaction: {
                        message: {
                            accountKeys: [
                                { pubkey: { toString: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' } },
                            ],
                        },
                    },
                    meta: {
                        preBalances: [0],
                        postBalances: [1500000000], // 1.5 SOL received
                    },
                };

                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockResolvedValue(mockTransaction),
                });

                const result = await verifyPayment(
                    mockClient,
                    'test-signature',
                    1000000000, // Expected 1 SOL
                    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                );

                expect(result.verified).toBe(true); // 1.5 SOL >= 1 SOL expected
            });

            it('should reject insufficient SOL transfer', async () => {
                const mockTransaction = {
                    blockTime: 1234567890,
                    transaction: {
                        message: {
                            accountKeys: [
                                { pubkey: { toString: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' } },
                            ],
                        },
                    },
                    meta: {
                        preBalances: [0],
                        postBalances: [500000000], // 0.5 SOL received
                    },
                };

                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockResolvedValue(mockTransaction),
                });

                const result = await verifyPayment(
                    mockClient,
                    'test-signature',
                    1000000000, // Expected 1 SOL
                    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                );

                expect(result.verified).toBe(false); // 0.5 SOL < 1 SOL expected
            });
        });

        describe('SPL Token Verification', () => {
            it('should verify SPL token transfer', async () => {
                const mockTransaction = {
                    blockTime: 1234567890,
                    transaction: {
                        message: {
                            accountKeys: [{ pubkey: { toString: () => 'mock-ata-address' } }],
                        },
                    },
                    meta: {
                        postTokenBalances: [
                            {
                                accountIndex: 0,
                                mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                                uiTokenAmount: { amount: '1000000' }, // 1 USDC
                            },
                        ],
                    },
                };

                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockResolvedValue(mockTransaction),
                });

                const result = await verifyPayment(
                    mockClient,
                    'test-signature',
                    1000000, // Expected 1 USDC
                    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                );

                expect(result.verified).toBe(true);
            });

            it('should handle SPL token verification errors', async () => {
                const mockTransaction = {
                    blockTime: 1234567890,
                    transaction: { message: { accountKeys: [] } },
                    meta: { postTokenBalances: [] },
                };

                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockResolvedValue(mockTransaction),
                });

                const result = await verifyPayment(
                    mockClient,
                    'test-signature',
                    1000000,
                    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                );

                expect(result.verified).toBe(true); // Transaction has blockTime, so it's verified as confirmed
            });
        });

        describe('Error Handling', () => {
            it('should handle RPC errors gracefully', async () => {
                mockClient.rpc.getTransaction.mockReturnValue({
                    send: vi.fn().mockRejectedValue(new Error('RPC error')),
                });

                const result = await verifyPayment(mockClient, 'test-signature');

                expect(result.verified).toBe(false);
                expect(result.error).toBe('RPC error');
            });

            it('should handle invalid signature format', async () => {
                const result = await verifyPayment(mockClient, 'invalid-signature');

                expect(result.verified).toBe(false);
                expect(result.signature).toBe('invalid-signature');
            });
        });
    });

    describe('waitForConfirmation', () => {
        let mockClient: CommerceClient;

        beforeEach(() => {
            mockClient = {
                rpc: {
                    getSignatureStatuses: vi.fn(),
                },
                sendAndConfirmTransaction: vi.fn(),
                network: 'mainnet',
            } as any;
        });

        describe('Confirmation Scenarios', () => {
            it('should return true when transaction is confirmed', async () => {
                mockClient.rpc.getSignatureStatuses.mockReturnValue({
                    send: vi.fn().mockResolvedValue({
                        value: [
                            {
                                confirmationStatus: 'confirmed',
                            },
                        ],
                    }),
                });

                const result = await waitForConfirmation(mockClient, 'test-signature', 5000);
                expect(result).toBe(true);
            });

            it('should return true when transaction is finalized', async () => {
                mockClient.rpc.getSignatureStatuses.mockReturnValue({
                    send: vi.fn().mockResolvedValue({
                        value: [
                            {
                                confirmationStatus: 'finalized',
                            },
                        ],
                    }),
                });

                const result = await waitForConfirmation(mockClient, 'test-signature', 5000);
                expect(result).toBe(true);
            });

            it('should timeout when transaction never confirms', async () => {
                mockClient.rpc.getSignatureStatuses.mockReturnValue({
                    send: vi.fn().mockResolvedValue({
                        value: [
                            {
                                confirmationStatus: 'processed', // Not confirmed
                            },
                        ],
                    }),
                });

                const result = await waitForConfirmation(mockClient, 'test-signature', 100); // Short timeout
                expect(result).toBe(false);
            }, 15000);

            it('should handle custom timeout', async () => {
                mockClient.rpc.getSignatureStatuses.mockReturnValue({
                    send: vi.fn().mockResolvedValue({
                        value: [null], // No status
                    }),
                });

                const result = await waitForConfirmation(mockClient, 'test-signature', 50); // Very short timeout
                expect(result).toBe(false);
            }, 15000);
        });

        describe('Error Handling', () => {
            it('should continue on RPC errors', async () => {
                let callCount = 0;
                mockClient.rpc.getSignatureStatuses.mockReturnValue({
                    send: vi.fn().mockImplementation(() => {
                        callCount++;
                        if (callCount === 1) {
                            throw new Error('RPC error');
                        }
                        return Promise.resolve({
                            value: [
                                {
                                    confirmationStatus: 'confirmed',
                                },
                            ],
                        });
                    }),
                });

                const result = await waitForConfirmation(mockClient, 'test-signature', 5000);
                expect(result).toBe(true);
            });

            it('should handle invalid signature gracefully', async () => {
                // Will fail in signature parsing, but should continue
                const result = await waitForConfirmation(mockClient, 'invalid-sig', 100);
                expect(result).toBe(false);
            });
        });
    });

    describe('createCommercePaymentRequest', () => {
        const testRecipient = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

        describe('Basic Request Creation', () => {
            it('should create payment request with amount', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.5,
                    currency: 'SOL',
                    label: 'Test Payment',
                };

                const result = createCommercePaymentRequest(request);

                expect(result.url).toContain('solana:');
                expect(result.url).toContain(testRecipient);
                expect(result.amount).toBe(1.5);
                expect(result.currency).toBe('SOL');
                expect(result.recipient).toBe(testRecipient);
            });

            it('should calculate total from items when provided', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0, // Should be ignored when items provided
                    items: [
                        { price: 2.0, name: 'Item 1' },
                        { price: 1.5, name: 'Item 2' },
                    ],
                };

                const result = createCommercePaymentRequest(request);

                expect(result.amount).toBe(3.5); // Sum of items, not original amount
                expect(result.items).toEqual(request.items);
            });

            it('should include all URL parameters', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 2.0,
                    currency: 'USDC',
                    memo: 'Test memo',
                    label: 'Test Label',
                    message: 'Test message',
                };

                const result = createCommercePaymentRequest(request);

                expect(result.url).toContain('amount=2');
                expect(result.url).toContain('spl-token=USDC');
                expect(result.url).toContain('memo=Test+memo');
                expect(result.url).toContain('label=Test+Label');
                expect(result.url).toContain('message=Test+message');
                expect(result.url).toContain('reference=commerce-');
            });
        });

        describe('Currency Handling', () => {
            it('should handle SOL currency', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                    currency: 'SOL',
                };

                const result = createCommercePaymentRequest(request);

                expect(result.currency).toBe('SOL');
                expect(result.url).not.toContain('spl-token='); // SOL doesn't need spl-token param
            });

            it('should handle stablecoin currencies', () => {
                const currencies = ['USDC', 'USDT'];

                currencies.forEach(currency => {
                    const request = {
                        recipient: testRecipient,
                        amount: 1.0,
                        currency,
                    };

                    const result = createCommercePaymentRequest(request);

                    expect(result.currency).toBe(currency);
                    expect(result.url).toContain(`spl-token=${currency}`);
                });
            });

            it('should default to SOL when no currency specified', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                };

                const result = createCommercePaymentRequest(request);

                expect(result.currency).toBe('SOL');
            });
        });

        describe('Reference Generation', () => {
            it('should use provided reference', () => {
                const customRef = 'custom-ref-123';
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                    reference: customRef,
                };

                const result = createCommercePaymentRequest(request);

                expect(result.reference).toBe(customRef);
                expect(result.url).toContain(`reference=${customRef}`);
            });

            it('should generate reference when not provided', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                };

                const result = createCommercePaymentRequest(request);

                expect(result.reference).toMatch(/^commerce-\d+$/);
                expect(result.url).toContain('reference=commerce-');
            });

            it('should generate different references for multiple requests', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                };

                const result1 = createCommercePaymentRequest(request);
                const result2 = createCommercePaymentRequest(request);

                expect(result1.reference).not.toBe(result2.reference);
            });
        });

        describe('Helper Methods', () => {
            it('should provide amount display for SOL', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1500000000, // 1.5 SOL in lamports
                };

                const result = createCommercePaymentRequest(request);
                const display = result.getAmountDisplay();

                expect(display).toBe('1.5 SOL');
            });

            it('should provide amount display for USDC', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1500000, // 1.5 USDC in micro-units
                    currency: 'USDC',
                };

                const result = createCommercePaymentRequest(request);
                const display = result.getAmountDisplay();

                expect(display).toBe('1.500000 USDC');
            });

            it('should provide stablecoin config', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                    currency: 'USDC',
                };

                const result = createCommercePaymentRequest(request);
                const config = result.getStablecoinConfig();

                expect(config).toBeDefined();
                expect(config?.symbol).toBe('USDC');
                expect(config?.decimals).toBe(6);
            });

            it('should return null stablecoin config for SOL', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                    currency: 'SOL',
                };

                const result = createCommercePaymentRequest(request);
                const config = result.getStablecoinConfig();

                expect(config).toBeUndefined();
            });

            it('should generate fresh reference with timestamp', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                };

                const result = createCommercePaymentRequest(request);
                const freshRef = result.generateFreshReference();

                expect(freshRef).toMatch(/^commerce-\d+-[a-z0-9]+$/);
                expect(freshRef).not.toBe(result.reference);
            });
        });

        describe('QR Code Integration', () => {
            it('should provide QR code data', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                    label: 'QR Test',
                };

                const result = createCommercePaymentRequest(request);

                expect(result.qrCode).toBe(result.url);
                expect(result.qrCode).toContain('solana:');
            });
        });

        describe('Edge Cases', () => {
            it('should handle empty items array', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                    items: [],
                };

                const result = createCommercePaymentRequest(request);

                expect(result.amount).toBe(0); // Sum of empty array
                expect(result.items).toEqual([]);
            });

            it('should handle missing optional fields', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                };

                const result = createCommercePaymentRequest(request);

                expect(result.label).toBeUndefined();
                expect(result.message).toBeUndefined();
                expect(result.items).toBeUndefined();
            });

            it('should handle special characters in metadata', () => {
                const request = {
                    recipient: testRecipient,
                    amount: 1.0,
                    label: 'Test & Payment!',
                    message: 'Hello 🌍',
                    memo: 'Special chars: @#$%',
                };

                const result = createCommercePaymentRequest(request);

                expect(result.url).toContain('Test+%26+Payment%21');
                expect(result.url).toContain('Hello+%F0%9F%8C%8D');
                expect(result.url).toContain('Special+chars%3A+%40%23%24%25');
            });
        });
    });

    describe('Performance Tests', () => {
        it('should handle multiple payment request creations efficiently', () => {
            const requests = Array(100).fill({
                recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                amount: 1.0,
            });

            const startTime = Date.now();
            const results = requests.map(req => createCommercePaymentRequest(req));
            const endTime = Date.now();

            expect(results).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should validate many customer info records quickly', async () => {
            const customers = Array(1000).fill(['test@example.com', 'John Doe', 'cart']);

            const { validateCustomerInfo } = await import('../utils');
            const startTime = Date.now();
            customers.forEach(([email, name, mode]) => validateCustomerInfo(email, name, mode));
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100);
        });
    });
});
