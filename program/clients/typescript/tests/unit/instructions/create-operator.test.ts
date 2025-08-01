import { expect } from '@jest/globals';
import {
  getCreateOperatorInstruction,
  CREATE_OPERATOR_DISCRIMINATOR,
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
});