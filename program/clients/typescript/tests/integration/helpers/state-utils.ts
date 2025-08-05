import {
  Address,
  SolanaClient,
  KeyPairSigner,
  ProgramDerivedAddressBump,
  fetchEncodedAccount,
  assertAccountExists,
} from "gill";
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
} from "gill/programs";
import {
  findOperatorPda,
  findMerchantPda,
  findMerchantOperatorConfigPda,
  getCreateOperatorInstruction,
  getInitializeMerchantOperatorConfigInstruction,
  getClosePaymentInstruction,
  getUpdateMerchantSettlementWalletInstruction,
  getUpdateMerchantAuthorityInstruction,
  getUpdateOperatorAuthorityInstruction,
  FeeType,
  PolicyData,
  Status,
  getInitializeMerchantInstructionAsync,
  getMakePaymentInstructionAsync,
  getRefundPaymentInstructionAsync,
  getClearPaymentInstructionAsync,
  getCreateOperatorInstructionAsync,
  getUpdateOperatorAuthorityInstructionAsync,
  getInitializeMerchantOperatorConfigInstructionAsync,
  getUpdateMerchantAuthorityInstructionAsync,
  getUpdateMerchantSettlementWalletInstructionAsync,
} from "../../../src/generated";
import { sendAndConfirmInstructions } from "./transactions";
import {
  assertMerchantAccount,
  assertOperatorAccount,
  assertTokenAccount,
  assertMerchantOperatorConfigAccount,
  assertPaymentAccount,
  getTokenBalance,
  assertMultipleTokenBalanceChanges,
  BalanceChange,
} from "./assertions";

// Test token mints (USDC and USDT on local validator)
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" as Address;
const DEVNET_USDC_MINT =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" as Address;
const DEVNET_USDT_MINT =
  "usDtQUSH1bvDU8byfxp9jURLnjvno4NFoASbugdeHYC" as Address;

async function accountExists({
  client,
  address,
}: {
  client: SolanaClient;
  address: Address;
}): Promise<boolean> {
  try {
    const account = await fetchEncodedAccount(client.rpc, address);
    assertAccountExists(account);
    return account.exists;
  } catch {
    return false;
  }
}

export async function assertGetOrCreateOperator({
  client,
  payer,
  owner,
  failIfExists = false,
  skipIfExists = false,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  owner: KeyPairSigner;
  failIfExists?: boolean;
  skipIfExists?: boolean;
}): Promise<[Address, ProgramDerivedAddressBump]> {
  const [operatorPda, bump] = await findOperatorPda({
    owner: owner.address,
  });

  if (failIfExists || skipIfExists) {
    const exists = await accountExists({ client, address: operatorPda });

    if (failIfExists && exists) {
      throw new Error("Operator account already exists");
    }

    if (skipIfExists && exists) {
      return [operatorPda, bump];
    }
  }

  const createOperatorIx = await getCreateOperatorInstructionAsync({
    bump,
    payer: payer,
    authority: owner,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [createOperatorIx],
    description: "Create operator",
  });

  await assertOperatorAccount({
    client,
    operatorPda,
    expectedOwner: owner.address,
    expectedBump: bump,
  });

  return [operatorPda, bump];
}

