import { expect } from '@jest/globals';
import {
  getChargebackPolicyEncoder,
  getChargebackPolicyDecoder,
  getChargebackPolicyCodec,
  type ChargebackPolicyArgs,
} from '../../../src/generated/types/chargebackPolicy';

describe('ChargebackPolicy', () => {
  const mockChargebackPolicy: ChargebackPolicyArgs = {
    maxAmount: 5000000n, // 5 tokens with 6 decimals
    maxTimeAfterPurchase: 2592000n, // 30 days in seconds
  };

  it('should serialize chargeback policy data correctly', () => {
    const encoder = getChargebackPolicyEncoder();
    const serialized = encoder.encode(mockChargebackPolicy);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBe(16); // 2 * u64 = 16 bytes
  });

  it('should deserialize chargeback policy data correctly', () => {
    const codec = getChargebackPolicyCodec();
    const serialized = codec.encode(mockChargebackPolicy);
    const deserialized = codec.decode(serialized);
    
    expect(deserialized.maxAmount).toBe(mockChargebackPolicy.maxAmount);
    expect(deserialized.maxTimeAfterPurchase).toBe(mockChargebackPolicy.maxTimeAfterPurchase);
  });

  it('should validate chargeback policy structure', () => {
    const decoder = getChargebackPolicyDecoder();
    const encoder = getChargebackPolicyEncoder();
    
    const encoded = encoder.encode(mockChargebackPolicy);
    const decoded = decoder.decode(encoded);
    
    // Validate structure
    expect(decoded).toHaveProperty('maxAmount');
    expect(decoded).toHaveProperty('maxTimeAfterPurchase');
    
    // Validate types
    expect(typeof decoded.maxAmount).toBe('bigint');
    expect(typeof decoded.maxTimeAfterPurchase).toBe('bigint');
  });

  it('should handle edge cases for chargeback policy', () => {
    const codec = getChargebackPolicyCodec();
    
    // Test with minimum values
    const minData: ChargebackPolicyArgs = {
      maxAmount: 0n,
      maxTimeAfterPurchase: 0n,
    };
    
    const minEncoded = codec.encode(minData);
    const minDecoded = codec.decode(minEncoded);
    
    expect(minDecoded.maxAmount).toBe(0n);
    expect(minDecoded.maxTimeAfterPurchase).toBe(0n);
    
    // Test with maximum values
    const maxData: ChargebackPolicyArgs = {
      maxAmount: 18446744073709551615n, // Max u64
      maxTimeAfterPurchase: 18446744073709551615n, // Max u64
    };
    
    const maxEncoded = codec.encode(maxData);
    const maxDecoded = codec.decode(maxEncoded);
    
    expect(maxDecoded.maxAmount).toBe(maxData.maxAmount);
    expect(maxDecoded.maxTimeAfterPurchase).toBe(maxData.maxTimeAfterPurchase);
  });
});