import { describe, it, beforeEach } from '@jest/globals';
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
} from '../../src/generated';
import { setupWallets } from './helpers/transactions';
import {
    assertGetOrCreateOperator,
    assertGetOrCreateMerchant,
    assertGetOrCreateMerchantOperatorConfig,
    assertMakePayment,
    assertClearPayment,
} from './helpers/state-utils';
import { generateManyTokenAccounts, generateMint, mintToOwner } from './helpers/tokens';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from 'gill/programs';

describe('Clear Payment', () => {
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

    // PDAs and bumps
    let merchantPda: Address;
    let operatorPda: Address;
    let merchantOperatorConfigPda: Address;

    let version = 1; // incremented after each test
    const operatorFee = lamports(100000n); // 0.0001 SOL
    const feeType = FeeType.Fixed;
    let currentOrderId = 1;

    beforeEach(async () => {
        client = createSolanaClient({ urlOrMoniker: 'http://localhost:8899' });

        // Generate keypairs
        payer = await generateExtractableKeyPairSigner();
        operatorAuthority = await generateExtractableKeyPairSigner();
        merchantAuthority = await generateExtractableKeyPairSigner();
        settlementWallet = await generateExtractableKeyPairSigner();
        testTokenAuthority = await generateExtractableKeyPairSigner();
        testTokenMint = await generateExtractableKeyPairSigner();
        customer = await generateExtractableKeyPairSigner();

        // Setup wallets with SOL
        await setupWallets(client, [payer, operatorAuthority, merchantAuthority, settlementWallet, testTokenAuthority, customer]);

        // Create test token mint
        await generateMint({
            client,
            payer,
            authority: testTokenAuthority,
            mint: testTokenMint,
        });

        // Mint tokens to customer
        customerTokenAccount = await mintToOwner({
            client,
            payer,
            mint: testTokenMint.address,
            owner: customer.address,
            authority: testTokenAuthority,
            amount: 1_000_000,
        });

        // Create operator
        [operatorPda] = await assertGetOrCreateOperator({
            client,
            payer,
            owner: operatorAuthority,
            failIfExists: false
        });

        // Create merchant
        [merchantPda] = await assertGetOrCreateMerchant({
            client,
            payer,
            authority: merchantAuthority,
            settlementWallet,
            failIfExists: false
        });

        // Set up policies and accepted currencies
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
                    maxAmount: 10000n,
                    maxTimeAfterPurchase: 10000n,
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

        const amount = 1_000_000;
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
            amount,
            bump: paymentBump,
        });
    }, 30_000);

    describe('Clear Payment happy path', () => {

        it('should clear a payment', async () => {
            await assertClearPayment({
                client,
                payer,
                paymentPda,
                operatorAuthority,
                buyer: customer.address,
                operatorPda,
                merchantPda,
                merchantOperatorConfigPda,
                mint: testTokenMint.address,
                merchantEscrowAta,
                merchantSettlementAta,
                operatorSettlementAta,
                orderId: currentOrderId,
                amount: 1_000_000,
                operatorFee: Number(operatorFee), // Convert BigInt to number
                verifyBeforeStatus: false,
            });


        }, 10_000);
    });

    afterEach(async () => {
        version++;
    });
});