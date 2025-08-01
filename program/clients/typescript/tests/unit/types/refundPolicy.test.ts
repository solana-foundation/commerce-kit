import { expect } from '@jest/globals';
import {
  getRefundPolicyEncoder,
  getRefundPolicyDecoder,
  getRefundPolicyCodec,
  type RefundPolicyArgs,
} from '../../../src/generated/types/refundPolicy';

describe('RefundPolicy', () => {
  const mockRefundPolicy: RefundPolicyArgs = {
    maxAmount: 1000000n, // 1 token with 6 decimals
    maxTimeAfterPurchase: 86400n, // 24 hours in seconds
  };

  it('should serialize refund policy data correctly', () => {
    const encoder = getRefundPolicyEncoder();
    const serialized = encoder.encode(mockRefundPolicy);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBe(16); // 2 * u64 = 16 bytes
  });

  it('should deserialize refund policy data correctly', () => {
    const codec = getRefundPolicyCodec();
    const serialized = codec.encode(mockRefundPolicy);
    const deserialized = codec.decode(serialized);
    
    expect(deserialized.maxAmount).toBe(mockRefundPolicy.maxAmount);
    expect(deserialized.maxTimeAfterPurchase).toBe(mockRefundPolicy.maxTimeAfterPurchase);
  });

  it('should validate refund policy structure', () => {
    const decoder = getRefundPolicyDecoder();
    const encoder = getRefundPolicyEncoder();
    
    const encoded = encoder.encode(mockRefundPolicy);
    const decoded = decoder.decode(encoded);
    
    // Validate structure
    expect(decoded).toHaveProperty('maxAmount');
    expect(decoded).toHaveProperty('maxTimeAfterPurchase');
    
    // Validate types
    expect(typeof decoded.maxAmount).toBe('bigint');
    expect(typeof decoded.maxTimeAfterPurchase).toBe('bigint');
  });

  it('should handle edge cases for refund policy', () => {
    const codec = getRefundPolicyCodec();
    
    // Test with minimum values
    const minData: RefundPolicyArgs = {
      maxAmount: 0n,
      maxTimeAfterPurchase: 0n,
    };
    
    const minEncoded = codec.encode(minData);
    const minDecoded = codec.decode(minEncoded);
    
    expect(minDecoded.maxAmount).toBe(0n);
    expect(minDecoded.maxTimeAfterPurchase).toBe(0n);
    
    // Test with maximum values
    const maxData: RefundPolicyArgs = {
      maxAmount: 18446744073709551615n, // Max u64
      maxTimeAfterPurchase: 18446744073709551615n, // Max u64
    };
    
    const maxEncoded = codec.encode(maxData);
    const maxDecoded = codec.decode(maxEncoded);
    
    expect(maxDecoded.maxAmount).toBe(maxData.maxAmount);
    expect(maxDecoded.maxTimeAfterPurchase).toBe(maxData.maxTimeAfterPurchase);
  });
});