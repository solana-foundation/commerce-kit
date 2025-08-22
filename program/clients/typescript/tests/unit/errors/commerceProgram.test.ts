import { expect } from '@jest/globals';
import {
  // Error constants
  COMMERCE_PROGRAM_ERROR__INVALID_MINT,
  COMMERCE_PROGRAM_ERROR__INVALID_PAYMENT_STATUS,
  COMMERCE_PROGRAM_ERROR__INSUFFICIENT_SETTLEMENT_AMOUNT,
  COMMERCE_PROGRAM_ERROR__SETTLEMENT_TOO_EARLY,
  COMMERCE_PROGRAM_ERROR__REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT,
  COMMERCE_PROGRAM_ERROR__REFUND_WINDOW_EXPIRED,
  COMMERCE_PROGRAM_ERROR__INVALID_EVENT_AUTHORITY,
  COMMERCE_PROGRAM_ERROR__INVALID_ATA,
  COMMERCE_PROGRAM_ERROR__PAYMENT_CLOSE_WINDOW_NOT_REACHED,
  COMMERCE_PROGRAM_ERROR__MERCHANT_OWNER_MISMATCH,
  COMMERCE_PROGRAM_ERROR__MERCHANT_INVALID_PDA,
  COMMERCE_PROGRAM_ERROR__OPERATOR_OWNER_MISMATCH,
  COMMERCE_PROGRAM_ERROR__OPERATOR_INVALID_PDA,
  COMMERCE_PROGRAM_ERROR__OPERATOR_MISMATCH,
  COMMERCE_PROGRAM_ERROR__MERCHANT_MISMATCH,
  COMMERCE_PROGRAM_ERROR__ORDER_ID_INVALID,
  COMMERCE_PROGRAM_ERROR__MERCHANT_OPERATOR_CONFIG_INVALID_PDA,
  COMMERCE_PROGRAM_ERROR__ACCEPTED_CURRENCIES_EMPTY,
  COMMERCE_PROGRAM_ERROR__DUPLICATE_MINT,
  // Types and functions
  type CommerceProgramError,
  getCommerceProgramErrorMessage,
  isCommerceProgramError,
} from '../../../src/generated/errors/commerceProgram';
import { COMMERCE_PROGRAM_PROGRAM_ADDRESS } from '../../../src/generated/programs';

