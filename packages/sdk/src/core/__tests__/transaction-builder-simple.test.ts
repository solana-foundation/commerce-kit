import { describe, it, expect, vi } from 'vitest';
import { createTransactionBuilder, createTransactionContext } from '../transaction-builder';

describe('Transaction Builder - Core Functionality', () => {
    describe('Factory Functions', () => {
        it('should create transaction context with correct parameters', () => {
            const context = createTransactionContext('https://api.devnet.solana.com', 'confirmed', true);

            expect(context).toBeDefined();
            expect(context.rpcUrl).toBe('https://api.devnet.solana.com');
            expect(context.commitment).toBe('confirmed');
            expect(context.debug).toBe(true);
        });

        it('should handle optional parameters with defaults', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');

            expect(context.rpcUrl).toBe('https://api.devnet.solana.com');
            expect(context.commitment).toBe('confirmed');
            expect(context.debug).toBe(false);
        });

        it('should create transaction builder instance', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            expect(builder).toBeDefined();
            expect(builder.transferSOL).toBeDefined();
            expect(builder.transferToken).toBeDefined();
            expect(builder.confirmTransaction).toBeDefined();
            expect(builder.calculateFees).toBeDefined();
        });
    });

    describe('Method Availability', () => {
        it('should expose all core transaction methods', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            // Verify all essential methods are available and callable
            expect(typeof builder.transferSOL).toBe('function');
            expect(typeof builder.transferToken).toBe('function');
            expect(typeof builder.confirmTransaction).toBe('function');
            expect(typeof builder.calculateFees).toBe('function');

            // Verify method names for better debugging
            expect(builder.transferSOL.name).toBe('transferSOL');
            expect(builder.transferToken.name).toBe('transferToken');
            expect(builder.confirmTransaction.name).toBe('confirmTransaction');
            expect(builder.calculateFees.name).toBe('calculateFees');
        });

        it('should have async transaction methods', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            // These methods should return promises (be async)
            expect(builder.transferSOL.constructor.name).toBe('AsyncFunction');
            expect(builder.transferToken.constructor.name).toBe('AsyncFunction');
            expect(builder.confirmTransaction.constructor.name).toBe('AsyncFunction');
            expect(builder.calculateFees.constructor.name).toBe('AsyncFunction');
        });
    });

    describe('Fee Calculation', () => {
        it('should calculate single signature fees correctly', async () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            const fees = await builder.calculateFees(1);
            expect(fees).toBe(5000n); // 5000 lamports per signature
        });

        it('should calculate multiple signature fees correctly', async () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            const fees = await builder.calculateFees(3);
            expect(fees).toBe(15000n); // 3 * 5000 lamports
        });

        it('should calculate fees for two-signature transactions', async () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            // Common case: transaction requiring both fee payer and authority signatures
            const fees = await builder.calculateFees(2);
            expect(fees).toBe(10000n); // 2 * 5000 lamports
        });
    });

    describe('Configuration Support', () => {
        it('should work with different commitment levels', () => {
            const processedContext = createTransactionContext('https://api.devnet.solana.com', 'processed');
            const confirmedContext = createTransactionContext('https://api.devnet.solana.com', 'confirmed');
            const finalizedContext = createTransactionContext('https://api.devnet.solana.com', 'finalized');

            const processedBuilder = createTransactionBuilder(processedContext);
            const confirmedBuilder = createTransactionBuilder(confirmedContext);
            const finalizedBuilder = createTransactionBuilder(finalizedContext);

            expect(processedBuilder).toBeDefined();
            expect(confirmedBuilder).toBeDefined();
            expect(finalizedBuilder).toBeDefined();
        });

        it('should work with different RPC URLs', () => {
            const devnetContext = createTransactionContext('https://api.devnet.solana.com');
            const mainnetContext = createTransactionContext('https://api.mainnet-beta.solana.com');
            const customContext = createTransactionContext('https://custom-rpc.example.com');

            const devnetBuilder = createTransactionBuilder(devnetContext);
            const mainnetBuilder = createTransactionBuilder(mainnetContext);
            const customBuilder = createTransactionBuilder(customContext);

            expect(devnetBuilder).toBeDefined();
            expect(mainnetBuilder).toBeDefined();
            expect(customBuilder).toBeDefined();
        });

        it('should handle logging configuration', () => {
            const loggingContext = createTransactionContext('https://api.devnet.solana.com', 'confirmed', true);
            const noLoggingContext = createTransactionContext('https://api.devnet.solana.com', 'confirmed', false);

            const loggingBuilder = createTransactionBuilder(loggingContext);
            const noLoggingBuilder = createTransactionBuilder(noLoggingContext);

            expect(loggingBuilder).toBeDefined();
            expect(noLoggingBuilder).toBeDefined();
        });
    });
});
