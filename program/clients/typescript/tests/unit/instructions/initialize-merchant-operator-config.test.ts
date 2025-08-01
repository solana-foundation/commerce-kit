import { expect } from '@jest/globals';
import {
  getInitializeMerchantOperatorConfigInstruction,
  INITIALIZE_MERCHANT_OPERATOR_CONFIG_DISCRIMINATOR,
  FeeType,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';
import { SYSTEM_PROGRAM_ADDRESS } from 'gill/programs';

describe('initializeMerchantOperatorConfig', () => {
  it('should create a valid initialize merchant operator config instruction', () => {
    const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
    const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);

    const instruction = getInitializeMerchantOperatorConfigInstruction({
      payer,
      authority,
      merchant: TEST_ADDRESSES.MERCHANT,
      operator: TEST_ADDRESSES.OPERATOR,
      config: TEST_ADDRESSES.CONFIG,
      version: 1,
      bump: 255,
      operatorFee: 100,
      feeType: FeeType.Fixed,
      policies: [
        {
          __kind: 'Refund',
          fields: [{ maxAmount: 100, maxTimeAfterPurchase: 10 }],
        },
      ],
      acceptedCurrencies: [],
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(6);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.READONLY_SIGNER); // authority
    expect(instruction.accounts[2].role).toBe(AccountRole.READONLY); // merchant
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // operator
    expect(instruction.accounts[4].role).toBe(AccountRole.WRITABLE); // config
    expect(instruction.accounts[5].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[5].address).toBe(SYSTEM_PROGRAM_ADDRESS);

    // Test data
    const expectedDiscriminator = new Uint8Array([INITIALIZE_MERCHANT_OPERATOR_CONFIG_DISCRIMINATOR]);
    expect(instruction.data.slice(0, 1)).toEqual(expectedDiscriminator);
  });
});