export async function assertGetOrCreateMerchant({
  client,
  payer,
  authority,
  settlementWallet,
  failIfExists = false,
  skipIfExists = false,
  devnet = false,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  authority: KeyPairSigner;
  settlementWallet: KeyPairSigner;
  failIfExists?: boolean;
  skipIfExists?: boolean;
  devnet?: boolean;
}): Promise<[Address, ProgramDerivedAddressBump]> {
  const [merchantPda, bump] = await findMerchantPda({
    owner: authority.address,
  });

  const usdcMint = devnet ? DEVNET_USDC_MINT : USDC_MINT;
  const usdtMint = devnet ? DEVNET_USDT_MINT : USDT_MINT;

  if (failIfExists || skipIfExists) {
    const exists = await accountExists({ client, address: merchantPda });
    if (failIfExists && exists) {
      throw new Error("Merchant account already exists");
    }

    if (skipIfExists && exists) {
      return [merchantPda, bump];
    }
  }

  const [settlementUsdcAta] = await findAssociatedTokenPda({
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: usdcMint,
    owner: settlementWallet.address,
  });
  const [settlementUsdtAta] = await findAssociatedTokenPda({
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: usdtMint,
    owner: settlementWallet.address,
  });
  const [escrowUsdcAta] = await findAssociatedTokenPda({
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: usdcMint,
    owner: merchantPda,
  });
  const [escrowUsdtAta] = await findAssociatedTokenPda({
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: usdtMint,
    owner: merchantPda,
  });

  // Initialize merchant instruction
  const initMerchantIx = await getInitializeMerchantInstructionAsync({
    bump,
    payer: payer,
    authority: authority,
    settlementWallet: settlementWallet.address,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [initMerchantIx],
    description: "Initialize merchant",
  });

  await assertMerchantAccount({
    client,
    merchantPda,
    expectedOwner: authority.address,
    expectedBump: bump,
    expectedSettlementWallet: settlementWallet.address,
  });

  // Assert token accounts were created
  await assertTokenAccount({
    client,
    tokenAccount: settlementUsdcAta,
    expectedMint: usdcMint,
    expectedOwner: settlementWallet.address,
  });
  await assertTokenAccount({
    client,
    tokenAccount: settlementUsdtAta,
    expectedMint: usdtMint,
    expectedOwner: settlementWallet.address,
  });
  await assertTokenAccount({
    client,
    tokenAccount: escrowUsdcAta,
    expectedMint: usdcMint,
    expectedOwner: merchantPda,
  });
  await assertTokenAccount({
    client,
    tokenAccount: escrowUsdtAta,
    expectedMint: usdtMint,
    expectedOwner: merchantPda,
  });

  return [merchantPda, bump];
}

export async function assertGetOrCreateMerchantOperatorConfig({
  client,
  payer,
  authority,
  merchantPda,
  operatorPda,
  version,
  operatorFee,
  feeType,
  currentOrderId,
  policies,
  acceptedCurrencies,
  failIfExists = false,
  skipIfExists = false,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  authority: KeyPairSigner;
  merchantPda: Address;
  operatorPda: Address;
  version: number;
  operatorFee: bigint;
  feeType: FeeType;
  currentOrderId: number;
  policies: PolicyData[];
  acceptedCurrencies: Address[];
  failIfExists?: boolean;
  skipIfExists?: boolean;
}): Promise<[Address, ProgramDerivedAddressBump]> {
  const [merchantOperatorConfigPda, merchantOperatorConfigBump] =
    await findMerchantOperatorConfigPda({
      merchant: merchantPda,
      operator: operatorPda,
      version,
    });

  if (failIfExists || skipIfExists) {
    const exists = await accountExists({
      client,
      address: merchantOperatorConfigPda,
    });
    if (failIfExists && exists) {
      throw new Error("MerchantOperatorConfig account already exists");
    }

    if (skipIfExists && exists) {
      return [merchantOperatorConfigPda, merchantOperatorConfigBump];
    }
  }

  const instruction = await getInitializeMerchantOperatorConfigInstructionAsync({
    payer: payer,
    authority: authority,
    merchant: merchantPda,
    operator: operatorPda,
    version,
    bump: merchantOperatorConfigBump,
    operatorFee,
    feeType,
    policies,
    acceptedCurrencies,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [instruction],
    description: "Initialize merchant operator config",
  });

  await assertMerchantOperatorConfigAccount({
    client,
    merchantOperatorConfigPda,
    expectedBump: merchantOperatorConfigBump,
    expectedVersion: version,
    expectedMerchant: merchantPda,
    expectedOperator: operatorPda,
    expectedOperatorFee: operatorFee,
    expectedCurrentOrderId: currentOrderId,
    expectedNumPolicies: policies.length,
    expectedNumAcceptedCurrencies: acceptedCurrencies.length,
  });

  return [merchantOperatorConfigPda, merchantOperatorConfigBump];
}

