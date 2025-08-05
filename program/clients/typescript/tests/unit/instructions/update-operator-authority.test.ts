import { expect } from '@jest/globals';
import {
  getUpdateOperatorAuthorityInstruction,
  getUpdateOperatorAuthorityInstructionAsync,
  UPDATE_OPERATOR_AUTHORITY_DISCRIMINATOR,
  findOperatorPda,
} from '../../../src/generated';
import { AccountRole } from '@solana/kit';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';

describe('updateOperatorAuthority', () => {
  it('should create a valid update operator authority instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getUpdateOperatorAuthorityInstruction({
      payer,
      authority,
      operator: TEST_ADDRESSES.OPERATOR,
      newOperatorAuthority: TEST_ADDRESSES.NEW_AUTHORITY,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(4);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE_SIGNER); // authority
    expect(instruction.accounts[2].role).toBe(AccountRole.WRITABLE); // operator
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // new_operator_authority

    // Test data
    const expectedData = new Uint8Array([UPDATE_OPERATOR_AUTHORITY_DISCRIMINATOR]);
    expect(instruction.data).toEqual(expectedData);
  });

  describe('automatic operator PDA derivation', () => {
    it('should automatically derive operator PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Get expected operator PDA using findOperatorPda
      const [expectedOperatorPda] = await findOperatorPda({
        owner: authority.address,
      });

      // Generate instruction without providing operator - should be auto-derived from authority
      const instruction = await getUpdateOperatorAuthorityInstructionAsync({
        payer,
        authority,
        // Not providing operator - should be auto-derived from authority
        newOperatorAuthority: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify the automatically derived operator PDA matches expected address
      expect(instruction.accounts[2].address).toBe(expectedOperatorPda); // operator
    });

    it('should use provided operator address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

      // Provide custom operator address
      const customOperator = TEST_ADDRESSES.OPERATOR;

      const instruction = await getUpdateOperatorAuthorityInstructionAsync({
        payer,
        authority,
        operator: customOperator,
        newOperatorAuthority: TEST_ADDRESSES.NEW_AUTHORITY,
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[2].address).toBe(customOperator); // operator
    });
  });
});