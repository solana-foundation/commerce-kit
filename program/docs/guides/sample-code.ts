import { loadKeypairSignerFromFile } from "gill/node";
import {
    createSolanaClient,
    SolanaClient,
    KeyPairSigner,
    Address,
    createTransaction,
    Signature,
    Instruction,
    TransactionSigner,
    Blockhash,
    SolanaError
} from 'gill';
import {
    findOperatorPda,
    findMerchantPda,
    findMerchantOperatorConfigPda,
    findPaymentPda,
    getCreateOperatorInstruction,
    getInitializeMerchantInstruction,
    getInitializeMerchantOperatorConfigInstruction,
    getMakePaymentInstruction,
    getClearPaymentInstruction,
    getClosePaymentInstruction,
    FeeType,
} from '@solana-commerce/program-client';
import {
    TOKEN_PROGRAM_ADDRESS,
    estimateComputeUnitLimitFactory,
    findAssociatedTokenPda,
    getCreateAssociatedTokenIdempotentInstructionAsync
} from 'gill/programs';

const CONFIG = {
    CLUSTER_URL: 'devnet',
    USDC_MINT: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' as Address, // USDC Devnet Mint Address
    USDT_MINT: 'usDtQUSH1bvDU8byfxp9jURLnjvno4NFoASbugdeHYC' as Address, // USDT Devnet Mock Mint Address
    OPERATOR_FEE: 1_000n, // 0.001 * 10^6
    FEE_TYPE: FeeType.Fixed,
    PAYMENT_AMOUNT: 1_000_000, // $1.00 USDC (6 decimals)
    CONFIG_VERSION: 1,
    ORDER_ID: 2,
    SKIP: {
        CREATE_OPERATOR: true,
        CREATE_MERCHANT: true,
        CREATE_MERCHANT_OPERATOR_CONFIG: true,
        MAKE_PAYMENT: false,
        SETTLE_PAYMENT: false,
        CLOSE_PAYMENT: false,
    }
};

async function sendAndConfirmInstructions({
    client,
    payer,
    instructions,
    description
}: {
    client: SolanaClient,
    payer: TransactionSigner,
    instructions: Instruction[],
    description: string
}): Promise<Signature> {
    try {
        const simulationTx = createTransaction({
            version: "legacy",
            feePayer: payer,
            instructions: instructions,
            latestBlockhash: {
                blockhash: '11111111111111111111111111111111' as Blockhash,
                lastValidBlockHeight: 0n,
            },
            computeUnitLimit: 1_400_000,
            computeUnitPrice: 1,
        });

        const estimateCompute = estimateComputeUnitLimitFactory({ rpc: client.rpc });
        const computeUnitLimit = await estimateCompute(simulationTx);
        const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send();
        const tx = createTransaction({
            version: "legacy",
            feePayer: payer,
            instructions: instructions,
            latestBlockhash,
            computeUnitLimit: computeUnitLimit,
            computeUnitPrice: 1, // In production, use dynamic pricing
        });
        const signature = await client.sendAndConfirmTransaction(tx, { commitment: 'confirmed', skipPreflight: true });
        console.log(`    - ${description} - Signature: ${signature}`);
        return signature;
    } catch (error) {
        if (error instanceof SolanaError) {
            error.name && console.error(`Error Code: ${error.name}`);
            error.context && console.error(`Error Context: ${JSON.stringify(error.context)}`);
            error.message && console.error(`Error Message: ${error.message}`);
            error.cause && console.error(`Error Stack: ${error.cause}`);
        }
        throw new Error(`Error  Failed to ${description.toLowerCase()}`);

    }
}

