import { expect } from '@jest/globals';
import {
  getInitializeMerchantInstruction,
  getInitializeMerchantInstructionAsync,
  INITIALIZE_MERCHANT_DISCRIMINATOR,
  findMerchantPda,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';
import { 
  SYSTEM_PROGRAM_ADDRESS,
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
      bump,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(5);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.READONLY_SIGNER); // authority
    expect(instruction.accounts[2].role).toBe(AccountRole.WRITABLE); // merchant
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // settlement_wallet
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[4].address).toBe(SYSTEM_PROGRAM_ADDRESS);
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

  });
});