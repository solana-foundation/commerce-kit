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
    assertUpdateOperatorAuthority,
} from './helpers/state-utils';

describe('Update Operator Authority', () => {
    let client: SolanaClient;
    let payer: KeyPairSigner;
    let originalOperatorAuthority: KeyPairSigner;
    let newOperatorAuthority: KeyPairSigner;

    let operatorPda: Address;
    let operatorBump: ProgramDerivedAddressBump;

    let version = 1; // incremented after each test

    beforeEach(async () => {
        client = createSolanaClient({ urlOrMoniker: 'http://localhost:8899' });

        payer = await generateExtractableKeyPairSigner();
        originalOperatorAuthority = await generateExtractableKeyPairSigner();
        newOperatorAuthority = await generateExtractableKeyPairSigner();

        await setupWallets(client, [
            payer,
            originalOperatorAuthority,
            newOperatorAuthority,
        ]);

        [operatorPda, operatorBump] = await assertGetOrCreateOperator({
            client,
            payer,
            owner: originalOperatorAuthority,
            failIfExists: false
        });

    }, 30_000);

    describe('Update Operator Authority happy path', () => {
        it('should update operator authority', async () => {
            await assertUpdateOperatorAuthority({
                client,
                payer,
                currentAuthority: originalOperatorAuthority,
                operatorPda,
                operatorBump,
                newAuthority: newOperatorAuthority,
            });
        }, 10_000);
    });

    afterEach(async () => {
        version++;
    });
});