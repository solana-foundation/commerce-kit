import { expect } from '@jest/globals';
import {
  getInitializeMerchantInstruction,
  INITIALIZE_MERCHANT_DISCRIMINATOR,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';
import { SYSTEM_PROGRAM_ADDRESS } from 'gill/programs';

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
      settlementUsdcAta: TEST_ADDRESSES.ATA_1,
      escrowUsdcAta: TEST_ADDRESSES.ATA_2,
      settlementUsdtAta: TEST_ADDRESSES.ATA_3,
      escrowUsdtAta: TEST_ADDRESSES.ATA_1,
      bump,
    });

    // Test program ID
    expect(instruction.programAddress).toBe(EXPECTED_PROGRAM_ADDRESS);

    // Test accounts
    expect(instruction.accounts).toHaveLength(13);
    expect(instruction.accounts[0].role).toBe(AccountRole.WRITABLE_SIGNER); // payer
    expect(instruction.accounts[1].role).toBe(AccountRole.READONLY_SIGNER); // authority
    expect(instruction.accounts[2].role).toBe(AccountRole.WRITABLE); // merchant
    expect(instruction.accounts[3].role).toBe(AccountRole.READONLY); // settlement_wallet
    expect(instruction.accounts[4].role).toBe(AccountRole.READONLY); // system_program
    expect(instruction.accounts[4].address).toBe(SYSTEM_PROGRAM_ADDRESS);
    expect(instruction.accounts[5].role).toBe(AccountRole.WRITABLE); // settlement_usdc_ata
    expect(instruction.accounts[6].role).toBe(AccountRole.WRITABLE); // escrow_usdc_ata
    expect(instruction.accounts[7].role).toBe(AccountRole.READONLY); // usdc_mint
    expect(instruction.accounts[8].role).toBe(AccountRole.WRITABLE); // settlement_usdt_ata
    expect(instruction.accounts[9].role).toBe(AccountRole.WRITABLE); // escrow_usdt_ata
    expect(instruction.accounts[10].role).toBe(AccountRole.READONLY); // usdt_mint
    expect(instruction.accounts[11].role).toBe(AccountRole.READONLY); // token_program
    expect(instruction.accounts[12].role).toBe(AccountRole.READONLY); // associated_token_program

    // Test data
    const expectedData = new Uint8Array([INITIALIZE_MERCHANT_DISCRIMINATOR, bump]);
    expect(instruction.data).toEqual(expectedData);
  });
});