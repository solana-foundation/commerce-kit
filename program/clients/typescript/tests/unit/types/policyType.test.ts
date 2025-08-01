import { expect } from '@jest/globals';
import {
  PolicyType,
  getPolicyTypeEncoder,
  getPolicyTypeDecoder,
  getPolicyTypeCodec,
} from '../../../src/generated/types/policyType';

describe('PolicyType', () => {
  it('should have correct enum values', () => {
    expect(PolicyType.Refund).toBe(0);
    expect(PolicyType.Chargeback).toBe(1);
    expect(PolicyType.Settlement).toBe(2);
  });

  it('should serialize policy type values correctly', () => {
    const encoder = getPolicyTypeEncoder();
    
    expect(encoder.encode(PolicyType.Refund)).toEqual(new Uint8Array([0]));
    expect(encoder.encode(PolicyType.Chargeback)).toEqual(new Uint8Array([1]));
    expect(encoder.encode(PolicyType.Settlement)).toEqual(new Uint8Array([2]));
  });

  it('should deserialize policy type values correctly', () => {
    const decoder = getPolicyTypeDecoder();
    
    expect(decoder.decode(new Uint8Array([0]))).toBe(PolicyType.Refund);
    expect(decoder.decode(new Uint8Array([1]))).toBe(PolicyType.Chargeback);
    expect(decoder.decode(new Uint8Array([2]))).toBe(PolicyType.Settlement);
  });

  it('should roundtrip encode/decode correctly', () => {
    const codec = getPolicyTypeCodec();
    const policyTypes = [PolicyType.Refund, PolicyType.Chargeback, PolicyType.Settlement];
    
    policyTypes.forEach((policyType) => {
      const encoded = codec.encode(policyType);
      const decoded = codec.decode(encoded);
      expect(decoded).toBe(policyType);
    });
  });
});