describe('Commerce Program Errors', () => {
  describe('Error Constants', () => {
    it('should have correct error code values matching program implementation', () => {
      expect(COMMERCE_PROGRAM_ERROR__INVALID_MINT).toBe(0);
      expect(COMMERCE_PROGRAM_ERROR__INVALID_PAYMENT_STATUS).toBe(1);
      expect(COMMERCE_PROGRAM_ERROR__INSUFFICIENT_SETTLEMENT_AMOUNT).toBe(2);
      expect(COMMERCE_PROGRAM_ERROR__SETTLEMENT_TOO_EARLY).toBe(3);
      expect(COMMERCE_PROGRAM_ERROR__REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT).toBe(4);
      expect(COMMERCE_PROGRAM_ERROR__REFUND_WINDOW_EXPIRED).toBe(5);
      expect(COMMERCE_PROGRAM_ERROR__INVALID_EVENT_AUTHORITY).toBe(6);
      expect(COMMERCE_PROGRAM_ERROR__INVALID_ATA).toBe(7);
      expect(COMMERCE_PROGRAM_ERROR__PAYMENT_CLOSE_WINDOW_NOT_REACHED).toBe(8);
      expect(COMMERCE_PROGRAM_ERROR__MERCHANT_OWNER_MISMATCH).toBe(9);
      expect(COMMERCE_PROGRAM_ERROR__MERCHANT_INVALID_PDA).toBe(10);
      expect(COMMERCE_PROGRAM_ERROR__OPERATOR_OWNER_MISMATCH).toBe(11);
      expect(COMMERCE_PROGRAM_ERROR__OPERATOR_INVALID_PDA).toBe(12);
      expect(COMMERCE_PROGRAM_ERROR__OPERATOR_MISMATCH).toBe(13);
      expect(COMMERCE_PROGRAM_ERROR__MERCHANT_MISMATCH).toBe(14);
      expect(COMMERCE_PROGRAM_ERROR__ORDER_ID_INVALID).toBe(15);
      expect(COMMERCE_PROGRAM_ERROR__MERCHANT_OPERATOR_CONFIG_INVALID_PDA).toBe(16);
      expect(COMMERCE_PROGRAM_ERROR__ACCEPTED_CURRENCIES_EMPTY).toBe(17);
      expect(COMMERCE_PROGRAM_ERROR__DUPLICATE_MINT).toBe(18);
    });

    it('should have sequential error codes starting from 0', () => {
      const expectedValues = [
        COMMERCE_PROGRAM_ERROR__INVALID_MINT,
        COMMERCE_PROGRAM_ERROR__INVALID_PAYMENT_STATUS,
        COMMERCE_PROGRAM_ERROR__INSUFFICIENT_SETTLEMENT_AMOUNT,
        COMMERCE_PROGRAM_ERROR__SETTLEMENT_TOO_EARLY,
        COMMERCE_PROGRAM_ERROR__REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT,
        COMMERCE_PROGRAM_ERROR__REFUND_WINDOW_EXPIRED,
        COMMERCE_PROGRAM_ERROR__INVALID_EVENT_AUTHORITY,
        COMMERCE_PROGRAM_ERROR__INVALID_ATA,
        COMMERCE_PROGRAM_ERROR__PAYMENT_CLOSE_WINDOW_NOT_REACHED,
        COMMERCE_PROGRAM_ERROR__MERCHANT_OWNER_MISMATCH,
        COMMERCE_PROGRAM_ERROR__MERCHANT_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__OPERATOR_OWNER_MISMATCH,
        COMMERCE_PROGRAM_ERROR__OPERATOR_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__OPERATOR_MISMATCH,
        COMMERCE_PROGRAM_ERROR__MERCHANT_MISMATCH,
        COMMERCE_PROGRAM_ERROR__ORDER_ID_INVALID,
        COMMERCE_PROGRAM_ERROR__MERCHANT_OPERATOR_CONFIG_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__ACCEPTED_CURRENCIES_EMPTY,
        COMMERCE_PROGRAM_ERROR__DUPLICATE_MINT,
      ];

      expectedValues.forEach((value, index) => {
        expect(value).toBe(index);
      });
    });

    it('should export all error constants as numbers', () => {
      const errorConstants = [
        COMMERCE_PROGRAM_ERROR__INVALID_MINT,
        COMMERCE_PROGRAM_ERROR__INVALID_PAYMENT_STATUS,
        COMMERCE_PROGRAM_ERROR__INSUFFICIENT_SETTLEMENT_AMOUNT,
        COMMERCE_PROGRAM_ERROR__SETTLEMENT_TOO_EARLY,
        COMMERCE_PROGRAM_ERROR__REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT,
        COMMERCE_PROGRAM_ERROR__REFUND_WINDOW_EXPIRED,
        COMMERCE_PROGRAM_ERROR__INVALID_EVENT_AUTHORITY,
        COMMERCE_PROGRAM_ERROR__INVALID_ATA,
        COMMERCE_PROGRAM_ERROR__PAYMENT_CLOSE_WINDOW_NOT_REACHED,
        COMMERCE_PROGRAM_ERROR__MERCHANT_OWNER_MISMATCH,
        COMMERCE_PROGRAM_ERROR__MERCHANT_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__OPERATOR_OWNER_MISMATCH,
        COMMERCE_PROGRAM_ERROR__OPERATOR_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__OPERATOR_MISMATCH,
        COMMERCE_PROGRAM_ERROR__MERCHANT_MISMATCH,
        COMMERCE_PROGRAM_ERROR__ORDER_ID_INVALID,
        COMMERCE_PROGRAM_ERROR__MERCHANT_OPERATOR_CONFIG_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__ACCEPTED_CURRENCIES_EMPTY,
        COMMERCE_PROGRAM_ERROR__DUPLICATE_MINT,
      ];

      errorConstants.forEach((constant) => {
        expect(typeof constant).toBe('number');
        expect(Number.isInteger(constant)).toBe(true);
        expect(constant).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Error Messages', () => {
    // Set NODE_ENV to ensure error messages are available in tests
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should return correct error messages for each error code', () => {
      const errorMessages = [
        { code: COMMERCE_PROGRAM_ERROR__INVALID_MINT, message: 'Incorrect mint provided' },
        { code: COMMERCE_PROGRAM_ERROR__INVALID_PAYMENT_STATUS, message: 'Invalid payment status for the operation' },
        { code: COMMERCE_PROGRAM_ERROR__INSUFFICIENT_SETTLEMENT_AMOUNT, message: 'Insufficient settlement amount' },
        { code: COMMERCE_PROGRAM_ERROR__SETTLEMENT_TOO_EARLY, message: 'Settlement attempted too early' },
        { code: COMMERCE_PROGRAM_ERROR__REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT, message: 'Refund amount exceeds policy limit' },
        { code: COMMERCE_PROGRAM_ERROR__REFUND_WINDOW_EXPIRED, message: 'Refund window expired' },
        { code: COMMERCE_PROGRAM_ERROR__INVALID_EVENT_AUTHORITY, message: 'Invalid event authority' },
        { code: COMMERCE_PROGRAM_ERROR__INVALID_ATA, message: 'Invalid ATA' },
        { code: COMMERCE_PROGRAM_ERROR__PAYMENT_CLOSE_WINDOW_NOT_REACHED, message: 'Payment close window not reached' },
        { code: COMMERCE_PROGRAM_ERROR__MERCHANT_OWNER_MISMATCH, message: 'Merchant owner does not match expected owner' },
        { code: COMMERCE_PROGRAM_ERROR__MERCHANT_INVALID_PDA, message: 'Merchant PDA is invalid' },
        { code: COMMERCE_PROGRAM_ERROR__OPERATOR_OWNER_MISMATCH, message: 'Operator owner does not match expected owner' },
        { code: COMMERCE_PROGRAM_ERROR__OPERATOR_INVALID_PDA, message: 'Operator PDA is invalid' },
        { code: COMMERCE_PROGRAM_ERROR__OPERATOR_MISMATCH, message: 'Operator does not match config operator' },
        { code: COMMERCE_PROGRAM_ERROR__MERCHANT_MISMATCH, message: 'Merchant does not match config merchant' },
        { code: COMMERCE_PROGRAM_ERROR__ORDER_ID_INVALID, message: 'Order ID is invalid or already used' },
        { code: COMMERCE_PROGRAM_ERROR__MERCHANT_OPERATOR_CONFIG_INVALID_PDA, message: 'MerchantOperatorConfig PDA is invalid' },
        { code: COMMERCE_PROGRAM_ERROR__ACCEPTED_CURRENCIES_EMPTY, message: 'Accepted currencies is empty' },
        { code: COMMERCE_PROGRAM_ERROR__DUPLICATE_MINT, message: 'Duplicate mint in accepted currencies' },
      ];

      errorMessages.forEach(({ code, message }) => {
        expect(getCommerceProgramErrorMessage(code)).toBe(message);
      });
    });

    it('should return production message when NODE_ENV is production', () => {
      // Ref: https://github.com/codama-idl/codama/blob/62ad68d475fdccfa6315f455564a091508046987/packages/errors/README.md?plain=1#L33
      process.env.NODE_ENV = 'production';

      const result = getCommerceProgramErrorMessage(COMMERCE_PROGRAM_ERROR__INVALID_MINT);
      expect(result).toBe('Error message not available in production bundles.');
    });

    it('should handle all valid error codes without throwing', () => {
      const allErrorCodes: CommerceProgramError[] = [
        COMMERCE_PROGRAM_ERROR__INVALID_MINT,
        COMMERCE_PROGRAM_ERROR__INVALID_PAYMENT_STATUS,
        COMMERCE_PROGRAM_ERROR__INSUFFICIENT_SETTLEMENT_AMOUNT,
        COMMERCE_PROGRAM_ERROR__SETTLEMENT_TOO_EARLY,
        COMMERCE_PROGRAM_ERROR__REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT,
        COMMERCE_PROGRAM_ERROR__REFUND_WINDOW_EXPIRED,
        COMMERCE_PROGRAM_ERROR__INVALID_EVENT_AUTHORITY,
        COMMERCE_PROGRAM_ERROR__INVALID_ATA,
        COMMERCE_PROGRAM_ERROR__PAYMENT_CLOSE_WINDOW_NOT_REACHED,
        COMMERCE_PROGRAM_ERROR__MERCHANT_OWNER_MISMATCH,
        COMMERCE_PROGRAM_ERROR__MERCHANT_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__OPERATOR_OWNER_MISMATCH,
        COMMERCE_PROGRAM_ERROR__OPERATOR_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__OPERATOR_MISMATCH,
        COMMERCE_PROGRAM_ERROR__MERCHANT_MISMATCH,
        COMMERCE_PROGRAM_ERROR__ORDER_ID_INVALID,
        COMMERCE_PROGRAM_ERROR__MERCHANT_OPERATOR_CONFIG_INVALID_PDA,
        COMMERCE_PROGRAM_ERROR__ACCEPTED_CURRENCIES_EMPTY,
        COMMERCE_PROGRAM_ERROR__DUPLICATE_MINT,
      ];

      allErrorCodes.forEach((code) => {
        expect(() => getCommerceProgramErrorMessage(code)).not.toThrow();
        expect(getCommerceProgramErrorMessage(code)).toBeTruthy();
      });
    });
  });
});