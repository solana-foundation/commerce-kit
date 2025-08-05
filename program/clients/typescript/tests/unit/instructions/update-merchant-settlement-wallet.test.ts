import { expect } from '@jest/globals';
import {
  getUpdateMerchantSettlementWalletInstruction,
  getUpdateMerchantSettlementWalletInstructionAsync,
  UPDATE_MERCHANT_SETTLEMENT_WALLET_DISCRIMINATOR,
  findMerchantPda,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';
import { SYSTEM_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda } from 'gill/programs';

describe('updateMerchantSettlementWallet', () => {
  it('should create a valid update merchant settlement wallet instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getUpdateMerchantSettlementWalletInstruction({
      payer,
      authority,
      merchant: TEST_ADDRESSES.MERCHANT,
      newSettlementWallet: TEST_ADDRESSES.NEW_AUTHORITY,
      settlementUsdcAta: TEST_ADDRESSES.ATA_1,
      settlementUsdtAta: TEST_ADDRESSES.ATA_2,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(11);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE_SIGNER); // authority
    expect(instruction.accounts[2].role).toBe(AccountRole.WRITABLE); // merchant
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // new_settlement_wallet
    expect(instruction.accounts[4].role).toBe(AccountRole.WRITABLE); // settlement_usdc_ata
    expect(instruction.accounts[5].role).toBe(AccountRole.READONLY); // usdc_mint
    expect(instruction.accounts[6].role).toBe(AccountRole.WRITABLE); // settlement_usdt_ata
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // usdt_mint
    expect(instruction.accounts[8].role).toBe(AccountRole.READONLY); // token_program
    expect(instruction.accounts[9].role).toBe(AccountRole.READONLY); // associated_token_program
    expect(instruction.accounts[10].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[10].address).toBe(SYSTEM_PROGRAM_ADDRESS);

    // Test data
    const expectedData = new Uint8Array([UPDATE_MERCHANT_SETTLEMENT_WALLET_DISCRIMINATOR]);
    expect(instruction.data).toEqual(expectedData);
  });

  describe('automatic merchant PDA derivation', () => {
    it('should automatically derive merchant PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Get expected merchant PDA using findMerchantPda
      const [expectedMerchantPda] = await findMerchantPda({
        owner: authority.address,
      });

      // Generate instruction without providing merchant - should be auto-derived from authority
      const instruction = await getUpdateMerchantSettlementWalletInstructionAsync({
        payer,
        authority,

        // Not providing merchant - should be auto-derived from authority
        newSettlementWallet: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify the automatically derived merchant PDA matches expected address
      expect(instruction.accounts[2].address).toBe(expectedMerchantPda); // merchant
    });

    it('should use provided merchant address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Provide custom merchant address
      const customMerchant = TEST_ADDRESSES.MERCHANT;

      const instruction = await getUpdateMerchantSettlementWalletInstructionAsync({
        payer,
        authority,
        merchant: customMerchant,
        newSettlementWallet: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[2].address).toBe(customMerchant); // merchant
    });

    it('should derive merchant PDA and settlement ATAs together when both are not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const USDC_MINT = TEST_ADDRESSES.USDC_MINT;
      const USDT_MINT = TEST_ADDRESSES.USDT_MINT;

      // Get expected merchant PDA
      const [expectedMerchantPda] = await findMerchantPda({
        owner: authority.address,
      });

      // Get expected settlement ATA addresses
      const [expectedSettlementUsdcAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDC_MINT,
        owner: TEST_ADDRESSES.NEW_AUTHORITY, // newSettlementWallet is the owner
      });

      const [expectedSettlementUsdtAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDT_MINT,
        owner: TEST_ADDRESSES.NEW_AUTHORITY, // newSettlementWallet is the owner
      });

      // Generate instruction without providing merchant or settlement ATAs - all should be auto-derived
      const instruction = await getUpdateMerchantSettlementWalletInstructionAsync({
        payer,
        authority,
        // Not providing merchant, settlementUsdcAta, or settlementUsdtAta - all should be auto-derived
        newSettlementWallet: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify merchant PDA and settlement ATAs are correctly auto-derived
      expect(instruction.accounts[2].address).toBe(expectedMerchantPda); // merchant
      expect(instruction.accounts[4].address).toBe(expectedSettlementUsdcAta); // settlementUsdcAta
      expect(instruction.accounts[6].address).toBe(expectedSettlementUsdtAta); // settlementUsdtAta
    });

    it('should automatically derive only settlement ATAs when merchant is provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const USDC_MINT = TEST_ADDRESSES.USDC_MINT;
      const USDT_MINT = TEST_ADDRESSES.USDT_MINT;

      // Get expected settlement ATA addresses
      const [expectedSettlementUsdcAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDC_MINT,
        owner: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      const [expectedSettlementUsdtAta] = await findAssociatedTokenPda({
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        mint: USDT_MINT,
        owner: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Generate instruction with merchant provided but no settlement ATAs
      const instruction = await getUpdateMerchantSettlementWalletInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT, // Providing merchant (override auto-derivation)
        // Not providing settlementUsdcAta or settlementUsdtAta - should be auto-derived
        newSettlementWallet: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify provided merchant is used and settlement ATAs are auto-derived
      expect(instruction.accounts[2].address).toBe(TEST_ADDRESSES.MERCHANT); // merchant (provided)
      expect(instruction.accounts[4].address).toBe(expectedSettlementUsdcAta); // settlementUsdcAta (auto-derived)
      expect(instruction.accounts[6].address).toBe(expectedSettlementUsdtAta); // settlementUsdtAta (auto-derived)
    });

    it('should use provided ATA addresses when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Provide custom ATA addresses
      const customSettlementUsdcAta = TEST_ADDRESSES.ATA_1;
      const customSettlementUsdtAta = TEST_ADDRESSES.ATA_2;

      const instruction = await getUpdateMerchantSettlementWalletInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        newSettlementWallet: TEST_ADDRESSES.NEW_AUTHORITY,
        settlementUsdcAta: customSettlementUsdcAta,
        settlementUsdtAta: customSettlementUsdtAta,
      });

      // Verify the provided addresses are used instead of auto-derived ones
      expect(instruction.accounts[2].address).toBe(TEST_ADDRESSES.MERCHANT); // merchant (provided)
      expect(instruction.accounts[4].address).toBe(customSettlementUsdcAta); // settlementUsdcAta (provided)
      expect(instruction.accounts[6].address).toBe(customSettlementUsdtAta); // settlementUsdtAta (provided)
    });
  });
});