import { Address, getBase64Codec, SolanaClient } from 'gill';
import { fetchToken } from 'gill/programs';
import { expect } from '@jest/globals';
import {
    fetchMerchant,
    fetchOperator,
    fetchMerchantOperatorConfig,
    Status,
    fetchPayment,
    PolicyData,
} from '../../../src/generated';
import { getMerchantOperatorConfigCodec } from '../../../src/codecs/merchantOperatorConfig';

export async function assertMerchantAccount({
    client,
    merchantPda,
    expectedOwner,
    expectedBump,
    expectedSettlementWallet
}: {
    client: SolanaClient,
    merchantPda: Address,
    expectedOwner: Address,
    expectedBump: number,
    expectedSettlementWallet: Address
}
) {
    const merchantAccount = await fetchMerchant(client.rpc, merchantPda, { commitment: 'processed' });
    expect(merchantAccount.data).not.toBeNull();
    expect(merchantAccount.data.owner).toBe(expectedOwner);
    expect(merchantAccount.data.bump).toBe(expectedBump);
    expect(merchantAccount.data.settlementWallet).toBe(expectedSettlementWallet);
}

export async function assertOperatorAccount({
    client,
    operatorPda,
    expectedOwner,
    expectedBump
}: {
    client: SolanaClient,
    operatorPda: Address,
    expectedOwner: Address,
    expectedBump: number
}) {
    const operatorAccount = await fetchOperator(client.rpc, operatorPda, { commitment: 'processed' });
    expect(operatorAccount.data).not.toBeNull();
    expect(operatorAccount.data.owner).toBe(expectedOwner);
    expect(operatorAccount.data.bump).toBe(expectedBump);
}

export async function assertTokenAccount({
    client,
    tokenAccount,
    expectedMint,
    expectedOwner
}: {
    client: SolanaClient,
    tokenAccount: Address,
    expectedMint: Address,
    expectedOwner: Address
}) {
    const accountInfo = await fetchToken(client.rpc, tokenAccount, { commitment: 'processed' });
    expect(accountInfo.data).not.toBeNull();
    expect(accountInfo.data.mint).toBe(expectedMint);
    expect(accountInfo.data.owner).toBe(expectedOwner);
}

export async function assertMerchantOperatorConfigAccount({
    client,
    merchantOperatorConfigPda,
    expectedBump,
    expectedVersion,
    expectedMerchant,
    expectedOperator,
    expectedOperatorFee,
    expectedCurrentOrderId,
    expectedPolicies,
    expectedAcceptedCurrencies
}: {
    client: SolanaClient,
    merchantOperatorConfigPda: Address,
    expectedBump: number,
    expectedVersion: number,
    expectedMerchant: Address,
    expectedOperator: Address,
    expectedOperatorFee: bigint,
    expectedCurrentOrderId: number,
    expectedPolicies: PolicyData[],
    expectedAcceptedCurrencies: Address[]
}) {
    //const merchantOperatorConfig = await fetchMerchantOperatorConfig(client.rpc, merchantOperatorConfigPda, { commitment: 'processed' });
    const safeLogBigint = (value: any) => {
        return JSON.stringify(value, (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        });
    }
    const base64 = await client.rpc.getAccountInfo(merchantOperatorConfigPda, { commitment: 'processed', encoding: 'base64' }).send();
    expect(base64.value?.data[0]).not.toBeNull();
    const data = base64.value?.data[0] as string;
    const tranform = getBase64Codec().encode(data);
    const merchantOperatorConfig = getMerchantOperatorConfigCodec().decode(tranform);

    expect(merchantOperatorConfig).not.toBeNull();
    expect(merchantOperatorConfig.bump).toBe(expectedBump);
    expect(merchantOperatorConfig.version).toBe(expectedVersion);
    expect(merchantOperatorConfig.merchant).toBe(expectedMerchant);
    expect(merchantOperatorConfig.operator).toBe(expectedOperator);
    expect(merchantOperatorConfig.operatorFee).toBe(expectedOperatorFee);
    expect(merchantOperatorConfig.currentOrderId).toBe(expectedCurrentOrderId);
    expect(merchantOperatorConfig.numPolicies).toBe(expectedPolicies.length);
    expect(merchantOperatorConfig.numAcceptedCurrencies).toBe(expectedAcceptedCurrencies.length);
    expect(merchantOperatorConfig.acceptedCurrencies).toEqual(expectedAcceptedCurrencies);
    expect(merchantOperatorConfig.policies.length).toBe(expectedPolicies.length);
    
    merchantOperatorConfig.policies.forEach((policy, index) => {
        const expectedPolicy = expectedPolicies[index];
        expect(policy.__kind).toBe(expectedPolicy.__kind);
        
        // Compare fields based on policy type
        if (policy.__kind === 'Settlement' && expectedPolicy.__kind === 'Settlement') {
            const actualData = policy.fields[0];
            const expectedData = expectedPolicy.fields[0];
            
            expect(actualData.minSettlementAmount).toBe(BigInt(expectedData.minSettlementAmount));
            expect(actualData.settlementFrequencyHours).toBe(expectedData.settlementFrequencyHours);
            expect(actualData.autoSettle).toBe(expectedData.autoSettle);
        } else if (policy.__kind === 'Refund' && expectedPolicy.__kind === 'Refund') {
            const actualData = policy.fields[0];
            const expectedData = expectedPolicy.fields[0];
            
            expect(actualData.maxAmount).toBe(BigInt(expectedData.maxAmount));
            expect(actualData.maxTimeAfterPurchase).toBe(BigInt(expectedData.maxTimeAfterPurchase));
        }
    });
}


