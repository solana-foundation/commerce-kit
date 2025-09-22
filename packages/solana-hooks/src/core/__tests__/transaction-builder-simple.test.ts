import { describe, it, expect, vi } from 'vitest';
import { createTransactionBuilder, createTransactionContext } from '../transaction-builder';

describe('Transaction Builder - Core Functionality', () => {
    describe('Factory Functions', () => {
        it('should create transaction context with correct parameters', () => {
            const context = createTransactionContext('https://api.devnet.solana.com', 'confirmed', true);

            expect(context).toBeDefined();
            expect(context.rpcUrl).toBe('https://api.devnet.solana.com');
            expect(context.commitment).toBe('confirmed');
            expect(context.enableLogging).toBe(true);
        });

        it('should handle optional parameters', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');

            expect(context.rpcUrl).toBe('https://api.devnet.solana.com');
            expect(context.commitment).toBeUndefined();
            expect(context.enableLogging).toBeUndefined();
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

    describe('Method Signatures', () => {
        it('should have correct transferSOL method signature', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            expect(typeof builder.transferSOL).toBe('function');
            expect(builder.transferSOL.length).toBe(3); // to, amount, from parameters
        });

        it('should have correct transferToken method signature', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            expect(typeof builder.transferToken).toBe('function');
            expect(builder.transferToken.length).toBeGreaterThan(2); // mint, to, amount, from, createAccount parameters
        });

        it('should have correct confirmTransaction method signature', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            expect(typeof builder.confirmTransaction).toBe('function');
            expect(builder.confirmTransaction.length).toBe(1); // signature parameter
        });

        it('should have correct calculateFees method signature', () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            expect(typeof builder.calculateFees).toBe('function');
            expect(builder.calculateFees.length).toBe(1); // signatureCount parameter
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

        it('should handle zero signatures', async () => {
            const context = createTransactionContext('https://api.devnet.solana.com');
            const builder = createTransactionBuilder(context);

            const fees = await builder.calculateFees(0);
            expect(fees).toBe(0n);
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
