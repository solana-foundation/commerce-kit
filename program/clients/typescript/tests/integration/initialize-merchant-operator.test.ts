import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  address,
  createSolanaClient,
  SolanaClient,
  KeyPairSigner,
  Address,
  lamports,
  generateExtractableKeyPairSigner,
  ProgramDerivedAddressBump,
} from "gill";
import { FeeType, PolicyData } from "../../src/generated";
import { setupWallets } from "./helpers/transactions";
import {
  assertGetOrCreateOperator,
  assertGetOrCreateMerchant,
  assertGetOrCreateMerchantOperatorConfig,
} from "./helpers/state-utils";
import { assertMerchantOperatorConfigAccount } from "./helpers/assertions";

describe("Initialize Merchant Operator Config", () => {
  let client: SolanaClient;
  let payer: KeyPairSigner;
  let operatorAuthority: KeyPairSigner;
  let merchantAuthority: KeyPairSigner;
  let settlementWallet: KeyPairSigner;

  // PDAs and bumps
  let merchantPda: Address;
  let operatorPda: Address;
  let merchantOperatorConfigPda: Address;
  let merchantOperatorConfigBump: ProgramDerivedAddressBump;

  // Test token mints (USDC and USDT on local validator)
  const usdcMint = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const usdtMint = address("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

  let version = 1; // incremented after each test
  const operatorFee = lamports(100000n); // 0.0001 SOL
  const feeType = FeeType.Fixed;
  const currentOrderId = 0;
  const daysToClose = 7;

  beforeEach(async () => {
    client = createSolanaClient({ urlOrMoniker: "http://localhost:8899" });

    payer = await generateExtractableKeyPairSigner();
    operatorAuthority = await generateExtractableKeyPairSigner();
    merchantAuthority = await generateExtractableKeyPairSigner();
    settlementWallet = await generateExtractableKeyPairSigner();

    await setupWallets(client, [
      payer,
      operatorAuthority,
      merchantAuthority,
      settlementWallet,
    ]);

    [operatorPda] = await assertGetOrCreateOperator({
      client,
      payer,
      owner: operatorAuthority,
      failIfExists: false,
    });

    [merchantPda] = await assertGetOrCreateMerchant({
      client,
      payer,
      authority: merchantAuthority,
      settlementWallet,
      failIfExists: false,
    });
  }, 20_000);

  describe("Initialize Merchant Operator Config", () => {
    it("should initialize a merchant operator config with basic settings", async () => {
      const policies: PolicyData[] = [
        {
          __kind: "Settlement",
          fields: [
            {
              minSettlementAmount: 0n,
              settlementFrequencyHours: 0,
              autoSettle: false,
            },
          ],
        },
        {
          __kind: "Refund",
          fields: [
            {
              maxAmount: 10000n,
              maxTimeAfterPurchase: 10000n,
            },
          ],
        },
      ];

      const acceptedCurrencies: Address[] = [usdcMint, usdtMint];

      [merchantOperatorConfigPda, merchantOperatorConfigBump] =
        await assertGetOrCreateMerchantOperatorConfig({
          client,
          payer,
          authority: merchantAuthority,
          merchantPda,
          operatorPda,
          version,
          operatorFee,
          feeType,
          currentOrderId,
          daysToClose,
          policies,
          acceptedCurrencies,
          failIfExists: true,
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
        expectedPolicies: policies,
        expectedAcceptedCurrencies: acceptedCurrencies,
      });
    }, 10_000);

    it("should initialize a merchant operator config with percentage-based fees", async () => {
      const policies: PolicyData[] = [
        {
          __kind: "Settlement",
          fields: [
            {
              minSettlementAmount: 0n,
              settlementFrequencyHours: 0,
              autoSettle: true,
            },
          ],
        },
      ];

      const acceptedCurrencies: Address[] = [usdcMint];
      const operatorFeeBps = 250n;
      const feeTypeBps = FeeType.Bps;

      await assertGetOrCreateMerchantOperatorConfig({
        client,
        payer,
        authority: merchantAuthority,
        merchantPda,
        operatorPda,
        version,
        operatorFee: operatorFeeBps,
        feeType: feeTypeBps,
        currentOrderId,
        daysToClose,
        policies,
        acceptedCurrencies,
        failIfExists: true,
      });
    }, 10_000);

    it("should fail to initialize if account already exists", async () => {
      // First creation should succeed
      const policies: PolicyData[] = [];
      const acceptedCurrencies: Address[] = [usdcMint];

      await assertGetOrCreateMerchantOperatorConfig({
        client,
        payer,
        authority: merchantAuthority,
        merchantPda,
        operatorPda,
        version,
        operatorFee: lamports(0n),
        feeType: FeeType.Fixed,
        currentOrderId,
        daysToClose,
        policies,
        acceptedCurrencies,
        failIfExists: false,
      });

      // Second creation with same parameters should fail if failIfExists is true
      await expect(
        assertGetOrCreateMerchantOperatorConfig({
          client,
          payer,
          authority: merchantAuthority,
          merchantPda,
          operatorPda,
          version,
          operatorFee: lamports(0n),
          feeType: FeeType.Fixed,
          currentOrderId,
          daysToClose,
          policies,
          acceptedCurrencies,
          failIfExists: true,
        })
      ).rejects.toThrow("MerchantOperatorConfig account already exists");
    }, 10_000);
  });
  afterEach(async () => {
    version++;
  });
});
