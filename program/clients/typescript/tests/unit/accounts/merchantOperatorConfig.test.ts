import { expect } from '@jest/globals';
import {
  getMerchantOperatorConfigEncoder,
  getMerchantOperatorConfigDecoder,
  getMerchantOperatorConfigCodec,
  getMerchantOperatorConfigSize,
  type MerchantOperatorConfigArgs,
} from '../../../src/generated/accounts/merchantOperatorConfig';
import { FeeType } from '../../../src/generated/types/feeType';
import { address, getAddressCodec } from 'gill';

describe('MerchantOperatorConfig Account', () => {
  const mockConfigData: MerchantOperatorConfigArgs = {
    discriminator: 3,
    version: 1,
    bump: 253,
    merchant: address('CvKn4r9xL7haQJBNBZMNPkK5xPCQPwQJbM7WPfkNxBKJ'),
    operator: address('3TfKatasYChGMgqBqMnyFRrK8eK8MqmLMhQV7QGMXWDr'),
    operatorFee: 250n, // 2.5% in basis points or fixed amount
    feeType: FeeType.Bps,
    currentOrderId: 100,
    numPolicies: 5,
    numAcceptedCurrencies: 3,
    daysToClose: 0,
  };

  it('should serialize merchant operator config account data correctly', () => {
    const encoder = getMerchantOperatorConfigEncoder();
    const serialized = encoder.encode(mockConfigData);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    // NOTE: Check actual size matches expected
    // expect(serialized.length).toBe(getMerchantOperatorConfigSize());
    
    // Check discriminator
    expect(serialized[0]).toBe(3);
    
    // Verify addresses are encoded correctly
    const addressCodec = getAddressCodec();
    const merchantBytes = addressCodec.encode(mockConfigData.merchant);
    const operatorBytes = addressCodec.encode(mockConfigData.operator);
    
    // Merchant address starts at position 6 (after discriminator, version, bump)
    // 1 + 4 + 1 = 6
    expect(serialized.slice(6, 38)).toEqual(merchantBytes);
    // Operator address starts at position 38
    expect(serialized.slice(38, 70)).toEqual(operatorBytes);
  });

  it('should deserialize merchant operator config account data correctly', () => {
    const codec = getMerchantOperatorConfigCodec();
    const serialized = codec.encode(mockConfigData);
    const deserialized = codec.decode(serialized);
    
    expect(deserialized.discriminator).toBe(mockConfigData.discriminator);
    expect(deserialized.version).toBe(mockConfigData.version);
    expect(deserialized.bump).toBe(mockConfigData.bump);
    expect(deserialized.merchant).toBe(mockConfigData.merchant);
    expect(deserialized.operator).toBe(mockConfigData.operator);
    expect(deserialized.operatorFee).toBe(mockConfigData.operatorFee);
    expect(deserialized.feeType).toBe(mockConfigData.feeType);
    expect(deserialized.currentOrderId).toBe(mockConfigData.currentOrderId);
    expect(deserialized.numPolicies).toBe(mockConfigData.numPolicies);
    expect(deserialized.numAcceptedCurrencies).toBe(mockConfigData.numAcceptedCurrencies);
  });

  it('should validate merchant operator config account structure', () => {
    const decoder = getMerchantOperatorConfigDecoder();
    const encoder = getMerchantOperatorConfigEncoder();
    
    // Test with valid data
    const encoded = encoder.encode(mockConfigData);
    const decoded = decoder.decode(encoded);
    
    // Validate structure
    expect(decoded).toHaveProperty('discriminator');
    expect(decoded).toHaveProperty('version');
    expect(decoded).toHaveProperty('bump');
    expect(decoded).toHaveProperty('merchant');
    expect(decoded).toHaveProperty('operator');
    expect(decoded).toHaveProperty('operatorFee');
    expect(decoded).toHaveProperty('feeType');
    expect(decoded).toHaveProperty('currentOrderId');
    expect(decoded).toHaveProperty('numPolicies');
    expect(decoded).toHaveProperty('numAcceptedCurrencies');
    
    // Validate types
    expect(typeof decoded.discriminator).toBe('number');
    expect(typeof decoded.version).toBe('number');
    expect(typeof decoded.bump).toBe('number');
    expect(typeof decoded.merchant).toBe('string');
    expect(typeof decoded.operator).toBe('string');
    expect(typeof decoded.operatorFee).toBe('bigint');
    expect(typeof decoded.feeType).toBe('number');
    expect(typeof decoded.currentOrderId).toBe('number');
    expect(typeof decoded.numPolicies).toBe('number');
    expect(typeof decoded.numAcceptedCurrencies).toBe('number');
    const serialized = encoder.encode(mockConfigData);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBe(getMerchantOperatorConfigSize());
    
    expect(getMerchantOperatorConfigSize()).toBe(
       1 + // discriminator
       4 + // version
       1 + // bump
       32 + // merchant
       32 + // operator
       8 + // operator_fee
       1 + // fee_type
       4 + // current_order_id
       2 + // days_to_close
       4 + // num_policies
       4 // num_accepted_currencies
    );
  });

  it('should handle edge cases for merchant operator config account', () => {
    // Test with minimum values
    const minData: MerchantOperatorConfigArgs = {
      discriminator: 0,
      version: 0,
      bump: 0,
      merchant: address('11111111111111111111111111111111'),
      operator: address('11111111111111111111111111111111'),
      operatorFee: 0n,
      feeType: FeeType.Bps,
      currentOrderId: 0,
      numPolicies: 0,
      numAcceptedCurrencies: 0,
      daysToClose: 0,
    };
    
    const codec = getMerchantOperatorConfigCodec();
    const encoded = codec.encode(minData);
    const decoded = codec.decode(encoded);
    
    expect(decoded.version).toBe(0);
    expect(decoded.operatorFee).toBe(0n);
    expect(decoded.currentOrderId).toBe(0);
    
    // Test with different fee types
    const fixedFeeData: MerchantOperatorConfigArgs = {
      ...mockConfigData,
      feeType: FeeType.Fixed,
      operatorFee: 1000000n, // 1 token with 6 decimals
    };
    
    const fixedEncoded = codec.encode(fixedFeeData);
    const fixedDecoded = codec.decode(fixedEncoded);
    
    expect(fixedDecoded.feeType).toBe(FeeType.Fixed);
    expect(fixedDecoded.operatorFee).toBe(1000000n);
    
    // Test with maximum values
    const maxData: MerchantOperatorConfigArgs = {
      discriminator: 255,
      version: 4294967295,
      bump: 255,
      merchant: address('CvKn4r9xL7haQJBNBZMNPkK5xPCQPwQJbM7WPfkNxBKJ'),
      operator: address('3TfKatasYChGMgqBqMnyFRrK8eK8MqmLMhQV7QGMXWDr'),
      operatorFee: 18446744073709551615n, // Max u64
      feeType: FeeType.Fixed,
      currentOrderId: 4294967295, // Max u32
      numPolicies: 4294967295,
      numAcceptedCurrencies: 4294967295,
      daysToClose: 0,
    };
    
    const maxEncoded = codec.encode(maxData);
    const maxDecoded = codec.decode(maxEncoded);
    
    expect(maxDecoded.version).toBe(maxData.version);
    expect(maxDecoded.operatorFee).toBe(maxData.operatorFee);
    expect(maxDecoded.currentOrderId).toBe(maxData.currentOrderId);
  });
});