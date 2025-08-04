import { expect } from "@jest/globals";
import {
  getRefundPaymentInstruction,
  getRefundPaymentInstructionAsync,
  REFUND_PAYMENT_DISCRIMINATOR,
  findOperatorPda,
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

describe("refundPayment", () => {
  it("should create a valid refund payment instruction", () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getRefundPaymentInstruction({
      payer,
      payment: TEST_ADDRESSES.PAYMENT,
      operatorAuthority,
      buyer: TEST_ADDRESSES.BUYER,
      merchant: TEST_ADDRESSES.MERCHANT,
      operator: TEST_ADDRESSES.OPERATOR,
      merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
      mint: TEST_ADDRESSES.MINT,
      merchantEscrowAta: TEST_ADDRESSES.ATA_1,
      buyerAta: TEST_ADDRESSES.ATA_2,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(14);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE); // payment
    expect(instruction.accounts[2].role).toBe(AccountRole.READONLY_SIGNER); // operator_authority
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // buyer
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // merchant
    expect(instruction.accounts[5].role).toBe(AccountRole.READONLY); // operator
    expect(instruction.accounts[6].role).toBe(AccountRole.READONLY); // merchant_operator_config
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // mint
    expect(instruction.accounts[8].role).toBe(AccountRole.WRITABLE); // merchant_escrow_ata
    expect(instruction.accounts[9].role).toBe(AccountRole.WRITABLE); // buyer_ata
    expect(instruction.accounts[10].role).toBe(AccountRole.READONLY); // token_program
    expect(instruction.accounts[11].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[12].role).toBe(AccountRole.READONLY); // event_authority
    expect(instruction.accounts[13].role).toBe(AccountRole.READONLY); // commerce_program

    // Test data
    const expectedData = new Uint8Array([REFUND_PAYMENT_DISCRIMINATOR]);
    expect(instruction.data).toEqual(expectedData);
  });

  describe('automatic ATA derivation', () => {
    it('should automatically derive merchantEscrowAta when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Get expected ATA address using findAssociatedTokenPda
      const [expectedMerchantEscrowAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      // Generate instruction without providing merchantEscrowAta - should be auto-derived
      const instruction = await getRefundPaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer: TEST_ADDRESSES.BUYER,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        // Not providing merchantEscrowAta - should be auto-derived
      });

      // Verify the automatically derived merchantEscrowAta matches expected address
      expect(instruction.accounts[8].address).toBe(expectedMerchantEscrowAta); // merchantEscrowAta
    });

    it('should automatically derive buyerAta when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Get expected ATA address using findAssociatedTokenPda
      const [expectedBuyerAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.BUYER,
      });

      // Generate instruction without providing buyerAta - should be auto-derived
      const instruction = await getRefundPaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer: TEST_ADDRESSES.BUYER,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        // Not providing buyerAta - should be auto-derived
      });

      // Verify the automatically derived buyerAta matches expected address
      expect(instruction.accounts[9].address).toBe(expectedBuyerAta); // buyerAta
    });

    it('should automatically derive both ATAs when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Get expected ATA addresses using findAssociatedTokenPda
      const [expectedMerchantEscrowAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      const [expectedBuyerAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.BUYER,
      });

      // Generate instruction without providing any ATAs - should be auto-derived
      const instruction = await getRefundPaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer: TEST_ADDRESSES.BUYER,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        // Not providing merchantEscrowAta or buyerAta - should be auto-derived
      });

      // Verify both automatically derived ATAs match expected addresses
      expect(instruction.accounts[8].address).toBe(expectedMerchantEscrowAta); // merchantEscrowAta
      expect(instruction.accounts[9].address).toBe(expectedBuyerAta); // buyerAta
    });

    it('should use provided ATA addresses when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Provide custom ATA addresses
      const customMerchantEscrowAta = TEST_ADDRESSES.ATA_1;
      const customBuyerAta = TEST_ADDRESSES.ATA_2;

      const instruction = await getRefundPaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        buyer: TEST_ADDRESSES.BUYER,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantEscrowAta: customMerchantEscrowAta,
        buyerAta: customBuyerAta,
      });

      // Verify the provided addresses are used instead of auto-derived ones
      expect(instruction.accounts[8].address).toBe(customMerchantEscrowAta); // merchantEscrowAta
      expect(instruction.accounts[9].address).toBe(customBuyerAta); // buyerAta
    });
  });

  describe('automatic operator PDA derivation', () => {
    it('should automatically derive operator PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Get expected operator PDA using findOperatorPda
      const [expectedOperatorPda] = await findOperatorPda({
        owner: operatorAuthority.address,
      });

      // Generate instruction without providing operator - should be auto-derived from operatorAuthority
      const instruction = await getRefundPaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        // Not providing operator - should be auto-derived from operatorAuthority
        buyer: TEST_ADDRESSES.BUYER,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
      });

      // Verify the automatically derived operator PDA matches expected address
      expect(instruction.accounts[5].address).toBe(expectedOperatorPda); // operator
    });

    it('should use provided operator address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Provide custom operator address
      const customOperator = TEST_ADDRESSES.OPERATOR;

      const instruction = await getRefundPaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        operator: customOperator,
        buyer: TEST_ADDRESSES.BUYER,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[5].address).toBe(customOperator); // operator
    });

    it('should derive operator PDA and ATAs together when both are not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Get expected operator PDA
      const [expectedOperatorPda] = await findOperatorPda({
        owner: operatorAuthority.address,
      });

      // Get expected ATA addresses
      const [expectedMerchantEscrowAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      const [expectedBuyerAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: TEST_ADDRESSES.MINT,
        owner: TEST_ADDRESSES.BUYER,
      });

      // Generate instruction without providing operator or ATAs - all should be auto-derived
      const instruction = await getRefundPaymentInstructionAsync({
        payer,
        payment: TEST_ADDRESSES.PAYMENT,
        operatorAuthority,
        // Not providing operator, merchantEscrowAta, or buyerAta - all should be auto-derived
        buyer: TEST_ADDRESSES.BUYER,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
      });

      // Verify both operator PDA and ATAs are correctly auto-derived
      expect(instruction.accounts[5].address).toBe(expectedOperatorPda); // operator
      expect(instruction.accounts[8].address).toBe(expectedMerchantEscrowAta); // merchantEscrowAta
      expect(instruction.accounts[9].address).toBe(expectedBuyerAta); // buyerAta
    });
  });
});
