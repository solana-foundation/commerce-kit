import { describe, it, expect } from 'vitest';
import { parseURL, ParseURLError } from '../parse-url';

describe('parseURL', () => {
    describe('Basic URL Parsing', () => {
        it('should parse a valid SOL transfer URL', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=0.01';
            const result = parseURL(url);

            expect(result.recipient).toBeDefined();
            expect(result.amount).toBe(10000000n); // 0.01 SOL in lamports
            expect(result.splToken).toBeUndefined();
            expect(result.reference).toBeUndefined();
            expect(result.label).toBeUndefined();
            expect(result.message).toBeUndefined();
            expect(result.memo).toBeUndefined();
        });

        it('should parse a valid SPL token transfer URL', () => {
            const url =
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1.5&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
            const result = parseURL(url);

            expect(result.recipient).toBeDefined();
            expect(result.amount).toBe(1500000000n); // 1.5 in lamports
            expect(result.splToken).toBeDefined();
        });

        it('should parse URL with minimal recipient only', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
            const result = parseURL(url);

            expect(result.recipient).toBeDefined();
            expect(result.amount).toBeUndefined();
            expect(result.splToken).toBeUndefined();
        });
    });

    describe('Amount Parsing', () => {
        it('should parse whole SOL amounts', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1';
            const result = parseURL(url);
            expect(result.amount).toBe(1000000000n); // 1 SOL in lamports
        });

        it('should parse decimal SOL amounts', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=0.5';
            const result = parseURL(url);
            expect(result.amount).toBe(500000000n); // 0.5 SOL in lamports
        });

        it('should throw error for zero amount (invalid)', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=0';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should handle very small amounts', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=0.000000001';
            const result = parseURL(url);
            expect(result.amount).toBe(1n); // 1 lamport
        });

        it('should handle large amounts', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1000000';
            const result = parseURL(url);
            expect(result.amount).toBe(1000000000000000n); // 1M SOL in lamports
        });
    });

    describe('Reference Parsing', () => {
        it('should parse single reference', () => {
            const url =
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?reference=4fYNw3dojWmQ2dXuYHdhTWgJyg7BLZZeEfH5TjxH6nKK';
            const result = parseURL(url);
            expect(result.reference).toHaveLength(1);
        });

        it('should parse multiple references', () => {
            const url =
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?reference=4fYNw3dojWmQ2dXuYHdhTWgJyg7BLZZeEfH5TjxH6nKK&reference=2Azp9LdtCbxZ9Z7YyxPKLfVpK1TRfqe6QzHnNhCJkNJB';
            const result = parseURL(url);
            expect(result.reference).toHaveLength(2);
        });
    });

    describe('Complete URL Parsing', () => {
        it('should parse URL with all optional parameters', () => {
            const url =
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' +
                '?amount=1.5' +
                '&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' +
                '&reference=4fYNw3dojWmQ2dXuYHdhTWgJyg7BLZZeEfH5TjxH6nKK' +
                '&label=Test%20Payment' +
                '&message=Payment%20for%20services' +
                '&memo=Test%20memo';

            const result = parseURL(url);

            expect(result.recipient).toBeDefined();
            expect(result.amount).toBe(1500000000n);
            expect(result.splToken).toBeDefined();
            expect(result.reference).toHaveLength(1);
            expect(result.label).toBe('Test Payment');
            expect(result.message).toBe('Payment for services');
            expect(result.memo).toBe('Test memo');
        });
    });

    describe('Error Cases', () => {
        it('should throw error for invalid protocol', () => {
            const url = 'http://example.com';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should throw error for missing protocol', () => {
            const url = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1';
            expect(() => parseURL(url)).toThrow(); // Will throw TypeError: Invalid URL
        });

        it('should throw error for invalid recipient address', () => {
            const url = 'solana:invalid-address?amount=1';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should throw error for invalid amount format', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=invalid';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should throw error for negative amount', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=-1';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should throw error for too many decimal places', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1.0123456789123';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should throw error for invalid SPL token address', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?spl-token=invalid-token';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should throw error for invalid reference address', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?reference=invalid-reference';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });
    });

    describe('URL Variations', () => {
        it('should handle URL object input', () => {
            const url = new URL('solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=0.01');
            const result = parseURL(url);
            expect(result.amount).toBe(10000000n);
        });

        it('should handle encoded special characters', () => {
            const url =
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?label=Test%20%26%20Payment&message=Hello%20World%21';
            const result = parseURL(url);
            expect(result.label).toBe('Test & Payment');
            expect(result.message).toBe('Hello World!');
        });

        it('should preserve whitespace in labels and messages', () => {
            const url =
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?label=Multi%20word%20label&message=Multi%20word%20message';
            const result = parseURL(url);
            expect(result.label).toBe('Multi word label');
            expect(result.message).toBe('Multi word message');
        });
    });

    describe('Edge Cases', () => {
        it('should throw error for empty amount parameter', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=';
            expect(() => parseURL(url)).toThrow(ParseURLError);
        });

        it('should handle duplicate parameters (first one wins)', () => {
            const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1&amount=2';
            const result = parseURL(url);
            expect(result.amount).toBe(1000000000n); // Uses the first amount value
        });

        it('should handle very long URLs', () => {
            const longMessage = 'A'.repeat(1000);
            const url = `solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?message=${encodeURIComponent(longMessage)}`;
            const result = parseURL(url);
            expect(result.message).toBe(longMessage);
        });
    });
});
