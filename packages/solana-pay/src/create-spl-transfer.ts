import type { Amount, Memo, Recipient, References, SPLToken } from './types';
import { address, type Address, Rpc, SolanaRpcApi, Instruction, AccountRole, type AccountMeta } from 'gill';
import {
    getAssociatedTokenAccountAddress,
    getTransferCheckedInstruction,
    TOKEN_PROGRAM_ADDRESS,
    TOKEN_2022_PROGRAM_ADDRESS,
    fetchMint,
} from 'gill/programs/token';
import { getAddMemoInstruction } from 'gill/programs';
import { CreateTransferError } from './error';

export interface CreateSplTransferFields {
    recipient: Recipient;
    amount: Amount;
    splToken: SPLToken;
    reference?: References;
    memo?: Memo;
}

export async function createSplTransfer(
    rpc: Rpc<SolanaRpcApi>,
    sender: Address,
    { recipient, amount, splToken, reference, memo }: CreateSplTransferFields,
): Promise<Instruction[]> {
    const senderInfo = await rpc.getAccountInfo(sender).send();
    if (!senderInfo.value) throw new CreateTransferError('sender not found');

    const recipientAddress = address(recipient);
    const splTokenAddress = address(splToken);

    const mintInfo = await rpc.getAccountInfo(splTokenAddress).send();
    if (!mintInfo.value) throw new CreateTransferError('mint not found');

    const tokenProgram =
        mintInfo.value.owner === TOKEN_2022_PROGRAM_ADDRESS.toString()
            ? TOKEN_2022_PROGRAM_ADDRESS
            : TOKEN_PROGRAM_ADDRESS;

    const mint = await fetchMint(rpc, splTokenAddress);
    if (!mint.data.isInitialized) throw new CreateTransferError('mint not initialized');

    const tokens = amount;

    const senderATA = await getAssociatedTokenAccountAddress(splTokenAddress, sender, tokenProgram);
    const recipientATA = await getAssociatedTokenAccountAddress(splTokenAddress, recipientAddress, tokenProgram);

    // // Check sender's ATA
    // const senderAccount = await getAssociatedTokenAccountAddress({mint: splTokenAddress, owner: sender, tokenProgram});
    // if (!senderAccount.data.isInitialized) throw new CreateTransferError('sender not initialized');
    // if (senderAccount.data.isFrozen) throw new CreateTransferError('sender frozen');

    // if (tokens > senderAccount.data.amount) throw new CreateTransferError('insufficient funds');

    const instructions: Instruction[] = [];

    if (memo) {
        instructions.push(
            getAddMemoInstruction({
                memo: memo,
            }),
        );
    }

    // const recipientATAInfo = await rpc.getAccountInfo(recipientATA).send();
    // if (!recipientATAInfo.value) {
    //   instructions.push(
    //     getCreateAssociatedTokenInstruction({
    //       mint: splTokenAddress,
    //       tokenProgram,
    //       owner: recipientAddress,
    //       ata: recipientATA,
    //       payer:
    //     })
    //   );
    // } else {
    //   const recipientAccount = await fetchTokenAccount(rpc, recipientATA, { programAddress: tokenProgram });
    //   if (!recipientAccount.data.isInitialized) throw new CreateTransferError('recipient not initialized');
    //   if (recipientAccount.data.isFrozen) throw new CreateTransferError('recipient frozen');
    // }

    const transferInstruction = getTransferCheckedInstruction({
        source: senderATA,
        mint: splTokenAddress,
        destination: recipientATA,
        authority: sender,
        amount: tokens,
        decimals: mint.data.decimals,
    });

    if (reference) {
        const refs = Array.isArray(reference) ? reference : [reference];
        const referenceAccounts: AccountMeta[] = refs.map(ref => ({
            address: address(ref.toString()),
            role: AccountRole.READONLY,
        }));

        // Create a new instruction with the additional reference accounts
        const instructionWithReferences: Instruction = {
            ...transferInstruction,
            accounts: [...transferInstruction.accounts, ...referenceAccounts],
        };

        instructions.push(instructionWithReferences);
    } else {
        instructions.push(transferInstruction);
    }

    return instructions;
}
