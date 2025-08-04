import { expect } from "@jest/globals";
import {
  getMakePaymentInstruction,
  getMakePaymentInstructionAsync,
  MAKE_PAYMENT_DISCRIMINATOR,
} from "../../../src/generated";
import { AccountRole } from "gill";
import {
  mockTransactionSigner,
  TEST_ADDRESSES,
  EXPECTED_PROGRAM_ADDRESS,
} from "../../../tests/setup/mocks";
import { 
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda 
} from 'gill/programs';

describe("makePayment", () => {
  it("should create a valid make payment instruction", () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
    const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);

    const instruction = getMakePaymentInstruction({
      payer,
      payment: TEST_ADDRESSES.PAYMENT,
      operatorAuthority,
      buyer,
      operator: TEST_ADDRESSES.OPERATOR,
      merchant: TEST_ADDRESSES.MERCHANT,
      merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
      mint: TEST_ADDRESSES.MINT,
      buyerAta: TEST_ADDRESSES.ATA_1,
      merchantEscrowAta: TEST_ADDRESSES.ATA_2,
      merchantSettlementAta: TEST_ADDRESSES.ATA_3,
      orderId: 1,
      amount: 100,
      bump: 255,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(15);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE); // payment
    expect(instruction.accounts[2].role).toBe(AccountRole.READONLY_SIGNER); // operator_authority
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY_SIGNER); // buyer
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // operator
    expect(instruction.accounts[5].role).toBe(AccountRole.READONLY); // merchant
    expect(instruction.accounts[6].role).toBe(AccountRole.WRITABLE); // merchant_operator_config
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // mint
    expect(instruction.accounts[8].role).toBe(AccountRole.WRITABLE); // buyer_ata
    expect(instruction.accounts[9].role).toBe(AccountRole.WRITABLE); // merchant_escrow_ata
    expect(instruction.accounts[10].role).toBe(AccountRole.WRITABLE); // merchant_settlement_ata
    expect(instruction.accounts[11].role).toBe(AccountRole.READONLY); // token_program
    expect(instruction.accounts[12].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[13].role).toBe(AccountRole.READONLY); // event_authority
    expect(instruction.accounts[14].role).toBe(AccountRole.READONLY); // commerce_program

    // Test data
    const expectedDiscriminator = new Uint8Array([MAKE_PAYMENT_DISCRIMINATOR]);
    expect(instruction.data.slice(0, 1)).toEqual(expectedDiscriminator);
  });

  describe('automatic ATA derivation', () => {
    it('should automatically derive buyerAta when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);

      // Get expected ATA address using findAssociatedTokenPda
      const [expectedBuyerAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.BUYER,
      });

      // Generate instruction without providing buyerAta - should be auto-derived
      const instruction = await getMakePaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: 1,
        amount: 100,
        bump: 255,
        // Not providing buyerAta - should be auto-derived
      });

      // Verify the automatically derived buyerAta matches expected address
      expect(instruction.accounts[8].address).toBe(expectedBuyerAta); // buyerAta
    });

    it('should automatically derive merchantEscrowAta when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);

      // Get expected ATA address using findAssociatedTokenPda
      const [expectedMerchantEscrowAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      // Generate instruction without providing merchantEscrowAta - should be auto-derived
      const instruction = await getMakePaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: 1,
        amount: 100,
        bump: 255,
        // Not providing merchantEscrowAta - should be auto-derived
      });

      // Verify the automatically derived merchantEscrowAta matches expected address
      expect(instruction.accounts[9].address).toBe(expectedMerchantEscrowAta); // merchantEscrowAta
    });

    it('should automatically derive both buyerAta and merchantEscrowAta when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);

      // Get expected ATA addresses using findAssociatedTokenPda
      const [expectedBuyerAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.BUYER,
      });

      const [expectedMerchantEscrowAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      // Generate instruction without providing any ATAs - should be auto-derived
      const instruction = await getMakePaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: 1,
        amount: 100,
        bump: 255,
        // Not providing buyerAta or merchantEscrowAta - should be auto-derived
      });

      // Verify both automatically derived ATAs match expected addresses
      expect(instruction.accounts[8].address).toBe(expectedBuyerAta); // buyerAta
      expect(instruction.accounts[9].address).toBe(expectedMerchantEscrowAta); // merchantEscrowAta
    });

    it('should use provided ATA addresses when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);

      // Provide custom ATA addresses
      const customBuyerAta = TEST_ADDRESSES.ATA_1;
      const customMerchantEscrowAta = TEST_ADDRESSES.ATA_2;

      const instruction = await getMakePaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        buyerAta: customBuyerAta,
        merchantEscrowAta: customMerchantEscrowAta,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: 1,
        amount: 100,
        bump: 255,
      });

      // Verify the provided addresses are used instead of auto-derived ones
      expect(instruction.accounts[8].address).toBe(customBuyerAta); // buyerAta
      expect(instruction.accounts[9].address).toBe(customMerchantEscrowAta); // merchantEscrowAta
    });
  });
});
