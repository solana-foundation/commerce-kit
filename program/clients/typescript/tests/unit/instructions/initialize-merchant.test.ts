import { expect } from '@jest/globals';
import {
  getInitializeMerchantInstruction,
  getInitializeMerchantInstructionAsync,
  INITIALIZE_MERCHANT_DISCRIMINATOR,
  findMerchantPda,
} from '../../../src/generated';
import { AccountRole, Address } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';
import { 
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda 
} from 'gill/programs';

describe('initializeMerchant', () => {
  it('should create a valid initialize merchant instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
    const bump = 255;

    const instruction = getInitializeMerchantInstruction({
      payer,
      authority,
      merchant: TEST_ADDRESSES.MERCHANT,
      settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
      settlementUsdcAta: TEST_ADDRESSES.ATA_1,
      escrowUsdcAta: TEST_ADDRESSES.ATA_2,
      settlementUsdtAta: TEST_ADDRESSES.ATA_3,
      escrowUsdtAta: TEST_ADDRESSES.ATA_1,
      bump,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(13);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.READONLY_SIGNER); // authority
    expect(instruction.accounts[2].role).toBe(AccountRole.WRITABLE); // merchant
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // settlement_wallet
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[4].address).toBe(SYSTEM_PROGRAM_ADDRESS);
    expect(instruction.accounts[5].role).toBe(AccountRole.WRITABLE); // settlement_usdc_ata
    expect(instruction.accounts[6].role).toBe(AccountRole.WRITABLE); // escrow_usdc_ata
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // usdc_mint
    expect(instruction.accounts[8].role).toBe(AccountRole.WRITABLE); // settlement_usdt_ata
    expect(instruction.accounts[9].role).toBe(AccountRole.WRITABLE); // escrow_usdt_ata
    expect(instruction.accounts[10].role).toBe(AccountRole.READONLY); // usdt_mint
    expect(instruction.accounts[11].role).toBe(AccountRole.READONLY); // token_program
    expect(instruction.accounts[12].role).toBe(AccountRole.READONLY); // associated_token_program

    // Test data
    const expectedData = new Uint8Array([INITIALIZE_MERCHANT_DISCRIMINATOR, bump]);
    expect(instruction.data).toEqual(expectedData);
  });

  describe('automatic merchant PDA derivation', () => {
    it('should automatically derive merchant PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Get expected merchant PDA using findMerchantPda
      const [expectedMerchantPda] = await findMerchantPda({
        owner: authority.address,
      });

      // Generate instruction without providing merchant - should be auto-derived from authority
      const instruction = await getInitializeMerchantInstructionAsync({
        payer,
        authority,
        // Not providing merchant - should be auto-derived from authority
        settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
        bump,
      });

      // Verify the automatically derived merchant PDA matches expected address
      expect(instruction.accounts[2].address).toBe(expectedMerchantPda); // merchant
    });

    it('should use provided merchant address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Provide custom merchant address
      const customMerchant = TEST_ADDRESSES.MERCHANT;

      const instruction = await getInitializeMerchantInstructionAsync({
        payer,
        authority,
        merchant: customMerchant,
        settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
        bump,
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[2].address).toBe(customMerchant); // merchant
    });

    it('should derive escrow ATAs using the auto-derived merchant PDA', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;
      const USDC_MINT = TEST_ADDRESSES.USDC_MINT;
      const USDT_MINT = TEST_ADDRESSES.USDT_MINT;

      // Get expected merchant PDA
      const [expectedMerchantPda] = await findMerchantPda({
        owner: authority.address,
      });

      // Get expected escrow ATAs using the auto-derived merchant PDA
      const [expectedEscrowUsdcAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDC_MINT,
        owner: expectedMerchantPda,
      });

      const [expectedEscrowUsdtAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDT_MINT,
        owner: expectedMerchantPda,
      });

      // Generate instruction without providing merchant or escrow ATAs
      const instruction = await getInitializeMerchantInstructionAsync({
        payer,
        authority,
        // Not providing merchant or escrow ATAs - all should be auto-derived
        settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
        bump,
      });

      // Verify merchant PDA is correctly derived
      expect(instruction.accounts[2].address).toBe(expectedMerchantPda); // merchant
      
      // Verify escrow ATAs are correctly derived using the auto-derived merchant PDA
      expect(instruction.accounts[6].address).toBe(expectedEscrowUsdcAta); // escrowUsdcAta
      expect(instruction.accounts[9].address).toBe(expectedEscrowUsdtAta); // escrowUsdtAta
    });
  });

  describe('automatic ATA derivation', () => {
    // Test mint addresses (USDC and USDT mainnet addresses)
    const USDC_MINT = TEST_ADDRESSES.USDC_MINT;
    const USDT_MINT = TEST_ADDRESSES.USDT_MINT;

    it('should automatically derive correct USDC ATAs when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Get expected ATA addresses using findAssociatedTokenPda
      const [expectedSettlementUsdcAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDC_MINT,
        owner: TEST_ADDRESSES.SETTLEMENT_WALLET,
      });

      const [expectedEscrowUsdcAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDC_MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      // Generate instruction without providing ATAs - they should be auto-derived
      const instruction = await getInitializeMerchantInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
        bump,
        // Not providing settlementUsdcAta or escrowUsdcAta - should be auto-derived
      });

      // Verify the automatically derived ATAs match expected addresses
      expect(instruction.accounts[5].address).toBe(expectedSettlementUsdcAta); // settlementUsdcAta
      expect(instruction.accounts[6].address).toBe(expectedEscrowUsdcAta); // escrowUsdcAta
    });

    it('should automatically derive correct USDT ATAs when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Get expected ATA addresses using findAssociatedTokenPda
      const [expectedSettlementUsdtAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDT_MINT,
        owner: TEST_ADDRESSES.SETTLEMENT_WALLET,
      });

      const [expectedEscrowUsdtAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDT_MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      // Generate instruction without providing ATAs - they should be auto-derived
      const instruction = await getInitializeMerchantInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
        bump,
        // Not providing settlementUsdtAta or escrowUsdtAta - should be auto-derived
      });

      // Verify the automatically derived ATAs match expected addresses
      expect(instruction.accounts[8].address).toBe(expectedSettlementUsdtAta); // settlementUsdtAta
      expect(instruction.accounts[9].address).toBe(expectedEscrowUsdtAta); // escrowUsdtAta
    });

    it('should use provided ATA addresses when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Provide custom ATA addresses
      const customUsdcAta = TEST_ADDRESSES.ATA_1;
      const customEscrowAta = TEST_ADDRESSES.ATA_2;

      const instruction = await getInitializeMerchantInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
        settlementUsdcAta: customUsdcAta,
        escrowUsdcAta: customEscrowAta,
        bump,
      });

      // Verify the provided addresses are used instead of auto-derived ones
      expect(instruction.accounts[5].address).toBe(customUsdcAta); // settlementUsdcAta
      expect(instruction.accounts[6].address).toBe(customEscrowAta); // escrowUsdcAta
    });

    it('should auto-derive all four ATA accounts correctly', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Get all expected ATA addresses
      const [expectedSettlementUsdcAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDC_MINT,
        owner: TEST_ADDRESSES.SETTLEMENT_WALLET,
      });

      const [expectedEscrowUsdcAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDC_MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      const [expectedSettlementUsdtAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDT_MINT,
        owner: TEST_ADDRESSES.SETTLEMENT_WALLET,
      });

      const [expectedEscrowUsdtAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDT_MINT,
        owner: TEST_ADDRESSES.MERCHANT,
      });

      // Generate instruction with no ATAs provided
      const instruction = await getInitializeMerchantInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        settlementWallet: TEST_ADDRESSES.SETTLEMENT_WALLET,
        bump,
      });

      // Verify all ATAs are correctly auto-derived
      expect(instruction.accounts[5].address).toBe(expectedSettlementUsdcAta); // settlementUsdcAta
      expect(instruction.accounts[6].address).toBe(expectedEscrowUsdcAta); // escrowUsdcAta
      expect(instruction.accounts[8].address).toBe(expectedSettlementUsdtAta); // settlementUsdtAta
      expect(instruction.accounts[9].address).toBe(expectedEscrowUsdtAta); // escrowUsdtAta
    });
  });
});