async function generateManyTokenAccounts({
    client,
    payer,
    mint,
    owners,
}: {
    client: SolanaClient,
    payer: KeyPairSigner,
    mint: Address,
    owners: Address[],
}): Promise<Address[]> {
    const instructionsAndATAs = await Promise.all(
        owners.map(async (owner) => {
            const [ata] = await findAssociatedTokenPda({
                mint: mint,
                owner: owner,
                tokenProgram: TOKEN_PROGRAM_ADDRESS,
            });

            const instruction = await getCreateAssociatedTokenIdempotentInstructionAsync({
                mint: mint,
                payer,
                owner: owner,
                tokenProgram: TOKEN_PROGRAM_ADDRESS,
            });

            return { instruction, ata };
        })
    );

    const instructions = instructionsAndATAs.map(({ instruction }) => instruction);
    const atas = instructionsAndATAs.map(({ ata }) => ata);

    await sendAndConfirmInstructions({
        client,
        payer,
        instructions,
        description: "Generate Many Token Accounts"
    });

    return atas;
}

async function setupWallets({ client }: { client: SolanaClient }) {
    const payer = await loadKeypairSignerFromFile('./keys/payer.json');
    const merchant = await loadKeypairSignerFromFile('./keys/merchant.json');
    const operator = await loadKeypairSignerFromFile('./keys/operator.json');
    const customer = await loadKeypairSignerFromFile('./keys/customer.json');
    const settlementWallet = await loadKeypairSignerFromFile('./keys/settlement.json');
    await generateManyTokenAccounts({
        client,
        payer,
        mint: CONFIG.USDC_MINT,
        owners: [operator.address, customer.address, customer.address, merchant.address, settlementWallet.address]
    });
    return { payer, merchant, operator, customer, settlementWallet };
}


