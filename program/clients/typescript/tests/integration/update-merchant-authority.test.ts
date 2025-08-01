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
    assertGetOrCreateMerchant,
    assertUpdateMerchantAuthority,
} from './helpers/state-utils';

describe('Update Merchant Authority', () => {
    let client: SolanaClient;
    let payer: KeyPairSigner;
    let originalMerchantAuthority: KeyPairSigner;
    let newMerchantAuthority: KeyPairSigner;
    let settlementWallet: KeyPairSigner;
    let merchantPda: Address;
    let merchantBump: ProgramDerivedAddressBump;

    let version = 1; // incremented after each test

    beforeEach(async () => {
        client = createSolanaClient({ urlOrMoniker: 'http://localhost:8899' });

        payer = await generateExtractableKeyPairSigner();
        originalMerchantAuthority = await generateExtractableKeyPairSigner();
        newMerchantAuthority = await generateExtractableKeyPairSigner();
        settlementWallet = await generateExtractableKeyPairSigner();

        await setupWallets(client, [
            payer,
            newMerchantAuthority,
            settlementWallet,
        ]);

        [merchantPda, merchantBump] = await assertGetOrCreateMerchant({
            client,
            payer,
            authority: originalMerchantAuthority,
            settlementWallet,
            failIfExists: false
        });

    }, 30_000);

    describe('Update Merchant Authority happy path', () => {
        it('should update merchant authority', async () => {
            await assertUpdateMerchantAuthority({
                client,
                payer,
                currentAuthority: originalMerchantAuthority,
                merchantPda,
                merchantBump,
                settlementWallet: settlementWallet.address,
                newAuthority: newMerchantAuthority,
            });
        }, 10_000);
    });

    afterEach(async () => {
        version++;
    });
});