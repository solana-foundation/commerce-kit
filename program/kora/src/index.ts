#!/usr/bin/env ts-node

/**
 * Test gasless transaction flow via Kora
 */

import {
  Address,
  createSolanaClient,
  generateKeyPairSigner,
  KeyPairSigner,
  ProgramDerivedAddress,
  SolanaClient,
  Transaction,
} from "gill";
import {
  loadKeypair,
  generateMint,
  createAssociatedTokenAccount,
  signAndSerializeTransaction,
  accountExists,
  getNextOrderId,
  getPaymentAccount,
} from "./utils";
import {
  assertGetOrCreateMerchant,
  assertGetOrCreateMerchantOperatorConfig,
  assertGetOrCreateOperator,
} from "../../clients/typescript/tests/integration/helpers/state-utils";
import {
  mintToOwner,
  generateManyTokenAccounts,
} from "../../clients/typescript/tests/integration/helpers/tokens";
import { setupWallets } from "../../clients/typescript/tests/integration/helpers/transactions";
import {
  findOperatorPda,
  findMerchantPda,
  findMerchantOperatorConfigPda,
  findPaymentPda,
  FeeType,
  getMakePaymentInstruction,
} from "../../clients/typescript/src/generated";
import {
  findAssociatedTokenPda,
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
  getTransferInstruction,
} from "gill/programs";
import { signTransactionIfPaidWithKora } from "./kora-utils";

const KORA_ENDPOINT = "http://localhost:8080";

const MERCHANT_OPERATOR_VERSION = 1;
const OPERATOR_FEE = 0n;
const FEE_TYPE = FeeType.Bps;
const MINT_DECIMALS = 10 ** 6;

type TestSetup = {
  solanaClient: SolanaClient;
  // Signers
  koraOperatorSigner: KeyPairSigner;
  merchantSigner: KeyPairSigner;
  buyerSigner: KeyPairSigner;
  // Associated Token Accounts
  buyerAta: Address;
  koraOperatorSignerATA: Address;
  // Mints
  mintAddress: Address;
  // PDAs
  merchantPda: ProgramDerivedAddress;
  operatorPda: ProgramDerivedAddress;
  merchantOperatorConfigPda: ProgramDerivedAddress;
  paymentPda: ProgramDerivedAddress;
  // Configs
  orderId: number;
  version: number;
};

let testSetup: TestSetup;

async function setupTest(): Promise<TestSetup> {
  console.log("🚀 Starting basic test setup...");

  const solanaClient = createSolanaClient({
    urlOrMoniker: "localnet",
  });

  console.log("🔍 Setting up wallets & airdropping...");

  const koraOperatorSigner = await loadKeypair("./keys/kora-operator.json");
  const merchantSigner = await loadKeypair("./keys/commerce-merchant.json");
  const mintKeypair = await loadKeypair("./keys/test-mint.json");
  const buyerSigner = await generateKeyPairSigner();

  // Do not give lamports to buyer, as it will use Kora
  await setupWallets(solanaClient, [koraOperatorSigner, merchantSigner]);

  console.log("💰 Creating test mint and minting tokens to buyer...");

  await generateMint({
    client: solanaClient,
    payer: koraOperatorSigner,
    authority: koraOperatorSigner,
    mintKeypair,
  });
  const buyerAta = await mintToOwner({
    client: solanaClient,
    payer: koraOperatorSigner,
    mint: mintKeypair.address,
    authority: koraOperatorSigner,
    owner: buyerSigner.address,
    amount: 1000 * MINT_DECIMALS, // 1000 tokens with 6 decimals
  });

  console.log("💰 Getting the PDAs...");

  const [operatorPda, operatorBump] = await findOperatorPda({
    owner: koraOperatorSigner.address,
  });
  const [merchantPda, merchantBump] = await findMerchantPda({
    owner: merchantSigner.address,
  });
  const [merchantOperatorConfigPda, merchantOperatorConfigBump] =
    await findMerchantOperatorConfigPda({
      merchant: merchantPda,
      operator: operatorPda,
      version: MERCHANT_OPERATOR_VERSION,
    });

  const orderId = await getNextOrderId(solanaClient, merchantOperatorConfigPda);

  const [paymentPda, paymentBump] = await findPaymentPda({
    merchantOperatorConfig: merchantOperatorConfigPda,
    buyer: buyerSigner.address,
    mint: mintKeypair.address,
    orderId,
  });

  console.log("🔍 Generating Associated Token Accounts...");

  const koraOperatorSignerATA = await createAssociatedTokenAccount({
    client: solanaClient,
    payer: koraOperatorSigner,
    mint: mintKeypair.address,
    owner: koraOperatorSigner.address,
  });

  return {
    solanaClient,
    koraOperatorSigner,
    merchantSigner,
    buyerSigner,
    mintAddress: mintKeypair.address,
    buyerAta,
    koraOperatorSignerATA,
    merchantPda: [merchantPda, merchantBump],
    operatorPda: [operatorPda, operatorBump],
    merchantOperatorConfigPda: [
      merchantOperatorConfigPda,
      merchantOperatorConfigBump,
    ],
    paymentPda: [paymentPda, paymentBump],
    orderId,
    version: MERCHANT_OPERATOR_VERSION,
  };
}