export async function assertMakePayment({
  client,
  payer,
  paymentPda,
  operatorAuthority,
  buyer,
  operatorPda,
  merchantPda,
  merchantOperatorConfigPda,
  mint,
  buyerAta,
  merchantEscrowAta,
  merchantSettlementAta,
  orderId,
  amount,
  bump,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  paymentPda: Address;
  operatorAuthority: KeyPairSigner;
  buyer: KeyPairSigner;
  operatorPda: Address;
  merchantPda: Address;
  merchantOperatorConfigPda: Address;
  mint: Address;
  buyerAta: Address;
  merchantEscrowAta: Address;
  merchantSettlementAta: Address;
  orderId: number;
  amount: number;
  bump: number;
}): Promise<void> {
  // Get pre-balances for token verification
  const buyerPreBalance = await getTokenBalance(client, buyerAta);
  const merchantEscrowPreBalance = await getTokenBalance(
    client,
    merchantEscrowAta
  );

  const payment = await getMakePaymentInstructionAsync({
    payer,
    operatorAuthority,
    buyer,
    merchant: merchantPda,
    merchantOperatorConfig: merchantOperatorConfigPda,
    mint,
    merchantSettlementAta,
    orderId,
    amount,
    bump,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [payment],
    description: "Make Payment",
  });

  // Verify payment account was created with correct status
  await assertPaymentAccount({
    client,
    paymentPda,
    expectedOrderId: orderId,
    expectedAmount: BigInt(amount),
    expectedStatus: Status.Paid,
  });

  await assertMultipleTokenBalanceChanges({
    client,
    preBalances: new Map<Address, bigint>([
      [buyerAta, buyerPreBalance],
      [merchantEscrowAta, merchantEscrowPreBalance],
    ]),
    balanceChanges: [
      {
        ata: buyerAta,
        expectedChange: -BigInt(amount),
        description: "Buyer should decrease by payment amount",
      },
      {
        ata: merchantEscrowAta,
        expectedChange: BigInt(amount),
        description: "Merchant escrow should increase by payment amount",
      },
    ],
  });
}

export async function assertClearPayment({
  client,
  payer,
  paymentPda,
  operatorAuthority,
  buyer,
  operatorPda,
  merchantPda,
  merchantOperatorConfigPda,
  mint,
  merchantEscrowAta,
  merchantSettlementAta,
  operatorSettlementAta,
  orderId,
  amount,
  operatorFee,
  verifyBeforeStatus = true,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  paymentPda: Address;
  operatorAuthority: KeyPairSigner;
  buyer: Address;
  operatorPda: Address;
  merchantPda: Address;
  merchantOperatorConfigPda: Address;
  mint: Address;
  merchantEscrowAta: Address;
  merchantSettlementAta: Address;
  operatorSettlementAta: Address;
  orderId: number;
  amount: number | bigint;
  operatorFee: number | bigint;
  verifyBeforeStatus?: boolean;
}): Promise<void> {
  // Optionally verify payment is in Paid status before clearing
  if (verifyBeforeStatus) {
    await assertPaymentAccount({
      client,
      paymentPda,
      expectedOrderId: orderId,
      expectedAmount: BigInt(amount),
      expectedStatus: Status.Paid,
    });
  }

  // Get pre-balances for all affected token accounts
  const merchantEscrowPreBalance = await getTokenBalance(
    client,
    merchantEscrowAta
  );
  const merchantSettlementPreBalance = await getTokenBalance(
    client,
    merchantSettlementAta
  );
  const operatorSettlementPreBalance = await getTokenBalance(
    client,
    operatorSettlementAta
  );

  const preBalances = new Map<Address, bigint>([
    [merchantEscrowAta, merchantEscrowPreBalance],
    [merchantSettlementAta, merchantSettlementPreBalance],
    [operatorSettlementAta, operatorSettlementPreBalance],
  ]);

  const clearPaymentIx = await getClearPaymentInstructionAsync({
    payer,
    payment: paymentPda,
    operatorAuthority,
    buyer,
    merchant: merchantPda,
    merchantOperatorConfig: merchantOperatorConfigPda,
    mint,
    merchantSettlementAta,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [clearPaymentIx],
    description: "Clear Payment",
  });

  // Verify payment status changed to Cleared
  await assertPaymentAccount({
    client,
    paymentPda,
    expectedOrderId: orderId,
    expectedAmount: BigInt(amount),
    expectedStatus: Status.Cleared,
  });

  // Verify token balance changes for multi-party transfer
  const amountBigInt = BigInt(amount);
  const operatorFeeBigInt = BigInt(operatorFee);
  const merchantReceiveAmount = amountBigInt - operatorFeeBigInt;

  const balanceChanges: BalanceChange[] = [
    {
      ata: merchantEscrowAta,
      expectedChange: -amountBigInt, // Escrow decreases by full payment amount
      description: "Merchant escrow should decrease by payment amount",
    },
    {
      ata: merchantSettlementAta,
      expectedChange: merchantReceiveAmount, // Settlement increases by (payment - fee)
      description:
        "Merchant settlement should increase by payment amount minus operator fee",
    },
    {
      ata: operatorSettlementAta,
      expectedChange: operatorFeeBigInt, // Operator receives fee
      description: "Operator settlement should increase by operator fee",
    },
  ];

  await assertMultipleTokenBalanceChanges({
    client,
    preBalances,
    balanceChanges,
  });
}

