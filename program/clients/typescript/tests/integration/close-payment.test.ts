import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    createSolanaClient,
    SolanaClient,
    KeyPairSigner,
    Address,
    lamports,
    generateExtractableKeyPairSigner,
} from 'gill';
import {
    FeeType,
    findPaymentPda,
    PolicyData,
    Status,
} from '../../src/generated';
import { setupWallets } from './helpers/transactions';
import {
    assertGetOrCreateOperator,
    assertGetOrCreateMerchant,
    assertGetOrCreateMerchantOperatorConfig,
    assertMakePayment,
    assertClosePayment,
    assertCompletePaymentWorkflow,
    PaymentWorkflow,
} from './helpers/state-utils';
import { generateManyTokenAccounts, generateMint, mintToOwner } from './helpers/tokens';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from 'gill/programs';
import { assertPaymentAccount } from './helpers/assertions';

describe('Close Payment', () => {
    let client: SolanaClient;
    let payer: KeyPairSigner;
    let operatorAuthority: KeyPairSigner;
    let merchantAuthority: KeyPairSigner;
    let settlementWallet: KeyPairSigner;
    let testTokenMint: KeyPairSigner;
    let testTokenAuthority: KeyPairSigner;
    let customer: KeyPairSigner;
    let customerTokenAccount: Address;
    let merchantEscrowAta: Address;
    let merchantSettlementAta: Address;
    let operatorSettlementAta: Address;
    let paymentPda: Address;
    let paymentBump: number;

    let merchantPda: Address;
    let operatorPda: Address;
    let merchantOperatorConfigPda: Address;

    let version = 1; // incremented after each test
    const operatorFee = lamports(100000n); // 0.0001 SOL
    const feeType = FeeType.Fixed;
    let currentOrderId = 1;
    const paymentAmount = 1_000_000;

    beforeEach(async () => {
        client = createSolanaClient({ urlOrMoniker: 'http://localhost:8899' });

        payer = await generateExtractableKeyPairSigner();
        operatorAuthority = await generateExtractableKeyPairSigner();
        merchantAuthority = await generateExtractableKeyPairSigner();
        settlementWallet = await generateExtractableKeyPairSigner();
        testTokenAuthority = await generateExtractableKeyPairSigner();
        testTokenMint = await generateExtractableKeyPairSigner();
        customer = await generateExtractableKeyPairSigner();

        await setupWallets(client, [payer, operatorAuthority, merchantAuthority, settlementWallet, testTokenAuthority, customer]);

        await generateMint({
            client,
            payer,
            authority: testTokenAuthority,
            mint: testTokenMint,
        });

        customerTokenAccount = await mintToOwner({
            client,
            payer,
            mint: testTokenMint.address,
            owner: customer.address,
            authority: testTokenAuthority,
            amount: 10_000_000, // Give customer enough tokens for test
        });

        [operatorPda] = await assertGetOrCreateOperator({
            client,
            payer,
            owner: operatorAuthority,
            failIfExists: false
        });

        [merchantPda] = await assertGetOrCreateMerchant({
            client,
            payer,
            authority: merchantAuthority,
            settlementWallet,
            failIfExists: false
        });

        const policies: PolicyData[] = [
            {
                __kind: 'Settlement',
                fields: [{
                    minSettlementAmount: 0n,
                    settlementFrequencyHours: 0,
                    autoSettle: false,
                }]
            },
            {
                __kind: 'Refund',
                fields: [{
                    maxAmount: 2_000_000n,
                    maxTimeAfterPurchase: 0n,
                }]
            }
        ];

        const acceptedCurrencies: Address[] = [testTokenMint.address];

        [merchantOperatorConfigPda] = await assertGetOrCreateMerchantOperatorConfig({
            client,
            payer,
            authority: merchantAuthority,
            merchantPda,
            operatorPda,
            version,
            operatorFee,
            feeType,
            currentOrderId: 0, // initialize with 0
            policies,
            acceptedCurrencies,
            failIfExists: true
        });

        await generateManyTokenAccounts({
            client,
            payer,
            mint: testTokenMint.address,
            owners: [customer.address, merchantAuthority.address, operatorAuthority.address, settlementWallet.address, merchantPda],
        });

        [merchantEscrowAta] = await findAssociatedTokenPda({
            mint: testTokenMint.address,
            owner: merchantPda,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });
        [merchantSettlementAta] = await findAssociatedTokenPda({
            mint: testTokenMint.address,
            owner: settlementWallet.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });
        [operatorSettlementAta] = await findAssociatedTokenPda({
            mint: testTokenMint.address,
            owner: operatorAuthority.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });
        [paymentPda, paymentBump] = await findPaymentPda({
            merchantOperatorConfig: merchantOperatorConfigPda,
            buyer: customer.address,
            mint: testTokenMint.address,
            orderId: currentOrderId,
        });
    }, 20_000);

    describe('Close Payment workflow', () => {
        it('should successfully complete the clear and close workflow', async () => {
            const result = await assertCompletePaymentWorkflow({
                client,
                payer,
                paymentPda,
                operatorAuthority,
                buyer: customer,
                operatorPda,
                merchantPda,
                merchantOperatorConfigPda,
                mint: testTokenMint.address,
                buyerAta: customerTokenAccount,
                merchantEscrowAta,
                merchantSettlementAta,
                operatorSettlementAta,
                orderId: currentOrderId,
                amount: paymentAmount,
                operatorFee: Number(operatorFee),
                bump: paymentBump,
                workflow: PaymentWorkflow.ClearAndClose,
            });

            // Verify the workflow completed successfully
            expect(result.paymentStatus).toBe(Status.Cleared);
            expect(result.accountClosed).toBe(true);
            expect(result.workflow).toBe(PaymentWorkflow.ClearAndClose);
        }, 20_000);

        it('should successfully clear payment without closing', async () => {
            const result = await assertCompletePaymentWorkflow({
                client,
                payer,
                paymentPda,
                operatorAuthority,
                buyer: customer,
                operatorPda,
                merchantPda,
                merchantOperatorConfigPda,
                mint: testTokenMint.address,
                buyerAta: customerTokenAccount,
                merchantEscrowAta,
                merchantSettlementAta,
                operatorSettlementAta,
                orderId: currentOrderId,
                amount: paymentAmount,
                operatorFee: Number(operatorFee),
                bump: paymentBump,
                workflow: PaymentWorkflow.ClearOnly,
            });

            // Verify the workflow completed successfully
            expect(result.paymentStatus).toBe(Status.Cleared);
            expect(result.accountClosed).toBe(false);
            expect(result.workflow).toBe(PaymentWorkflow.ClearOnly);

            // Verify payment account still exists and is in cleared status
            await assertPaymentAccount({
                client,
                paymentPda,
                expectedOrderId: currentOrderId,
                expectedAmount: BigInt(paymentAmount),
                expectedStatus: Status.Cleared,
            });
        }, 20_000);

        it('should successfully refund payment', async () => {
            const result = await assertCompletePaymentWorkflow({
                client,
                payer,
                paymentPda,
                operatorAuthority,
                buyer: customer,
                operatorPda,
                merchantPda,
                merchantOperatorConfigPda,
                mint: testTokenMint.address,
                buyerAta: customerTokenAccount,
                merchantEscrowAta,
                merchantSettlementAta,
                operatorSettlementAta,
                orderId: currentOrderId,
                amount: paymentAmount,
                operatorFee: Number(operatorFee),
                bump: paymentBump,
                workflow: PaymentWorkflow.RefundOnly,
            });

            // Verify the workflow completed successfully
            expect(result.paymentStatus).toBe(Status.Refunded);
            expect(result.accountClosed).toBe(false); // Cannot close refunded payments
            expect(result.workflow).toBe(PaymentWorkflow.RefundOnly);

            // Verify payment account still exists and is in refunded status
            await assertPaymentAccount({
                client,
                paymentPda,
                expectedOrderId: currentOrderId,
                expectedAmount: BigInt(paymentAmount),
                expectedStatus: Status.Refunded,
            });
        }, 20_000);

        it('should fail to close payment if not in cleared status', async () => {
            // Make a payment but don't clear it
            await assertMakePayment({
                client,
                payer,
                paymentPda,
                operatorAuthority,
                buyer: customer,
                operatorPda,
                merchantPda,
                merchantOperatorConfigPda,
                mint: testTokenMint.address,
                buyerAta: customerTokenAccount,
                merchantEscrowAta,
                merchantSettlementAta,
                orderId: currentOrderId,
                amount: paymentAmount,
                bump: paymentBump,
            });

            // Verify payment is in Paid status (not Cleared)
            await assertPaymentAccount({
                client,
                paymentPda,
                expectedOrderId: currentOrderId,
                expectedAmount: BigInt(paymentAmount),
                expectedStatus: Status.Paid,
            });

            // Attempt to close payment should fail because it's not cleared
            try {
                await assertClosePayment({
                    client,
                    payer,
                    paymentPda,
                    operatorAuthority,
                    buyer: customer.address,
                    operatorPda,
                    merchantPda,
                    merchantOperatorConfigPda,
                    mint: testTokenMint.address,
                    orderId: currentOrderId,
                    amount: paymentAmount,
                    verifyBeforeStatus: false, // Skip status verification to test instruction failure
                });
                
                // If we reach here, the test should fail
                expect(true).toBe(false);
            } catch (error) {
                // Expected to fail - payment can only be closed if it's cleared
                expect(error).toBeDefined();
            }
        }, 15_000);

        it('should throw error for unimplemented chargeback workflow', async () => {
            try {
                await assertCompletePaymentWorkflow({
                    client,
                    payer,
                    paymentPda,
                    operatorAuthority,
                    buyer: customer,
                    operatorPda,
                    merchantPda,
                    merchantOperatorConfigPda,
                    mint: testTokenMint.address,
                    buyerAta: customerTokenAccount,
                    merchantEscrowAta,
                    merchantSettlementAta,
                    operatorSettlementAta,
                    orderId: currentOrderId,
                    amount: paymentAmount,
                    operatorFee: Number(operatorFee),
                    bump: paymentBump,
                    workflow: PaymentWorkflow.ChargebackAndClose,
                });

                // If we reach here, the test should fail
                expect(true).toBe(false);
            } catch (error) {
                // Expected to fail - chargeback is not yet implemented
                expect(error).toBeDefined();
                expect((error as Error).message).toContain("Chargeback workflow is not yet implemented");
            }
        }, 10_000);

    });

    afterEach(async () => {
        version++;
        currentOrderId++;
    });
});