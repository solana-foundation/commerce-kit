import { expect } from '@jest/globals';
import {
  Status,
  getStatusEncoder,
  getStatusDecoder,
  getStatusCodec,
} from '../../../src/generated/types/status';

describe('Status', () => {
  it('should have correct enum values', () => {
    expect(Status.Paid).toBe(0);
    expect(Status.Cleared).toBe(1);
    expect(Status.Chargedback).toBe(2);
    expect(Status.Refunded).toBe(3);
  });

  it('should serialize status values correctly', () => {
    const encoder = getStatusEncoder();
    
    expect(encoder.encode(Status.Paid)).toEqual(new Uint8Array([0]));
    expect(encoder.encode(Status.Cleared)).toEqual(new Uint8Array([1]));
    expect(encoder.encode(Status.Chargedback)).toEqual(new Uint8Array([2]));
    expect(encoder.encode(Status.Refunded)).toEqual(new Uint8Array([3]));
  });

  it('should deserialize status values correctly', () => {
    const decoder = getStatusDecoder();
    
    expect(decoder.decode(new Uint8Array([0]))).toBe(Status.Paid);
    expect(decoder.decode(new Uint8Array([1]))).toBe(Status.Cleared);
    expect(decoder.decode(new Uint8Array([2]))).toBe(Status.Chargedback);
    expect(decoder.decode(new Uint8Array([3]))).toBe(Status.Refunded);
  });

  it('should roundtrip encode/decode correctly', () => {
    const codec = getStatusCodec();
    const statuses = [Status.Paid, Status.Cleared, Status.Chargedback, Status.Refunded];
    
    statuses.forEach((status) => {
      const encoded = codec.encode(status);
      const decoded = codec.decode(encoded);
      expect(decoded).toBe(status);
    });
  });
});