async function setupCommerceAccount({
  solanaClient,
  testSetup,
}: {
  solanaClient: SolanaClient;
  testSetup: TestSetup;
}) {
  console.log("🔍 Setting up Commerce Account...");

  await generateManyTokenAccounts({
    client: solanaClient,
    payer: testSetup.koraOperatorSigner,
    mint: testSetup.mintAddress,
    owners: [
      testSetup.buyerSigner.address,
      testSetup.merchantSigner.address,
      testSetup.koraOperatorSigner.address,
      testSetup.merchantPda[0],
      testSetup.operatorPda[0],
      testSetup.merchantOperatorConfigPda[0],
    ],
  });

  const operatorExists = await accountExists({
    client: solanaClient,
    address: testSetup.operatorPda[0],
  });
  if (!operatorExists) {
    await assertGetOrCreateOperator({
      client: solanaClient,
      payer: testSetup.koraOperatorSigner,
      owner: testSetup.koraOperatorSigner,
      failIfExists: false,
    });
  }

  const merchantExists = await accountExists({
    client: solanaClient,
    address: testSetup.merchantPda[0],
  });
  if (!merchantExists) {
    await assertGetOrCreateMerchant({
      client: solanaClient,
      payer: testSetup.koraOperatorSigner,
      authority: testSetup.merchantSigner,
      settlementWallet: testSetup.merchantSigner,
      failIfExists: false,
    });
  }

  const merchantOperatorConfigExists = await accountExists({
    client: solanaClient,
    address: testSetup.merchantOperatorConfigPda[0],
  });
  if (!merchantOperatorConfigExists) {
    await assertGetOrCreateMerchantOperatorConfig({
      client: solanaClient,
      payer: testSetup.koraOperatorSigner,
      authority: testSetup.merchantSigner,
      merchantPda: testSetup.merchantPda[0],
      operatorPda: testSetup.operatorPda[0],
      version: testSetup.version,
      operatorFee: OPERATOR_FEE,
      feeType: FEE_TYPE,
      currentOrderId: testSetup.orderId - 1,
      policies: [],
      acceptedCurrencies: [testSetup.mintAddress],
      failIfExists: false,
    });
  }
}

async function makeGaslessPayment({
  solanaClient,
  testSetup,
}: {
  solanaClient: SolanaClient;
  testSetup: TestSetup;
}): Promise<Transaction> {
  console.log("🔍 Making gasless payment...");

  const merchantEscrowAta = await findAssociatedTokenPda({
    mint: testSetup.mintAddress,
    owner: testSetup.merchantPda[0],
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const merchantSettlementAta = await findAssociatedTokenPda({
    mint: testSetup.mintAddress,
    owner: testSetup.merchantSigner.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  // Add token transfer instruction for Kora fee payment
  const koraFeeAmount = 10002n; // Amount Kora expects for fees (in token base units)

  const tokenTransferIx = getTransferInstruction(
    {
      source: testSetup.buyerAta,
      destination: testSetup.koraOperatorSignerATA,
      authority: testSetup.buyerSigner,
      amount: koraFeeAmount,
    },
    {
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }
  );

  const paymentIx = getMakePaymentInstruction({
    payer: testSetup.koraOperatorSigner,
    payment: testSetup.paymentPda[0],
    operatorAuthority: testSetup.koraOperatorSigner,
    buyer: testSetup.buyerSigner,
    operator: testSetup.operatorPda[0],
    merchant: testSetup.merchantPda[0],
    merchantOperatorConfig: testSetup.merchantOperatorConfigPda[0],
    mint: testSetup.mintAddress,
    buyerAta: testSetup.buyerAta,
    merchantEscrowAta: merchantEscrowAta[0],
    merchantSettlementAta: merchantSettlementAta[0],
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    systemProgram: SYSTEM_PROGRAM_ADDRESS,
    orderId: testSetup.orderId,
    amount: 20 * MINT_DECIMALS,
    bump: testSetup.paymentPda[1],
  });

  return signAndSerializeTransaction({
    client: solanaClient,
    payer: testSetup.koraOperatorSigner,
    signers: [testSetup.buyerSigner.keyPair],
    instructions: [tokenTransferIx, paymentIx],
    description: "Create gasless payment with token transfer for fees",
  });
}

async function main() {
  testSetup = await setupTest();

  await setupCommerceAccount({
    solanaClient: testSetup.solanaClient,
    testSetup,
  });

  const signedTx = await makeGaslessPayment({
    solanaClient: testSetup.solanaClient,
    testSetup,
  });

  console.log("🔍 Sending transaction to kora to be signed...");

  const { signedTransaction } = await signTransactionIfPaidWithKora({
    koraEndpoint: KORA_ENDPOINT,
    transaction: signedTx,
  });

  console.log("🔍 Transaction signed by Kora!");

  const sendTx = await testSetup.solanaClient.rpc
    .sendTransaction(signedTransaction, {
      encoding: "base64",
    })
    .send();

  console.log("🔍 Transaction sent to solana! Signature: ", sendTx);

  // Wait for transaction to be processed
  await new Promise((resolve) => setTimeout(resolve, 5_000));

  const paymentAccount = await getPaymentAccount(
    testSetup.solanaClient,
    testSetup.paymentPda[0]
  );
  console.log("🔍 Payment account:", paymentAccount);

  console.log("🎉 Transaction sent successfully!");
}

// Jest test wrapper
if (typeof describe !== "undefined") {
  // Running in Jest
  describe("Kora Gasless Transaction Integration", () => {
    it("should complete gasless payment flow", async () => {
      await main();
    }, 60000); // 60 second timeout
  });
} else {
  // Running directly
  main().catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
}
