import { expect } from '@jest/globals';
import {
  getUpdateMerchantAuthorityInstruction,
  UPDATE_MERCHANT_AUTHORITY_DISCRIMINATOR,
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
});