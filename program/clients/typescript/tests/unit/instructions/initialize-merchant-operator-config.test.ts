import { expect } from '@jest/globals';
import {
  getInitializeMerchantOperatorConfigInstruction,
  getInitializeMerchantOperatorConfigInstructionAsync,
  INITIALIZE_MERCHANT_OPERATOR_CONFIG_DISCRIMINATOR,
  FeeType,
  findMerchantOperatorConfigPda,
} from '../../../src/generated';
import { AccountRole } from 'gill';
import { mockTransactionSigner, TEST_ADDRESSES, EXPECTED_PROGRAM_ADDRESS } from '../../../tests/setup/mocks';
import { SYSTEM_PROGRAM_ADDRESS } from 'gill/programs';
import { DAYS_TO_CLOSE } from '../../integration/helpers/constants';

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
      daysToClose: DAYS_TO_CLOSE,
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

  describe('automatic merchantOperatorConfig PDA derivation', () => {
    it('should automatically derive config PDA when not provided', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const version = 1;

      // Get expected merchantOperatorConfig PDA using findMerchantOperatorConfigPda
      const [expectedConfigPda] = await findMerchantOperatorConfigPda({
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        version: version,
      });

      // Generate instruction without providing config - should be auto-derived
      const instruction = await getInitializeMerchantOperatorConfigInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        // Not providing config - should be auto-derived from merchant, operator, and version
        version: version,
        bump: 255,
        operatorFee: 100,
        feeType: FeeType.Fixed,
        daysToClose: DAYS_TO_CLOSE,
        policies: [
          {
            __kind: 'Refund',
            fields: [{ maxAmount: 100, maxTimeAfterPurchase: 10 }],
          },
        ],
        acceptedCurrencies: [],
      });

      // Verify the automatically derived config PDA matches expected address
      expect(instruction.accounts[4].address).toBe(expectedConfigPda); // config
    });

    it('should use provided config address when supplied (override auto-derivation)', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const version = 1;

      // Provide custom config address
      const customConfig = TEST_ADDRESSES.CONFIG;

      const instruction = await getInitializeMerchantOperatorConfigInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        config: customConfig,
        version: version,
        bump: 255,
        operatorFee: 100,
        feeType: FeeType.Fixed,
        daysToClose: DAYS_TO_CLOSE,
        policies: [
          {
            __kind: 'Refund',
            fields: [{ maxAmount: 100, maxTimeAfterPurchase: 10 }],
          },
        ],
        acceptedCurrencies: [],
      });

      // Verify the provided address is used instead of auto-derived one
      expect(instruction.accounts[4].address).toBe(customConfig); // config
    });

    it('should derive different config PDAs for different versions', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const version1 = 1;
      const version2 = 2;

      // Get expected merchantOperatorConfig PDAs for different versions
      const [expectedConfigPda1] = await findMerchantOperatorConfigPda({
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        version: version1,
      });

      const [expectedConfigPda2] = await findMerchantOperatorConfigPda({
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        version: version2,
      });

      // Generate instructions with different versions
      const instruction1 = await getInitializeMerchantOperatorConfigInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        version: version1,
        bump: 255,
        operatorFee: 100,
        feeType: FeeType.Fixed,
        daysToClose: DAYS_TO_CLOSE,
        policies: [],
        acceptedCurrencies: [],
      });

      const instruction2 = await getInitializeMerchantOperatorConfigInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        version: version2,
        bump: 255,
        operatorFee: 100,
        feeType: FeeType.Fixed,
        daysToClose: DAYS_TO_CLOSE,
        policies: [],
        acceptedCurrencies: [],
      });

      // Verify each config PDA is correctly derived from its respective version
      expect(instruction1.accounts[4].address).toBe(expectedConfigPda1); // config for version1
      expect(instruction2.accounts[4].address).toBe(expectedConfigPda2); // config for version2
      
      // Verify they are different addresses
      expect(expectedConfigPda1).not.toBe(expectedConfigPda2);
    });

    it('should derive different config PDAs for different merchant/operator pairs', async () => {
      const payer = mockTransactionSigner(TEST_ADDRESSES.PAYER);
      const authority = mockTransactionSigner(TEST_ADDRESSES.AUTHORITY);
      const version = 1;

      // Get expected merchantOperatorConfig PDAs for different merchant/operator pairs
      const [expectedConfigPda1] = await findMerchantOperatorConfigPda({
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        version: version,
      });

      const [expectedConfigPda2] = await findMerchantOperatorConfigPda({
        merchant: TEST_ADDRESSES.BUYER, // Using different merchant
        operator: TEST_ADDRESSES.OPERATOR,
        version: version,
      });

      // Generate instructions with different merchant/operator pairs
      const instruction1 = await getInitializeMerchantOperatorConfigInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.MERCHANT,
        operator: TEST_ADDRESSES.OPERATOR,
        version: version,
        bump: 255,
        operatorFee: 100,
        feeType: FeeType.Fixed,
        daysToClose: DAYS_TO_CLOSE,
        policies: [],
        acceptedCurrencies: [],
      });

      const instruction2 = await getInitializeMerchantOperatorConfigInstructionAsync({
        payer,
        authority,
        merchant: TEST_ADDRESSES.BUYER, // Different merchant
        operator: TEST_ADDRESSES.OPERATOR,
        version: version,
        bump: 255,
        operatorFee: 100,
        feeType: FeeType.Fixed,
        daysToClose: DAYS_TO_CLOSE,
        policies: [],
        acceptedCurrencies: [],
      });

      // Verify each config PDA is correctly derived from its respective parameters
      expect(instruction1.accounts[4].address).toBe(expectedConfigPda1);
      expect(instruction2.accounts[4].address).toBe(expectedConfigPda2);
      
      // Verify they are different addresses
      expect(expectedConfigPda1).not.toBe(expectedConfigPda2);
    });
  });
});