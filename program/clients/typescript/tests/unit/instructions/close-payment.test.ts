import { expect } from '@jest/globals';
import {
  getClosePaymentInstruction,
  CLOSE_PAYMENT_DISCRIMINATOR,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';

describe('closePayment', () => {
  it('should create a valid close payment instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getClosePaymentInstruction({
      payer,
      payment: TEST_ADDRESSES.PAYMENT,
      operatorAuthority,
      operator: TEST_ADDRESSES.OPERATOR,
      merchant: TEST_ADDRESSES.MERCHANT,
      buyer: TEST_ADDRESSES.BUYER,
      merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
      mint: TEST_ADDRESSES.MINT,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(9);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE); // payment
    expect(instruction.accounts[2].role).toBe(AccountRole.READONLY_SIGNER); // operator_authority
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // operator
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // merchant
    expect(instruction.accounts[5].role).toBe(AccountRole.READONLY); // buyer
    expect(instruction.accounts[6].role).toBe(AccountRole.READONLY); // merchant_operator_config
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // mint
    expect(instruction.accounts[8].role).toBe(AccountRole.READONLY); // system_program

    // Test data
    const expectedData = new Uint8Array([CLOSE_PAYMENT_DISCRIMINATOR]);
    expect(instruction.data).toEqual(expectedData);
  });

  it('should use correct addresses for all accounts', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getClosePaymentInstruction({
      payer,
      payment: TEST_ADDRESSES.PAYMENT,
      operatorAuthority,
      operator: TEST_ADDRESSES.OPERATOR,
      merchant: TEST_ADDRESSES.MERCHANT,
      buyer: TEST_ADDRESSES.BUYER,
      merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
      mint: TEST_ADDRESSES.MINT,
    });

    // Verify account addresses
    expect(instruction.accounts[0].address).toBe(TEST_ADDRESSES.PAYER);
    expect(instruction.accounts[1].address).toBe(TEST_ADDRESSES.PAYMENT);
    expect(instruction.accounts[2].address).toBe(TEST_ADDRESSES.AUTHORITY);
    expect(instruction.accounts[3].address).toBe(TEST_ADDRESSES.OPERATOR);
    expect(instruction.accounts[4].address).toBe(TEST_ADDRESSES.MERCHANT);
    expect(instruction.accounts[5].address).toBe(TEST_ADDRESSES.BUYER);
    expect(instruction.accounts[6].address).toBe(TEST_ADDRESSES.CONFIG);
    expect(instruction.accounts[7].address).toBe(TEST_ADDRESSES.MINT);
    expect(instruction.accounts[8].address).toBe('11111111111111111111111111111111'); // System program
  });

  it('should have minimal instruction data with only discriminator', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getClosePaymentInstruction({
      payer,
      payment: TEST_ADDRESSES.PAYMENT,
      operatorAuthority,
      operator: TEST_ADDRESSES.OPERATOR,
      merchant: TEST_ADDRESSES.MERCHANT,
      buyer: TEST_ADDRESSES.BUYER,
      merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
      mint: TEST_ADDRESSES.MINT,
    });

    // Close payment should only need discriminator, no additional data
    expect(instruction.data).toHaveLength(1);
    expect(instruction.data[0]).toBe(CLOSE_PAYMENT_DISCRIMINATOR);
  });
});