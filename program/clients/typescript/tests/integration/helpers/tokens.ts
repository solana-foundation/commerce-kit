import {
    Address,
    getMinimumBalanceForRentExemption,
    KeyPairSigner,
    SolanaClient
} from "gill";
import {
    getCreateAccountInstruction,
    TOKEN_PROGRAM_ADDRESS,
    getInitializeMintInstruction,
    getMintSize,
    getCreateAssociatedTokenIdempotentInstructionAsync,
    getMintToInstruction,
    findAssociatedTokenPda
} from "gill/programs";
import { sendAndConfirmInstructions } from "./transactions";

const space = getMintSize();

async function generateMint({
    client,
    payer,
    authority,
    mint,
}: {
    client: SolanaClient,
    payer: KeyPairSigner,
    authority: KeyPairSigner,
    mint: KeyPairSigner,
}): Promise<Address> {
    const instructions = [
        getCreateAccountInstruction({
            space,
            lamports: getMinimumBalanceForRentExemption(space),
            newAccount: mint,
            payer,
            programAddress: TOKEN_PROGRAM_ADDRESS,
        }),
        getInitializeMintInstruction(
            {
                mint: mint.address,
                mintAuthority: authority.address,
                freezeAuthority: authority.address,
                decimals: 6,
            },
            {
                programAddress: TOKEN_PROGRAM_ADDRESS,
            },
        )
    ]
    await sendAndConfirmInstructions({
        client,
        payer,
        instructions,
        description: "Generate Mint"
    });
    return mint.address;
}

async function mintToOwner({
    client,
    payer,
    mint,
    owner,
    authority,
    amount,
}: {
    client: SolanaClient,
    payer: KeyPairSigner,
    mint: Address
    authority: KeyPairSigner,
    owner: Address,
    amount: number,
}): Promise<Address> {

    const [ata] = await findAssociatedTokenPda({
        mint,
        owner,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const mintInstructions = [
        // Create the Destination Associated Token Account
        await getCreateAssociatedTokenIdempotentInstructionAsync({
            mint: mint,
            ata,
            payer,
            owner,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }),
        // Mint To the Destination Associated Token Account
        getMintToInstruction({
            mint: mint,
            token: ata,
            amount: BigInt(amount * 10 ** 6),
            mintAuthority: authority, // Signs by including the signer rather than the public key
        }, {
            programAddress: TOKEN_PROGRAM_ADDRESS,
        })
    ];
    await sendAndConfirmInstructions({
        client,
        payer,
        instructions: mintInstructions,
        description: "Mint to Owner"
    });
    return ata;
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

export {
    generateMint,
    mintToOwner,
    generateManyTokenAccounts
}