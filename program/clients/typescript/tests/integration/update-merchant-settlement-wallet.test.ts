import { describe, it, beforeEach } from '@jest/globals';
import {
    createSolanaClient,
    SolanaClient,
    KeyPairSigner,
    Address,
    generateExtractableKeyPairSigner,
    ProgramDerivedAddressBump,
} from 'gill';
import { setupWallets } from './helpers/transactions';
import {
    assertGetOrCreateOperator,
    assertGetOrCreateMerchant,
    assertUpdateMerchantSettlementWallet,
} from './helpers/state-utils';

describe('Update Merchant Settlement Wallet', () => {
    let client: SolanaClient;
    let payer: KeyPairSigner;
    let operatorAuthority: KeyPairSigner;
    let merchantAuthority: KeyPairSigner;
    let originalSettlementWallet: KeyPairSigner;
    let newSettlementWallet: KeyPairSigner;

    // PDAs and bumps
    let merchantPda: Address;
    let merchantBump: ProgramDerivedAddressBump;
    let operatorPda: Address;

    let version = 1; // incremented after each test

    beforeEach(async () => {
        client = createSolanaClient({ urlOrMoniker: 'http://localhost:8899' });

        payer = await generateExtractableKeyPairSigner();
        operatorAuthority = await generateExtractableKeyPairSigner();
        merchantAuthority = await generateExtractableKeyPairSigner();
        originalSettlementWallet = await generateExtractableKeyPairSigner();
        newSettlementWallet = await generateExtractableKeyPairSigner();

        await setupWallets(client, [
            payer,
            operatorAuthority,
            merchantAuthority,
            originalSettlementWallet,
            newSettlementWallet,
        ]);

        [operatorPda] = await assertGetOrCreateOperator({
            client,
            payer,
            owner: operatorAuthority,
            failIfExists: false
        });

        [merchantPda, merchantBump] = await assertGetOrCreateMerchant({
            client,
            payer,
            authority: merchantAuthority,
            settlementWallet: originalSettlementWallet,
            failIfExists: false
        });

    }, 30_000);

    describe('Update Merchant Settlement Wallet happy path', () => {
        it('should update merchant settlement wallet', async () => {
            await assertUpdateMerchantSettlementWallet({
                client,
                payer,
                authority: merchantAuthority,
                merchantPda,
                merchantBump,
                newSettlementWallet,
            });
        }, 10_000);
    });

    afterEach(async () => {
        version++;
    });
});