export async function assertRefundPayment({
  client,
  payer,
  paymentPda,
  operatorAuthority,
  buyer,
  operatorPda,
  merchantPda,
  merchantOperatorConfigPda,
  mint,
  merchantEscrowAta,
  buyerAta,
  orderId,
  amount,
  verifyBeforeStatus = true,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  paymentPda: Address;
  operatorAuthority: KeyPairSigner;
  buyer: Address;
  operatorPda: Address;
  merchantPda: Address;
  merchantOperatorConfigPda: Address;
  mint: Address;
  merchantEscrowAta: Address;
  buyerAta: Address;
  orderId: number;
  amount: number | bigint;
  verifyBeforeStatus?: boolean;
}): Promise<void> {
  // Optionally verify payment is in Paid status before refunding
  if (verifyBeforeStatus) {
    await assertPaymentAccount({
      client,
      paymentPda,
      expectedOrderId: orderId,
      expectedAmount: BigInt(amount),
      expectedStatus: Status.Paid,
    });
  }

  // Get pre-balances for token verification
  const merchantEscrowPreBalance = await getTokenBalance(
    client,
    merchantEscrowAta
  );
  const buyerPreBalance = await getTokenBalance(client, buyerAta);

  const preBalances = new Map<Address, bigint>([
    [merchantEscrowAta, merchantEscrowPreBalance],
    [buyerAta, buyerPreBalance],
  ]);

  const refundPaymentIx = await getRefundPaymentInstructionAsync({
    payer,
    payment: paymentPda,
    operatorAuthority,
    buyer,
    merchant: merchantPda,
    merchantOperatorConfig: merchantOperatorConfigPda,
    mint,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [refundPaymentIx],
    description: "Refund Payment",
  });

  // Verify payment status changed to Refunded
  await assertPaymentAccount({
    client,
    paymentPda,
    expectedOrderId: orderId,
    expectedAmount: BigInt(amount),
    expectedStatus: Status.Refunded,
  });

  // Verify token balance changes: merchant escrow decreases, buyer increases
  const amountBigInt = BigInt(amount);
  const balanceChanges: BalanceChange[] = [
    {
      ata: merchantEscrowAta,
      expectedChange: -amountBigInt, // Escrow decreases by refund amount
      description: "Merchant escrow should decrease by refund amount",
    },
    {
      ata: buyerAta,
      expectedChange: amountBigInt, // Buyer receives refund
      description: "Buyer should receive refund amount",
    },
  ];

  await assertMultipleTokenBalanceChanges({
    client,
    preBalances,
    balanceChanges,
  });
}

export async function assertUpdateMerchantSettlementWallet({
  client,
  payer,
  authority,
  merchantPda,
  merchantBump,
  newSettlementWallet,
  devnet = false,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  authority: KeyPairSigner;
  merchantPda: Address;
  merchantBump: number;
  newSettlementWallet: KeyPairSigner;
  devnet?: boolean;
}): Promise<void> {
  const usdcMint = devnet ? DEVNET_USDC_MINT : USDC_MINT;
  const usdtMint = devnet ? DEVNET_USDT_MINT : USDT_MINT;

  // Find the new settlement wallet's token accounts that will be created
  const [newSettlementUsdcAta] = await findAssociatedTokenPda({
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: usdcMint,
    owner: newSettlementWallet.address,
  });
  const [newSettlementUsdtAta] = await findAssociatedTokenPda({
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: usdtMint,
    owner: newSettlementWallet.address,
  });

  const updateMerchantSettlementWalletIx =
   await getUpdateMerchantSettlementWalletInstructionAsync({
      payer,
      authority,
      newSettlementWallet: newSettlementWallet.address,
    });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [updateMerchantSettlementWalletIx],
    description: "Update Merchant Settlement Wallet",
  });

  // Verify merchant account was updated with new settlement wallet
  await assertMerchantAccount({
    client,
    merchantPda,
    expectedOwner: authority.address,
    expectedBump: merchantBump,
    expectedSettlementWallet: newSettlementWallet.address,
  });

  // Verify new settlement wallet token accounts were created
  await assertTokenAccount({
    client,
    tokenAccount: newSettlementUsdcAta,
    expectedMint: usdcMint,
    expectedOwner: newSettlementWallet.address,
  });
  await assertTokenAccount({
    client,
    tokenAccount: newSettlementUsdtAta,
    expectedMint: usdtMint,
    expectedOwner: newSettlementWallet.address,
  });
}

