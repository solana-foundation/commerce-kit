import { expect } from '@jest/globals';
import {
  getSettlementPolicyEncoder,
  getSettlementPolicyDecoder,
  getSettlementPolicyCodec,
  type SettlementPolicyArgs,
} from '../../../src/generated/types/settlementPolicy';

describe('SettlementPolicy', () => {
  const mockSettlementPolicy: SettlementPolicyArgs = {
    minSettlementAmount: 10000000n, // 10 tokens with 6 decimals
    settlementFrequencyHours: 24, // Daily settlement
    autoSettle: true,
  };

  it('should serialize settlement policy data correctly', () => {
    const encoder = getSettlementPolicyEncoder();
    const serialized = encoder.encode(mockSettlementPolicy);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBe(13); // u64 + u32 + bool = 8 + 4 + 1 = 13 bytes
  });

  it('should deserialize settlement policy data correctly', () => {
    const codec = getSettlementPolicyCodec();
    const serialized = codec.encode(mockSettlementPolicy);
    const deserialized = codec.decode(serialized);
    
    expect(deserialized.minSettlementAmount).toBe(mockSettlementPolicy.minSettlementAmount);
    expect(deserialized.settlementFrequencyHours).toBe(mockSettlementPolicy.settlementFrequencyHours);
    expect(deserialized.autoSettle).toBe(mockSettlementPolicy.autoSettle);
  });

  it('should validate settlement policy structure', () => {
    const decoder = getSettlementPolicyDecoder();
    const encoder = getSettlementPolicyEncoder();
    
    const encoded = encoder.encode(mockSettlementPolicy);
    const decoded = decoder.decode(encoded);
    
    // Validate structure
    expect(decoded).toHaveProperty('minSettlementAmount');
    expect(decoded).toHaveProperty('settlementFrequencyHours');
    expect(decoded).toHaveProperty('autoSettle');
    
    // Validate types
    expect(typeof decoded.minSettlementAmount).toBe('bigint');
    expect(typeof decoded.settlementFrequencyHours).toBe('number');
    expect(typeof decoded.autoSettle).toBe('boolean');
  });

  it('should handle edge cases for settlement policy', () => {
    const codec = getSettlementPolicyCodec();
    
    // Test with minimum values and false autoSettle
    const minData: SettlementPolicyArgs = {
      minSettlementAmount: 0n,
      settlementFrequencyHours: 0,
      autoSettle: false,
    };
    
    const minEncoded = codec.encode(minData);
    const minDecoded = codec.decode(minEncoded);
    
    expect(minDecoded.minSettlementAmount).toBe(0n);
    expect(minDecoded.settlementFrequencyHours).toBe(0);
    expect(minDecoded.autoSettle).toBe(false);
    
    // Test with maximum values
    const maxData: SettlementPolicyArgs = {
      minSettlementAmount: 18446744073709551615n, // Max u64
      settlementFrequencyHours: 4294967295, // Max u32
      autoSettle: true,
    };
    
    const maxEncoded = codec.encode(maxData);
    const maxDecoded = codec.decode(maxEncoded);
    
    expect(maxDecoded.minSettlementAmount).toBe(maxData.minSettlementAmount);
    expect(maxDecoded.settlementFrequencyHours).toBe(maxData.settlementFrequencyHours);
    expect(maxDecoded.autoSettle).toBe(true);
    
    // Test different settlement frequencies
    const weeklyData: SettlementPolicyArgs = {
      ...mockSettlementPolicy,
      settlementFrequencyHours: 168, // Weekly (7 * 24)
      autoSettle: false,
    };
    
    const weeklyEncoded = codec.encode(weeklyData);
    const weeklyDecoded = codec.decode(weeklyEncoded);
    
    expect(weeklyDecoded.settlementFrequencyHours).toBe(168);
    expect(weeklyDecoded.autoSettle).toBe(false);
  });
});