async function main() {
    try {
        console.log('Starting Commerce Demo...');
        const client = createSolanaClient({ urlOrMoniker: CONFIG.CLUSTER_URL });
        console.log("\n1. Setting up wallets and token accounts...");
        const { payer, merchant, operator, customer, settlementWallet } = await setupWallets({ client });

        console.log("\n2. Creating Operator...");

        const [operatorPda, operatorBump] = await findOperatorPda({
            owner: operator.address
        });

        const createOperatorIx = getCreateOperatorInstruction({
            bump: operatorBump,
            payer,
            authority: operator,
            operator: operatorPda,
        });

        if (!CONFIG.SKIP.CREATE_OPERATOR) {
            await sendAndConfirmInstructions({
                client,
                payer,
                instructions: [createOperatorIx],
                description: 'Operator created'
            });
        }
        console.log(`    - Operator PDA: ${operatorPda}`);

        console.log("\n3. Creating Merchant...");
        const [merchantPda, merchantBump] = await findMerchantPda({
            owner: merchant.address
        });

        const [settlementUsdcAta] = await findAssociatedTokenPda({
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
            mint: CONFIG.USDC_MINT,
            owner: settlementWallet.address
        });

        const [escrowUsdcAta] = await findAssociatedTokenPda({
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
            mint: CONFIG.USDC_MINT,
            owner: merchantPda
        });

        const [settlementUsdtAta] = await findAssociatedTokenPda({
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
            mint: CONFIG.USDT_MINT,
            owner: settlementWallet.address
        });

        const [escrowUsdtAta] = await findAssociatedTokenPda({
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
            mint: CONFIG.USDT_MINT,
            owner: merchantPda
        });

        const initMerchantIx = getInitializeMerchantInstruction({
            bump: merchantBump,
            payer,
            authority: merchant,
            merchant: merchantPda,
            settlementWallet: settlementWallet.address,
            settlementUsdcAta,
            escrowUsdcAta,
            usdcMint: CONFIG.USDC_MINT,
            settlementUsdtAta,
            escrowUsdtAta,
            usdtMint: CONFIG.USDT_MINT,
        });

        if (!CONFIG.SKIP.CREATE_MERCHANT) {
            await sendAndConfirmInstructions({
                client,
                payer,
                instructions: [initMerchantIx],
                description: 'Merchant created'
            });
        }
        console.log(`    - Merchant PDA: ${merchantPda}`);
        console.log(`    - Settlement and escrow token accounts created`);

        console.log("\n4. Creating Merchant Operator Config...");
        const [merchantOperatorConfigPda, configBump] = await findMerchantOperatorConfigPda({
            merchant: merchantPda,
            operator: operatorPda,
            version: CONFIG.CONFIG_VERSION
        });

        const initConfigIx = getInitializeMerchantOperatorConfigInstruction({
            payer,
            authority: merchant,
            merchant: merchantPda,
            operator: operatorPda,
            config: merchantOperatorConfigPda,
            version: CONFIG.CONFIG_VERSION,
            bump: configBump,
            operatorFee: CONFIG.OPERATOR_FEE,
            feeType: CONFIG.FEE_TYPE,
            policies: [], // leave empty for basic demonstration
            acceptedCurrencies: [CONFIG.USDC_MINT]
        });

        if (!CONFIG.SKIP.CREATE_MERCHANT_OPERATOR_CONFIG) {
            await sendAndConfirmInstructions({
                client,
                payer,
                instructions: [initConfigIx],
                description: 'Merchant operator config created'
            });
        }

        console.log("\n5. Processing Payment...");

        const [customerTokenAccount] = await findAssociatedTokenPda({
            mint: CONFIG.USDC_MINT,
            owner: customer.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS
        });

        const orderId = CONFIG.ORDER_ID;
        const [paymentPda, paymentBump] = await findPaymentPda({
            merchantOperatorConfig: merchantOperatorConfigPda,
            buyer: customer.address,
            mint: CONFIG.USDC_MINT,
            orderId
        });

        const makePaymentIx = getMakePaymentInstruction({
            payer,
            payment: paymentPda,
            operatorAuthority: operator,
            buyer: customer,
            operator: operatorPda,
            merchant: merchantPda,
            merchantOperatorConfig: merchantOperatorConfigPda,
            mint: CONFIG.USDC_MINT,
            buyerAta: customerTokenAccount,
            merchantEscrowAta: escrowUsdcAta,
            merchantSettlementAta: settlementUsdcAta,
            orderId,
            amount: CONFIG.PAYMENT_AMOUNT,
            bump: paymentBump,
        });

        if (!CONFIG.SKIP.MAKE_PAYMENT) {
            await sendAndConfirmInstructions({
                client,
                payer,
                instructions: [makePaymentIx],
                description: 'Payment made'
            });
        }

        console.log("\n6. Settling Payment...");

        const [operatorSettlementAta] = await findAssociatedTokenPda({
            mint: CONFIG.USDC_MINT,
            owner: operator.address,
            tokenProgram: TOKEN_PROGRAM_ADDRESS
        });

        const clearPaymentIx = getClearPaymentInstruction({
            payer,
            payment: paymentPda,
            operatorAuthority: operator,
            buyer: customer.address,
            merchant: merchantPda,
            operator: operatorPda,
            merchantOperatorConfig: merchantOperatorConfigPda,
            mint: CONFIG.USDC_MINT,
            merchantEscrowAta: escrowUsdcAta,
            merchantSettlementAta: settlementUsdcAta,
            operatorSettlementAta,
        });

        if (!CONFIG.SKIP.SETTLE_PAYMENT) {
            await sendAndConfirmInstructions({
                client,
                payer,
                instructions: [clearPaymentIx],
                description: 'Payment cleared'
            });
        }

        const merchantReceived = CONFIG.PAYMENT_AMOUNT - Number(CONFIG.OPERATOR_FEE);
        const operatorFee = Number(CONFIG.OPERATOR_FEE);
        console.log(`    - Payment cleared - Merchant received: $${(merchantReceived / 1_000_000).toFixed(2)}, Operator fee: $${(operatorFee / 1_000_000).toFixed(2)}`);

        console.log("\n7. Closing Payment...");

        const closePaymentIx = getClosePaymentInstruction({
            payer,
            payment: paymentPda,
            operatorAuthority: operator,
            operator: operatorPda,
            merchant: merchantPda,
            buyer: customer.address,
            merchantOperatorConfig: merchantOperatorConfigPda,
            mint: CONFIG.USDC_MINT,
        });

        if (!CONFIG.SKIP.CLOSE_PAYMENT) {
            await sendAndConfirmInstructions({
                client,
                payer,
                instructions: [closePaymentIx],
                description: 'Payment closed'
            });
        }
        console.log('Payment closed');
    }
    catch (error) {
        console.error(error);
    }
}

main();