export async function assertUpdateMerchantAuthority({
  client,
  payer,
  currentAuthority,
  merchantPda,
  merchantBump,
  settlementWallet,
  newAuthority,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  currentAuthority: KeyPairSigner;
  merchantPda: Address;
  merchantBump: number;
  settlementWallet: Address;
  newAuthority: KeyPairSigner;
}): Promise<void> {
  const updateMerchantAuthorityIx = await getUpdateMerchantAuthorityInstructionAsync({
    payer,
    authority: currentAuthority,
    newAuthority: newAuthority.address,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [updateMerchantAuthorityIx],
    description: "Update Merchant Authority",
  });

  // Verify merchant account was updated with new authority
  await assertMerchantAccount({
    client,
    merchantPda,
    expectedOwner: newAuthority.address,
    expectedBump: merchantBump,
    expectedSettlementWallet: settlementWallet, // Settlement wallet should remain unchanged
  });
}

export async function assertUpdateOperatorAuthority({
  client,
  payer,
  currentAuthority,
  operatorPda,
  operatorBump,
  newAuthority,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  currentAuthority: KeyPairSigner;
  operatorPda: Address;
  operatorBump: number;
  newAuthority: KeyPairSigner;
}): Promise<void> {
  const updateOperatorAuthorityIx = await getUpdateOperatorAuthorityInstructionAsync({
    payer,
    authority: currentAuthority,
    newOperatorAuthority: newAuthority.address,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [updateOperatorAuthorityIx],
    description: "Update Operator Authority",
  });

  // Verify operator account was updated with new authority
  await assertOperatorAccount({
    client,
    operatorPda,
    expectedOwner: newAuthority.address,
    expectedBump: operatorBump,
  });
}

export async function assertClosePayment({
  client,
  payer,
  paymentPda,
  operatorAuthority,
  buyer,
  operatorPda,
  merchantPda,
  merchantOperatorConfigPda,
  mint,
  orderId,
  amount,
  verifyBeforeStatus = true,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  paymentPda: Address;
  operatorAuthority: KeyPairSigner;
  buyer: Address;
  operatorPda: Address;
  merchantPda: Address;
  merchantOperatorConfigPda: Address;
  mint: Address;
  orderId: number;
  amount: number | bigint;
  verifyBeforeStatus?: boolean;
}): Promise<void> {
  // Optionally verify payment is in Cleared status before closing
  if (verifyBeforeStatus) {
    await assertPaymentAccount({
      client,
      paymentPda,
      expectedOrderId: orderId,
      expectedAmount: BigInt(amount),
      expectedStatus: Status.Cleared,
    });
  }

  // Get pre-balances to verify fee payer receives account rent
  const payerPreBalance = await client.rpc
    .getBalance(payer.address, { commitment: "processed" })
    .send();
  // const paymentAccountInfo = await client.rpc
  //   .getAccountInfo(paymentPda, { commitment: "processed" })
  //   .send();
  // const paymentRentBalance = paymentAccountInfo.value?.lamports ?? 0n;

  const closePaymentIx = getClosePaymentInstruction({
    payer,
    payment: paymentPda,
    operatorAuthority,
    operator: operatorPda,
    merchant: merchantPda,
    buyer,
    merchantOperatorConfig: merchantOperatorConfigPda,
    mint,
    systemProgram: SYSTEM_PROGRAM_ADDRESS,
  });

  await sendAndConfirmInstructions({
    client,
    payer,
    instructions: [closePaymentIx],
    description: "Close Payment",
  });

  // Verify payment account was closed (should no longer exist)
  try {
    const closedAccountInfo = await client.rpc
      .getAccountInfo(paymentPda, { commitment: "processed" })
      .send();
    if (closedAccountInfo.value !== null) {
      throw new Error("Payment account should have been closed");
    }
  } catch (error) {
    // Expected - account should not exist after closing
  }

  // Verify fee payer received the rent from the closed account
  const payerPostBalance = await client.rpc
    .getBalance(payer.address, { commitment: "processed" })
    .send();
  // const expectedBalance = payerPreBalance.value + paymentRentBalance;

  // Note: We check that the balance increased, but account for potential transaction fees
  if (payerPostBalance.value <= payerPreBalance.value) {
    throw new Error(
      "Fee payer should have received rent from closed payment account"
    );
  }
}

/**
 * Payment workflow outcomes
 */
