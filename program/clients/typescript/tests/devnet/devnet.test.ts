import {
  findPaymentPda,
  FeeType,
  getMakePaymentInstruction,
  COMMERCE_PROGRAM_PROGRAM_ADDRESS,
} from "../../src/generated";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
  getMintToInstruction,
} from "gill/programs";
import { createSolanaClient, lamports } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  assertGetOrCreateMerchant,
  assertGetOrCreateMerchantOperatorConfig,
  assertGetOrCreateOperator,
} from "../integration/helpers/state-utils";
import {
  accountExists,
  generateMint,
  getNextOrderId,
  createAssociatedTokenAccount,
} from "../../../../kora/src/utils";
import { sendAndConfirmInstructions } from "../integration/helpers/transactions";

const KEYPAIR_FILE = "./tests/devnet/devnet-test-keypair.json";
const MINT_KEYPAIR_FILE = "./tests/devnet/test-mint-keypair.json";
const DEVNET_RPC_URL = "https://api.devnet.solana.com";
const USDC_DECIMALS = 6;
const TEST_AMOUNT = 1 * 10 ** USDC_DECIMALS; // 1 USDC
const MINT_AMOUNT = 1000 * 10 ** USDC_DECIMALS; // 1000 USDC

async function main() {
  console.log("🚀 Starting Commerce Program Test on Devnet");

  let signer;
  try {
    signer = await loadKeypairSignerFromFile(KEYPAIR_FILE);
    console.log("✅ Loaded keypair from", KEYPAIR_FILE);
  } catch (error) {
    console.log("❌ Could not load keypair from", KEYPAIR_FILE);
    console.log(
      "Please create a keypair file with: solana-keygen new -o",
      KEYPAIR_FILE
    );
    process.exit(1);
  }

  console.log("🔑 Authority:", signer.address);

  const client = createSolanaClient({
    urlOrMoniker: DEVNET_RPC_URL,
  });

  const balance = await client.rpc.getBalance(signer.address).send();
  const balanceInSol = Number(balance.value) / 10 ** 9;
  console.log("💰 Balance:", balanceInSol, "SOL");

  if (balanceInSol < 1) {
    console.log("🚰 Requesting airdrop...");
    try {
      await client.rpc
        .requestAirdrop(signer.address, lamports(2_000_000_000n))
        .send();

      console.log("⏳ Waiting for airdrop confirmation...");
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      console.log("✅ Airdrop complete");
    } catch (error) {
      console.error("❌ Airdrop failed:", error);
      console.log("Please ensure you have enough SOL on devnet");
      process.exit(1);
    }
  }

  let mintKeypair;
  try {
    mintKeypair = await loadKeypairSignerFromFile(MINT_KEYPAIR_FILE);
    console.log("✅ Loaded mint keypair from", MINT_KEYPAIR_FILE);
  } catch (error) {
    console.log("❌ Could not load mint keypair from", MINT_KEYPAIR_FILE);
    process.exit(1);
  }

  console.log("🪙 Test mint:", mintKeypair.address);

  const mintExists = await accountExists({
    client,
    address: mintKeypair.address,
  });
  let mintAddress;

  if (!mintExists) {
    console.log("📝 Creating test mint...");
    mintAddress = await generateMint({
      client,
      payer: signer,
      authority: signer,
      mintKeypair,
    });
    console.log("✅ Created test mint");
  } else {
    mintAddress = mintKeypair.address;
    console.log("✅ Using existing test mint");
  }

  // Create or get merchant
  console.log("📝 Getting or creating merchant...");
  const [merchantPda] = await assertGetOrCreateMerchant({
    client,
    payer: signer,
    authority: signer,
    settlementWallet: signer,
    failIfExists: true,
  });
  console.log("✅ Merchant PDA:", merchantPda);

  // Create or get operator
  console.log("📝 Getting or creating operator...");
  const [operatorPda] = await assertGetOrCreateOperator({
    client,
    payer: signer,
    owner: signer,
    failIfExists: true,
  });
  console.log("✅ Operator PDA:", operatorPda);

  // Create or get merchant operator config
  console.log("📝 Getting or creating merchant operator config...");
  const [merchantOperatorConfigPda] =
    await assertGetOrCreateMerchantOperatorConfig({
      client,
      payer: signer,
      authority: signer,
      merchantPda,
      operatorPda,
      currentOrderId: 0,
      version: 1,
      operatorFee: BigInt(100),
      feeType: FeeType.Bps,
      policies: [],
      acceptedCurrencies: [mintAddress],
      failIfExists: true,
    });
  console.log("✅ Merchant Operator Config PDA:", merchantOperatorConfigPda);

  // Create buyer ATA and mint tokens
  const [buyerAta] = await findAssociatedTokenPda({
    mint: mintAddress,
    owner: signer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const buyerAtaExists = await accountExists({ client, address: buyerAta });
  if (!buyerAtaExists) {
    console.log("📝 Creating buyer ATA...");
    await createAssociatedTokenAccount({
      client,
      payer: signer,
      mint: mintAddress,
      owner: signer.address,
    });
  }

  // Create merchant escrow ATA (owned by merchant PDA)
  const [merchantEscrowAta] = await findAssociatedTokenPda({
    mint: mintAddress,
    owner: merchantPda,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const merchantEscrowAtaExists = await accountExists({
    client,
    address: merchantEscrowAta,
  });
  if (!merchantEscrowAtaExists) {
    console.log("📝 Creating merchant escrow ATA...");
    await createAssociatedTokenAccount({
      client,
      payer: signer,
      mint: mintAddress,
      owner: merchantPda,
    });
  }

  // Create merchant settlement ATA (owned by settlement wallet = signer)
  const [merchantSettlementAta] = await findAssociatedTokenPda({
    mint: mintAddress,
    owner: signer.address, // settlement wallet
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const merchantSettlementAtaExists = await accountExists({
    client,
    address: merchantSettlementAta,
  });
  if (!merchantSettlementAtaExists) {
    console.log("📝 Creating merchant settlement ATA...");
    await createAssociatedTokenAccount({
      client,
      payer: signer,
      mint: mintAddress,
      owner: signer.address,
    });
  }

  // Mint tokens to buyer
  console.log("🪙 Minting tokens to buyer...");
  const mintToInstruction = getMintToInstruction(
    {
      mint: mintAddress,
      token: buyerAta,
      mintAuthority: signer,
      amount: BigInt(MINT_AMOUNT),
    },
    {
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }
  );

  await sendAndConfirmInstructions({
    client,
    payer: signer,
    instructions: [mintToInstruction],
    description: "Mint tokens to buyer",
  });

  // Get next order ID
  const orderId = await getNextOrderId(client, merchantOperatorConfigPda);
  console.log("🔢 Next order ID:", orderId);

  // Make payment
  console.log("💸 Making payment...");
  const [paymentPda, bump] = await findPaymentPda({
    merchantOperatorConfig: merchantOperatorConfigPda,
    buyer: signer.address,
    mint: mintAddress,
    orderId,
  });

  try {
    const payment = getMakePaymentInstruction({
      payer: signer,
      payment: paymentPda,
      operatorAuthority: signer,
      buyer: signer,
      operator: operatorPda,
      merchant: merchantPda,
      merchantOperatorConfig: merchantOperatorConfigPda,
      mint: mintAddress,
      buyerAta,
      merchantEscrowAta,
      merchantSettlementAta,
      orderId,
      amount: BigInt(TEST_AMOUNT),
      bump,
      program: COMMERCE_PROGRAM_PROGRAM_ADDRESS,
    });

    await sendAndConfirmInstructions({
      client,
      payer: signer,
      instructions: [payment],
      description: "Make Payment",
    });

    console.log("✅ Payment successful!");
    console.log("📄 Payment PDA:", paymentPda);
    console.log("💰 Amount:", TEST_AMOUNT / 10 ** USDC_DECIMALS, "USDC");
    console.log("🆔 Order ID:", orderId);
  } catch (error) {
    console.error("❌ Payment failed:", error);
    console.log("\n🔍 Error details:");
    if (error instanceof Error) {
      console.log("Message:", error.message);
      console.log("Stack:", error.stack);
    }
  }
}

// Jest test wrapper
if (typeof describe !== "undefined") {
  // Running in Jest
  describe("Devnet Test", () => {
    it("should complete payment flow", async () => {
      await main();
      // @ts-ignore - Jest timeout, this is the proper way
    }, 60000);
  });
} else {
  // Running directly
  main().catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
}
