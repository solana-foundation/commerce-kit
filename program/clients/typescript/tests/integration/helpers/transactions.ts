import {
  type Instruction,
  type TransactionSigner,
  type SolanaClient,
  type CompilableTransactionMessage,
  type TransactionMessageWithFeePayerSigner,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
  Commitment,
  sendAndConfirmTransactionFactory,
  MicroLamports,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  type TransactionMessageWithBlockhashLifetime,
  airdropFactory,
  lamports,
  KeyPairSigner,
  SolanaError,
} from "gill";
import {
  updateOrAppendSetComputeUnitPriceInstruction,
  updateOrAppendSetComputeUnitLimitInstruction,
} from "gill/programs";

const DEBUG_TRANSACTIONS = false;

const createDefaultTransaction = async (
  client: SolanaClient,
  feePayer: TransactionSigner,
  computeLimit: number = 200_000,
  feeMicroLamports: MicroLamports = 1n as MicroLamports,
): Promise<TransactionMessageWithFeePayerSigner & TransactionMessageWithBlockhashLifetime> => {
  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send();
  return pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => updateOrAppendSetComputeUnitPriceInstruction(feeMicroLamports, tx),
    (tx) => updateOrAppendSetComputeUnitLimitInstruction(computeLimit, tx),

  );
};
export const signAndSendTransaction = async (
  client: SolanaClient,
  transactionMessage: CompilableTransactionMessage &
    TransactionMessageWithBlockhashLifetime,
  commitment: Commitment = 'processed'
) => {
  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
  const signature = getSignatureFromTransaction(signedTransaction);
  await sendAndConfirmTransactionFactory(client)(signedTransaction, {
    commitment,
    skipPreflight: true,
  });
  return signature;
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
}) {
  try {
    // const simulationTx = await pipe(
    //     await createDefaultTransaction(client, payer),
    //     (tx) => appendTransactionMessageInstructions(instructions, tx),
    // );
    // const estimateCompute = estimateComputeUnitLimitFactory({ rpc: client.rpc });
    const computeUnitLimit = 200_000;
    const signature = await pipe(
      await createDefaultTransaction(client, payer, computeUnitLimit),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
      (tx) => signAndSendTransaction(client, tx)
    );
    return signature;
  } catch (error) {
    if (error instanceof SolanaError && DEBUG_TRANSACTIONS) {
      console.log("Solana Error:",error.context.__code);
    }

    throw new Error(`Failed to ${description.toLowerCase()}`);
  }
}

async function setupWallets(client: SolanaClient, wallets: KeyPairSigner<string>[]) {
  try {
    const airdrop = airdropFactory({ rpc: client.rpc, rpcSubscriptions: client.rpcSubscriptions });
    const airdropPromises = wallets.map(async (wallet) => {
      await airdrop({
        commitment: 'processed',
        lamports: lamports(BigInt(1_000_000_000)),
        recipientAddress: wallet.address
      });
      // await pollForBalance(client, wallet.address, 10000);
    });
    await Promise.all(airdropPromises);
  } catch (error) {
    throw new Error(`Failed to setup wallets.`);
  }
}

export { sendAndConfirmInstructions, setupWallets, createDefaultTransaction };
