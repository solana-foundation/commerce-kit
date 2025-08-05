import { expect } from "@jest/globals";
import {
  getMakePaymentInstruction,
  getMakePaymentInstructionAsync,
  MAKE_PAYMENT_DISCRIMINATOR,
  findPaymentPda,
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

  describe('automatic payment PDA derivation', () => {
    it('should automatically derive payment PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);
      const orderId = 1;

      // Get expected payment PDA using findPaymentPda
      const [expectedPaymentPda] = await findPaymentPda({
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        buyer: buyer.address,
        mint: TEST_ADDRESSES.MINT,
        orderId: orderId,
      });

      // Generate instruction without providing payment - should be auto-derived
      const instruction = await getMakePaymentInstructionAsync({
        payer,
        // Not providing payment - should be auto-derived from merchantOperatorConfig, buyer, mint, and orderId
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId,
        amount: 100,
        bump: 255,
      });

      // Verify the automatically derived payment PDA matches expected address
      expect(instruction.accounts[1].address).toBe(expectedPaymentPda); // payment
    });

    it('should use provided payment address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);
      const orderId = 1;

      // Provide custom payment address
      const customPayment = TEST_ADDRESSES.PAYMENT;

      const instruction = await getMakePaymentInstructionAsync({
        payer,
        payment: customPayment,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId,
        amount: 100,
        bump: 255,
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[1].address).toBe(customPayment); // payment
    });

    it('should derive different payment PDAs for different orderIds', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);
      const orderId1 = 1;
      const orderId2 = 2;

      // Get expected payment PDAs for different orderIds
      const [expectedPaymentPda1] = await findPaymentPda({
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        buyer: buyer.address,
        mint: TEST_ADDRESSES.MINT,
        orderId: orderId1,
      });

      const [expectedPaymentPda2] = await findPaymentPda({
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        buyer: buyer.address,
        mint: TEST_ADDRESSES.MINT,
        orderId: orderId2,
      });

      // Generate instructions with different orderIds
      const instruction1 = await getMakePaymentInstructionAsync({
        payer,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId1,
        amount: 100,
        bump: 255,
      });

      const instruction2 = await getMakePaymentInstructionAsync({
        payer,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId2,
        amount: 100,
        bump: 255,
      });

      // Verify each payment PDA is correctly derived from its respective orderId
      expect(instruction1.accounts[1].address).toBe(expectedPaymentPda1); // payment for orderId1
      expect(instruction2.accounts[1].address).toBe(expectedPaymentPda2); // payment for orderId2
      
      // Verify they are different addresses
      expect(expectedPaymentPda1).not.toBe(expectedPaymentPda2);
    });

    it('should derive different payment PDAs for different buyers', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer1 = mockTransactionSigner(TEST_ADDRESSES.BUYER);
      const buyer2 = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY); // Using different address as buyer2
      const orderId = 1;

      // Get expected payment PDAs for different buyers
      const [expectedPaymentPda1] = await findPaymentPda({
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        buyer: buyer1.address,
        mint: TEST_ADDRESSES.MINT,
        orderId: orderId,
      });

      const [expectedPaymentPda2] = await findPaymentPda({
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        buyer: buyer2.address,
        mint: TEST_ADDRESSES.MINT,
        orderId: orderId,
      });

      // Generate instructions with different buyers
      const instruction1 = await getMakePaymentInstructionAsync({
        payer,
        operatorAuthority,
        buyer: buyer1,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId,
        amount: 100,
        bump: 255,
      });

      const instruction2 = await getMakePaymentInstructionAsync({
        payer,
        operatorAuthority,
        buyer: buyer2,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId,
        amount: 100,
        bump: 255,
      });

      // Verify each payment PDA is correctly derived from its respective buyer
      expect(instruction1.accounts[1].address).toBe(expectedPaymentPda1); // payment for buyer1
      expect(instruction2.accounts[1].address).toBe(expectedPaymentPda2); // payment for buyer2
      
      // Verify they are different addresses
      expect(expectedPaymentPda1).not.toBe(expectedPaymentPda2);
    });

    it('should derive payment PDA with all parameters correctly', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);
      const orderId = 42;

      // Get expected payment PDA
      const [expectedPaymentPda] = await findPaymentPda({
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        buyer: buyer.address,
        mint: TEST_ADDRESSES.MINT,
        orderId: orderId,
      });

      // Generate instruction without providing payment PDA
      const instruction = await getMakePaymentInstructionAsync({
        payer,
        operatorAuthority,
        buyer,
        operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId,
        amount: 1000,
        bump: 255,
      });

      // Verify the payment PDA is correctly derived using all the seed parameters
      expect(instruction.accounts[1].address).toBe(expectedPaymentPda); // payment
    });
    it('should automatically derive operator PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);
      const orderId = 1;

      // Get expected operator PDA using findOperatorPda
      const [expectedOperatorPda] = await findOperatorPda({
        owner: operatorAuthority.address,
      });

      // Generate instruction without providing operator - should be auto-derived from operatorAuthority
      const instruction = await getMakePaymentInstructionAsync({
        payer,
        operatorAuthority,
        buyer,
        //operator: TEST_ADDRESSES.OPERATOR,
        merchant: TEST_ADDRESSES.MERCHANT,
        merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
        mint: TEST_ADDRESSES.MINT,
        merchantSettlementAta: TEST_ADDRESSES.ATA_3,
        orderId: orderId,
        amount: 100,
        bump: 255,
      });

      // Verify the automatically derived operator PDA matches expected address
      expect(instruction.accounts[4].address).toBe(expectedOperatorPda); // operator
    });
  });
});