export async function assertPaymentAccount({
    client,
    paymentPda,
    expectedOrderId,
    expectedAmount,
    expectedStatus,
}: {
    client: SolanaClient,
    paymentPda: Address,
    expectedOrderId: number,
    expectedAmount: bigint,
    expectedStatus: Status,
}) {
    const paymentAccount = await fetchPayment(client.rpc, paymentPda, { commitment: 'processed' });
    expect(paymentAccount.data.orderId).toBe(expectedOrderId);
    expect(paymentAccount.data.amount).toBe(expectedAmount);
    expect(paymentAccount.data.status).toBe(expectedStatus);
    expect(paymentAccount.data.createdAt).toBeDefined();
    expect(paymentAccount.data.discriminator).toBe(3);
}

// Helper function to get token balance
export async function getTokenBalance(client: SolanaClient, tokenAccount: Address): Promise<bigint> {
    const balance = await client.rpc.getTokenAccountBalance(tokenAccount, { commitment: 'processed' }).send();
    return BigInt(balance.value.amount);
}

// Assert token balance changes for simple two-party transfers
export async function assertTokenBalanceChanges({
    client,
    preBalances,
    senderAta,
    receiverAta,
    expectedAmount,
}: {
    client: SolanaClient,
    preBalances: [bigint, bigint], // [senderPreBalance, receiverPreBalance]
    senderAta: Address,
    receiverAta: Address,
    expectedAmount: bigint,
}) {
    const senderPostBalance = await getTokenBalance(client, senderAta);
    const receiverPostBalance = await getTokenBalance(client, receiverAta);

    const [senderPreBalance, receiverPreBalance] = preBalances;

    // Assert sender balance decreased by expected amount
    expect(senderPostBalance).toBe(senderPreBalance - expectedAmount);

    // Assert receiver balance increased by expected amount
    expect(receiverPostBalance).toBe(receiverPreBalance + expectedAmount);
}

// Balance change interface for complex multi-party transfers
export interface BalanceChange {
    ata: Address;
    expectedChange: bigint; // Positive for increase, negative for decrease
    description: string;
}

// Assert multiple token balance changes for complex transfers
export async function assertMultipleTokenBalanceChanges({
    client,
    preBalances,
    balanceChanges,
}: {
    client: SolanaClient,
    preBalances: Map<Address, bigint>, // Map of ATA to pre-balance
    balanceChanges: BalanceChange[],
}) {
    // Get all post balances and assert each change
    for (const change of balanceChanges) {
        const preBalance = preBalances.get(change.ata);
        if (preBalance === undefined) {
            throw new Error(`Pre-balance not found for ATA: ${change.ata}`);
        }

        const postBalance = await getTokenBalance(client, change.ata);
        const expectedPostBalance = preBalance + change.expectedChange;

        expect(postBalance).toBe(expectedPostBalance);
    }
}