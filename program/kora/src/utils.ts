import { loadKeypairSignerFromFile } from "gill/node";
import { join } from "path";
import {
  Address,
  appendTransactionMessageInstructions,
  compileTransaction,
  fetchEncodedAccount,
  getMinimumBalanceForRentExemption,
  Instruction,
  KeyPairSigner,
  partiallySignTransaction,
  pipe,
  SolanaClient,
  Transaction,
  TransactionSigner,
} from "gill";
import {
  getCreateAccountInstruction,
  TOKEN_PROGRAM_ADDRESS,
  getInitializeMintInstruction,
  getMintSize,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getMintToInstruction,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
} from "gill/programs";
import {
  createDefaultTransaction,
  sendAndConfirmInstructions,
} from "../../clients/typescript/tests/integration/helpers/transactions";
import {
  getMerchantOperatorConfigDecoder,
  getPaymentDecoder,
  Payment,
} from "../../clients/typescript/src/generated";

async function getNextOrderId(
  solanaClient: SolanaClient,
  merchantOperatorConfigPda: Address
): Promise<number> {
  try {
    const account = await fetchEncodedAccount(
      solanaClient.rpc,
      merchantOperatorConfigPda
    );

    if (!account.exists) {
      // Config doesn't exist yet, start with 0
      return 1;
    }

    const decoded = getMerchantOperatorConfigDecoder().decode(account.data);

    const currentOrderId = decoded.currentOrderId + 1;

    return currentOrderId;
  } catch (error) {
    console.log("Config doesn't exist yet, starting with order ID 0");
    return 1;
  }
}

async function getPaymentAccount(
  solanaClient: SolanaClient,
  paymentPda: Address
): Promise<Payment> {
  try {
    const account = await fetchEncodedAccount(solanaClient.rpc, paymentPda);

    if (!account.exists) {
      throw new Error("Payment account does not exist");
    }

    const decoded = getPaymentDecoder().decode(account.data);

    return decoded;
  } catch (error) {
    throw new Error("Payment account does not exist");
  }
}

async function loadKeypair(fileName: string): Promise<KeyPairSigner> {
  const filePath = join(process.cwd(), fileName);

  try {
    return loadKeypairSignerFromFile(filePath);
  } catch (error: any) {
    console.error(`Failed to load ${fileName}: ${error.message}`);
    throw error;
  }
}

async function generateMint({
  client,
  payer,
  authority,
  mintKeypair,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  authority: KeyPairSigner;
  mintKeypair: KeyPairSigner;
}): Promise<Address> {
  // Check if mint already exists
  const mint = await client.rpc.getAccountInfo(mintKeypair.address).send();
  if (mint.value) {
    console.log("Mint already exists");
    return mintKeypair.address;
  }

  const space = getMintSize();

  const instructions = [
    getCreateAccountInstruction({
      space,
      lamports: getMinimumBalanceForRentExemption(space),
      newAccount: mintKeypair,
      payer,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeMintInstruction(
      {
        mint: mintKeypair.address,
        mintAuthority: authority.address,
        freezeAuthority: authority.address,
        decimals: 6,
      },
      {
        programAddress: TOKEN_PROGRAM_ADDRESS,
      }
    ),
  ];

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions,
    description: "Generate Mint",
  });

  return mintKeypair.address;
}

async function createAssociatedTokenAccount({
  client,
  payer,
  mint,
  owner,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  mint: Address;
  owner: Address;
}): Promise<Address> {
  const [ata] = await findAssociatedTokenPda({
    mint: mint,
    owner: owner,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const instruction = getCreateAssociatedTokenIdempotentInstruction({
    payer,
    ata,
    mint: mint,
    owner,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [instruction],
    description: "Create Associated Token Account",
  });

  return ata;
}

async function signAndSerializeTransaction({
  client,
  payer,
  signers,
  instructions,
  description,
}: {
  client: SolanaClient;
  payer: TransactionSigner;
  signers: CryptoKeyPair[];
  instructions: Instruction[];
  description: string;
}): Promise<Transaction> {
  try {
    const computeUnitLimit = 200_000;

    const serializedTx = await pipe(
      await createDefaultTransaction(client, payer, computeUnitLimit),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
      (tx) => compileTransaction(tx),
      (tx) => partiallySignTransaction(signers, tx)
    );
    return serializedTx;
  } catch (error) {
    throw new Error(
      `Failed to ${description.toLowerCase()}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function accountExists({
  client,
  address,
}: {
  client: SolanaClient;
  address: Address;
}): Promise<boolean> {
  try {
    const account = await client.rpc.getAccountInfo(address).send();
    return account.value !== null;
  } catch {
    return false;
  }
}

export {
  accountExists,
  getPaymentAccount,
  loadKeypair,
  generateMint,
  getNextOrderId,
  signAndSerializeTransaction,
  createAssociatedTokenAccount,
};
