import { expect } from '@jest/globals';
import {
  getCreateOperatorInstruction,
  getCreateOperatorInstructionAsync,
  CREATE_OPERATOR_DISCRIMINATOR,
  findOperatorPda,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { SYSTEM_PROGRAM_ADDRESS } from 'gill/programs';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';

describe('createOperator', () => {
  it('should create a valid operator instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
    const bump = 255;

    const instruction = getCreateOperatorInstruction({
      payer,
      operator: TEST_ADDRESSES.OPERATOR,
      authority,
      bump,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(4);
    expect(instruction.accounts[0].address).toBe(payer.address);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].address).toBe(TEST_ADDRESSES.OPERATOR);
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE); // operator
    expect(instruction.accounts[2].address).toBe(authority.address);
    expect(instruction.accounts[2].role).toBe(AccountRole.READONLY_SIGNER); // authority
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[3].address).toBe(SYSTEM_PROGRAM_ADDRESS);

    // Test data
    const expectedData = new Uint8Array([CREATE_OPERATOR_DISCRIMINATOR, bump]);
    expect(instruction.data).toEqual(expectedData);
  });

  describe('automatic operator PDA derivation', () => {
    it('should automatically derive operator PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Get expected operator PDA using findOperatorPda
      const [expectedOperatorPda] = await findOperatorPda({
        owner: authority.address,
      });

      // Generate instruction without providing operator - should be auto-derived from authority
      const instruction = await getCreateOperatorInstructionAsync({
        payer,
        authority,
        // Not providing operator - should be auto-derived from authority
        bump,
      });

      // Verify the automatically derived operator PDA matches expected address
      expect(instruction.accounts[1].address).toBe(expectedOperatorPda); // operator
    });

    it('should use provided operator address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const bump = 255;

      // Provide custom operator address
      const customOperator = TEST_ADDRESSES.OPERATOR;

      const instruction = await getCreateOperatorInstructionAsync({
        payer,
        authority,
        operator: customOperator,
        bump,
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[1].address).toBe(customOperator); // operator
    });

    it('should derive operator PDA correctly from different authority addresses', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority1 = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const authority2 = mockTransactionSigner(TEST_ADDRESSES.BUYER); // Using different address as authority2
      const bump = 255;

      // Get expected operator PDAs for different authorities
      const [expectedOperatorPda1] = await findOperatorPda({
        owner: authority1.address,
      });

      const [expectedOperatorPda2] = await findOperatorPda({
        owner: authority2.address,
      });

      // Generate instructions with different authorities
      const instruction1 = await getCreateOperatorInstructionAsync({
        payer,
        authority: authority1,
        bump,
      });

      const instruction2 = await getCreateOperatorInstructionAsync({
        payer,
        authority: authority2,
        bump,
      });

      // Verify each operator PDA is correctly derived from its respective authority
      expect(instruction1.accounts[1].address).toBe(expectedOperatorPda1); // operator for authority1
      expect(instruction2.accounts[1].address).toBe(expectedOperatorPda2); // operator for authority2
      
      // Verify they are different addresses
      expect(expectedOperatorPda1).not.toBe(expectedOperatorPda2);
    });
  });
});