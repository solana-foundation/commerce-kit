import { expect } from '@jest/globals';
import {
  getChargebackPaymentInstruction,
  CHARGEBACK_PAYMENT_DISCRIMINATOR,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';

describe('chargebackPayment', () => {
  it('should create a valid chargeback payment instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getChargebackPaymentInstruction({
      payer,
      payment: TEST_ADDRESSES.PAYMENT,
      operatorAuthority,
      buyer: TEST_ADDRESSES.BUYER,
      merchant: TEST_ADDRESSES.MERCHANT,
      operator: TEST_ADDRESSES.OPERATOR,
      merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
      mint: TEST_ADDRESSES.MINT,
      merchantEscrowAta: TEST_ADDRESSES.ATA_1,
      buyerAta: TEST_ADDRESSES.ATA_2,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(13);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE); // payment
    expect(instruction.accounts[2].role).toBe(AccountRole.READONLY_SIGNER); // operator_authority
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // buyer
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // merchant
    expect(instruction.accounts[5].role).toBe(AccountRole.READONLY); // operator
    expect(instruction.accounts[6].role).toBe(AccountRole.READONLY); // merchant_operator_config
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // mint
    expect(instruction.accounts[8].role).toBe(AccountRole.WRITABLE); // merchant_escrow_ata
    expect(instruction.accounts[9].role).toBe(AccountRole.WRITABLE); // buyer_ata
    expect(instruction.accounts[10].role).toBe(AccountRole.READONLY); // token_program
    expect(instruction.accounts[11].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[12].role).toBe(AccountRole.READONLY); // event_authority

    // Test data
    const expectedData = new Uint8Array([CHARGEBACK_PAYMENT_DISCRIMINATOR]);
    expect(instruction.data).toEqual(expectedData);
  });
});