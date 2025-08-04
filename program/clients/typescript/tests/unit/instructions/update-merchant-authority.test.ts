import { expect } from '@jest/globals';
import {
  getUpdateMerchantAuthorityInstruction,
  getUpdateMerchantAuthorityInstructionAsync,
  UPDATE_MERCHANT_AUTHORITY_DISCRIMINATOR,
  findMerchantPda,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';

describe('updateMerchantAuthority', () => {
  it('should create a valid update merchant authority instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getUpdateMerchantAuthorityInstruction({
      payer,
      authority,
      merchant: TEST_ADDRESSES.MERCHANT,
      newAuthority: TEST_ADDRESSES.NEW_AUTHORITY,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(4);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE_SIGNER); // authority
    expect(instruction.accounts[2].role).toBe(AccountRole.WRITABLE); // merchant
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // new_authority

    // Test data
    const expectedData = new Uint8Array([UPDATE_MERCHANT_AUTHORITY_DISCRIMINATOR]);
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
      const instruction = await getUpdateMerchantAuthorityInstructionAsync({
        payer,
        authority,
        // Not providing merchant - should be auto-derived from authority
        newAuthority: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify the automatically derived merchant PDA matches expected address
      expect(instruction.accounts[2].address).toBe(expectedMerchantPda); // merchant
    });

    it('should use provided merchant address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Provide custom merchant address
      const customMerchant = TEST_ADDRESSES.MERCHANT;

      const instruction = await getUpdateMerchantAuthorityInstructionAsync({
        payer,
        authority,
        merchant: customMerchant,
        newAuthority: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[2].address).toBe(customMerchant); // merchant
    });
  });
});