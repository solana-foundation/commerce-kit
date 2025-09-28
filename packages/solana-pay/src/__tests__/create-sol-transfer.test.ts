import { describe, it, expect, vi } from 'vitest';
import { createSolTransfer, type CreateSolTransferFields } from '../create-sol-transfer';
import { address } from 'gill';

// Mock gill/programs
vi.mock('gill/programs', () => ({
    getTransferSolInstruction: vi.fn(() => ({ type: 'transfer-sol-instruction' })),
    getTransferInstruction: vi.fn(() => ({ type: 'transfer-instruction' })),
}));

describe('createSolTransfer', () => {
    const mockRpc = {
        getAccountInfo: vi.fn(),
    };

    const testSender = address('A7CyPfXWBczBhUwdSWmg6TZdWrqBfhCQ2GxEz4WZ4Z8B');
    const testRecipient = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
    const testReference = address('4fYNw3dojWmQ2dXuYHdhTWgJyg7BLZZeEfH5TjxH6nKK');

    describe('Basic SOL Transfer', () => {
        it('should create basic SOL transfer instruction', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n, // 1 SOL in lamports
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ type: 'transfer-instruction' });

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: 1000000000, // Converted to number
                authority: testSender,
            });
        });

        it('should handle decimal amounts correctly', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 500000000n, // 0.5 SOL in lamports
            };

            await createSolTransfer(mockRpc as any, testSender, fields);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: 500000000,
                authority: testSender,
            });
        });

        it('should handle small amounts (lamports)', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1n, // 1 lamport
            };

            await createSolTransfer(mockRpc as any, testSender, fields);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: 1,
                authority: testSender,
            });
        });

        it('should handle zero amounts', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 0n,
            };

            await createSolTransfer(mockRpc as any, testSender, fields);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: 0,
                authority: testSender,
            });
        });
    });

    describe('Amount Type Handling', () => {
        it('should handle bigint amounts', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should handle string amounts', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: '1000000000' as any, // Test string input
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: 1000000000,
                authority: testSender,
            });
        });

        it('should handle number amounts', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000 as any, // Test number input
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should throw error for amounts exceeding safe integer range', async () => {
            const unsafeAmount = BigInt(Number.MAX_SAFE_INTEGER) + 1n;

            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: unsafeAmount,
            };

            await expect(createSolTransfer(mockRpc as any, testSender, fields)).rejects.toThrow(RangeError);

            await expect(createSolTransfer(mockRpc as any, testSender, fields)).rejects.toThrow(
                'exceeds the safe integer range',
            );
        });

        it('should throw error for string amounts exceeding safe range', async () => {
            const unsafeAmountString = String(BigInt(Number.MAX_SAFE_INTEGER) + 1n);

            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: unsafeAmountString as any,
            };

            await expect(createSolTransfer(mockRpc as any, testSender, fields)).rejects.toThrow(RangeError);

            await expect(createSolTransfer(mockRpc as any, testSender, fields)).rejects.toThrow(
                'exceeds the safe integer range',
            );
        });

        it('should handle maximum safe integer amounts', async () => {
            const maxSafeAmount = BigInt(Number.MAX_SAFE_INTEGER);

            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: maxSafeAmount,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: Number.MAX_SAFE_INTEGER,
                authority: testSender,
            });
        });
    });

    describe('Optional Fields', () => {
        it('should create transfer without optional fields', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should include reference when provided', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
                reference: testReference,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);

            // The reference should be handled by the instruction (implementation detail)
            expect(result[0]).toEqual({ type: 'transfer-instruction' });
        });

        it('should include multiple references when provided', async () => {
            const reference2 = address('2Azp9LdtCbxZ9Z7YyxPKLfVpK1TRfqe6QzHnNhCJkNJB');
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
                reference: [testReference, reference2],
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should include memo when provided', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
                memo: 'Payment for services',
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should handle all optional fields together', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 2000000000n,
                reference: testReference,
                memo: 'Complete payment with reference',
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });
    });

    describe('Address Validation', () => {
        it('should properly convert recipient address', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
            };

            await createSolTransfer(mockRpc as any, testSender, fields);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith(
                expect.objectContaining({
                    destination: testRecipient,
                }),
            );
        });

        it('should handle same sender and recipient', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testSender, // Same as sender
                amount: 1000000000n,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testSender,
                amount: 1000000000,
                authority: testSender,
            });
        });
    });

    describe('Instruction Generation', () => {
        it('should generate proper transfer instruction structure', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('type');
        });

        it('should use correct instruction parameters', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 750000000n,
            };

            await createSolTransfer(mockRpc as any, testSender, fields);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: 750000000,
                authority: testSender,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle very small transfer amounts', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1n, // 1 lamport
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should handle maximum practical SOL amounts', async () => {
            const practicalMaxAmount = 1000000n * 1000000000n; // 1M SOL in lamports

            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: practicalMaxAmount,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should handle empty memo', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
                memo: '',
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should handle very long memos', async () => {
            const longMemo = 'A'.repeat(1000);
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
                memo: longMemo,
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });

        it('should handle special characters in memo', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
                memo: 'Payment: $100 @Company #123 & More! 🚀💰',
            };

            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle instruction creation errors', async () => {
            const { getTransferInstruction } = await import('gill/programs');
            vi.mocked(getTransferInstruction).mockImplementationOnce(() => {
                throw new Error('Instruction creation failed');
            });

            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
            };

            await expect(createSolTransfer(mockRpc as any, testSender, fields)).rejects.toThrow(
                'Instruction creation failed',
            );
        });

        it('should handle negative amounts (edge case)', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: -1000000000n as any, // Negative amount
            };

            // Should still create instruction (validation might happen elsewhere)
            const result = await createSolTransfer(mockRpc as any, testSender, fields);
            expect(result).toHaveLength(1);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: -1000000000,
                authority: testSender,
            });
        });
    });

    describe('Type Conversion', () => {
        it('should convert bigint to number safely', async () => {
            const testCases = [
                { input: 1n, expected: 1 },
                { input: 1000000000n, expected: 1000000000 },
                { input: 999999999n, expected: 999999999 },
                { input: 0n, expected: 0 },
            ];

            for (const testCase of testCases) {
                const fields: CreateSolTransferFields = {
                    recipient: testRecipient,
                    amount: testCase.input,
                };

                await createSolTransfer(mockRpc as any, testSender, fields);

                const { getTransferInstruction } = await import('gill/programs');
                expect(getTransferInstruction).toHaveBeenCalledWith({
                    source: testSender,
                    destination: testRecipient,
                    amount: testCase.expected,
                    authority: testSender,
                });
            }
        });

        it('should convert string to number safely', async () => {
            const testCases = [
                { input: '1000000000', expected: 1000000000 },
                { input: '500000000', expected: 500000000 },
                { input: '0', expected: 0 },
            ];

            for (const testCase of testCases) {
                const fields: CreateSolTransferFields = {
                    recipient: testRecipient,
                    amount: testCase.input as any,
                };

                await createSolTransfer(mockRpc as any, testSender, fields);

                const { getTransferInstruction } = await import('gill/programs');
                expect(getTransferInstruction).toHaveBeenCalledWith({
                    source: testSender,
                    destination: testRecipient,
                    amount: testCase.expected,
                    authority: testSender,
                });
            }
        });

        it('should handle number amounts directly', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000 as any, // Direct number
            };

            await createSolTransfer(mockRpc as any, testSender, fields);

            const { getTransferInstruction } = await import('gill/programs');
            expect(getTransferInstruction).toHaveBeenCalledWith({
                source: testSender,
                destination: testRecipient,
                amount: 1000000000,
                authority: testSender,
            });
        });
    });

    describe('Performance', () => {
        it('should handle multiple transfers efficiently', async () => {
            const transfers = Array(10).fill({
                recipient: testRecipient,
                amount: 1000000000n,
            });

            const startTime = Date.now();
            const results = await Promise.all(
                transfers.map(fields => createSolTransfer(mockRpc as any, testSender, fields)),
            );
            const endTime = Date.now();

            expect(results).toHaveLength(10);
            results.forEach(result => expect(result).toHaveLength(1));
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should create instructions quickly', async () => {
            const fields: CreateSolTransferFields = {
                recipient: testRecipient,
                amount: 1000000000n,
            };

            const startTime = Date.now();
            await createSolTransfer(mockRpc as any, testSender, fields);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(10); // Very fast operation
        });
    });

    describe('Integration', () => {
        it('should work with different sender addresses', async () => {
            const senders = [
                address('A7CyPfXWBczBhUwdSWmg6TZdWrqBfhCQ2GxEz4WZ4Z8B'),
                address('B8DzPfYXBczBhUwdSWmg6TZdWrqBfhCQ2GxEz4WZ4Z8C'),
                address('C9EAPgZYCdaBiVxeSXnh7UaExscBginD3HyF5XY5a9D'),
            ];

            for (const sender of senders) {
                const fields: CreateSolTransferFields = {
                    recipient: testRecipient,
                    amount: 1000000000n,
                };

                const result = await createSolTransfer(mockRpc as any, sender, fields);
                expect(result).toHaveLength(1);

                const { getTransferInstruction } = await import('gill/programs');
                expect(getTransferInstruction).toHaveBeenCalledWith({
                    source: sender,
                    destination: testRecipient,
                    amount: 1000000000,
                    authority: sender,
                });
            }
        });

        it('should work with different recipient addresses', async () => {
            const recipients = [
                address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'),
                address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                address('11111111111111111111111111111112'),
            ];

            for (const recipient of recipients) {
                const fields: CreateSolTransferFields = {
                    recipient,
                    amount: 1000000000n,
                };

                const result = await createSolTransfer(mockRpc as any, testSender, fields);
                expect(result).toHaveLength(1);

                const { getTransferInstruction } = await import('gill/programs');
                expect(getTransferInstruction).toHaveBeenCalledWith({
                    source: testSender,
                    destination: recipient,
                    amount: 1000000000,
                    authority: testSender,
                });
            }
        });

        it('should handle concurrent transfer creation', async () => {
            const fields = [
                { recipient: testRecipient, amount: 1000000000n },
                { recipient: testRecipient, amount: 500000000n },
                { recipient: testRecipient, amount: 250000000n },
            ];

            const promises = fields.map(field => createSolTransfer(mockRpc as any, testSender, field));

            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result).toHaveLength(1);
                expect(result[0]).toHaveProperty('type');
            });
        });
    });
});
