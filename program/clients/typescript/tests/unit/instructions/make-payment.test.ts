import { expect } from '@jest/globals';
import {
  getMakePaymentInstruction,
  MAKE_PAYMENT_DISCRIMINATOR,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';

describe('makePayment', () => {
  it('should create a valid make payment instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const operatorAuthority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
    const buyer = mockTransactionSigner(TEST_ADDRESSES.BUYER);

    const instruction = getMakePaymentInstruction({
      payer,
      payment: TEST_ADDRESSES.PAYMENT,
      operatorAuthority,
      buyer,
      operator: TEST_ADDRESSES.OPERATOR,
      merchant: TEST_ADDRESSES.MERCHANT,
      merchantOperatorConfig: TEST_ADDRESSES.CONFIG,
      mint: TEST_ADDRESSES.MINT,
      buyerAta: TEST_ADDRESSES.ATA_1,
      merchantEscrowAta: TEST_ADDRESSES.ATA_2,
      merchantSettlementAta: TEST_ADDRESSES.ATA_3,
      orderId: 1,
      amount: 100,
      bump: 255,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(14);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.WRITABLE); // payment
    expect(instruction.accounts[2].role).toBe(AccountRole.READONLY_SIGNER); // operator_authority
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY_SIGNER); // buyer
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // operator
    expect(instruction.accounts[5].role).toBe(AccountRole.READONLY); // merchant
    expect(instruction.accounts[6].role).toBe(AccountRole.WRITABLE); // merchant_operator_config
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // mint
    expect(instruction.accounts[8].role).toBe(AccountRole.WRITABLE); // buyer_ata
    expect(instruction.accounts[9].role).toBe(AccountRole.WRITABLE); // merchant_escrow_ata
    expect(instruction.accounts[10].role).toBe(AccountRole.WRITABLE); // merchant_settlement_ata
    expect(instruction.accounts[11].role).toBe(AccountRole.READONLY); // token_program
    expect(instruction.accounts[12].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[13].role).toBe(AccountRole.READONLY); // event_authority

    // Test data
    const expectedDiscriminator = new Uint8Array([MAKE_PAYMENT_DISCRIMINATOR]);
    expect(instruction.data.slice(0, 1)).toEqual(expectedDiscriminator);
  });
});