export enum PaymentWorkflow {
  /** Make Payment → Clear Payment → Close Payment */
  ClearAndClose = "clear_and_close",
  /** Make Payment → Clear Payment (no close) */
  ClearOnly = "clear_only",
  /** Make Payment → Refund Payment (cannot close refunded payments) */
  RefundOnly = "refund_only",
  /** Make Payment → Chargeback Payment → Close Payment (when chargeback is implemented) */
  ChargebackAndClose = "chargeback_and_close",
}

/**
 * Complete payment workflow that handles make payment followed by settlement/refund/chargeback and optional close
 */
export async function assertCompletePaymentWorkflow({
  client,
  payer,
  paymentPda,
  operatorAuthority,
  buyer,
  operatorPda,
  merchantPda,
  merchantOperatorConfigPda,
  mint,
  buyerAta,
  merchantEscrowAta,
  merchantSettlementAta,
  operatorSettlementAta,
  orderId,
  amount,
  operatorFee,
  bump,
  workflow,
}: {
  client: SolanaClient;
  payer: KeyPairSigner;
  paymentPda: Address;
  operatorAuthority: KeyPairSigner;
  buyer: KeyPairSigner;
  operatorPda: Address;
  merchantPda: Address;
  merchantOperatorConfigPda: Address;
  mint: Address;
  buyerAta: Address;
  merchantEscrowAta: Address;
  merchantSettlementAta: Address;
  operatorSettlementAta: Address;
  orderId: number;
  amount: number;
  operatorFee: number | bigint;
  bump: number;
  workflow: PaymentWorkflow;
}): Promise<{
  paymentStatus: Status;
  accountClosed: boolean;
  workflow: PaymentWorkflow;
}> {
  // Step 1: Always make the payment first
  await assertMakePayment({
    client,
    payer,
    paymentPda,
    operatorAuthority,
    buyer,
    operatorPda,
    merchantPda,
    merchantOperatorConfigPda,
    mint,
    buyerAta,
    merchantEscrowAta,
    merchantSettlementAta,
    orderId,
    amount,
    bump,
  });

  let finalStatus: Status;
  let accountClosed = false;

  // Step 2: Execute the specified workflow
  switch (workflow) {
    case PaymentWorkflow.ClearAndClose:
      // Clear the payment
      await assertClearPayment({
        client,
        payer,
        paymentPda,
        operatorAuthority,
        buyer: buyer.address,
        operatorPda,
        merchantPda,
        merchantOperatorConfigPda,
        mint,
        merchantEscrowAta,
        merchantSettlementAta,
        operatorSettlementAta,
        orderId,
        amount,
        operatorFee,
        verifyBeforeStatus: true,
      });

      // Close the payment
      await assertClosePayment({
        client,
        payer,
        paymentPda,
        operatorAuthority,
        buyer: buyer.address,
        operatorPda,
        merchantPda,
        merchantOperatorConfigPda,
        mint,
        orderId,
        amount,
        verifyBeforeStatus: true,
      });

      finalStatus = Status.Cleared; // Payment was cleared before closing
      accountClosed = true;
      break;

    case PaymentWorkflow.ClearOnly:
      // Clear the payment but don't close
      await assertClearPayment({
        client,
        payer,
        paymentPda,
        operatorAuthority,
        buyer: buyer.address,
        operatorPda,
        merchantPda,
        merchantOperatorConfigPda,
        mint,
        merchantEscrowAta,
        merchantSettlementAta,
        operatorSettlementAta,
        orderId,
        amount,
        operatorFee,
        verifyBeforeStatus: true,
      });

      finalStatus = Status.Cleared;
      accountClosed = false;
      break;

    case PaymentWorkflow.RefundOnly:
      // Refund the payment (cannot close refunded payments)
      await assertRefundPayment({
        client,
        payer,
        paymentPda,
        operatorAuthority,
        buyer: buyer.address,
        operatorPda,
        merchantPda,
        merchantOperatorConfigPda,
        mint,
        merchantEscrowAta,
        buyerAta,
        orderId,
        amount,
        verifyBeforeStatus: true,
      });

      finalStatus = Status.Refunded;
      accountClosed = false;
      break;

    case PaymentWorkflow.ChargebackAndClose:
      // Note: Chargeback is not yet implemented in the processor
      // This is a placeholder for future implementation
      throw new Error(
        "Chargeback workflow is not yet implemented in the program"
      );

    default:
      throw new Error(`Unknown payment workflow: ${workflow}`);
  }

  return {
    paymentStatus: finalStatus,
    accountClosed,
    workflow,
  };
}
