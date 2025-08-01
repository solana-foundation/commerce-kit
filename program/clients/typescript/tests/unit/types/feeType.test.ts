import { expect } from '@jest/globals';
import {
  FeeType,
  getFeeTypeEncoder,
  getFeeTypeDecoder,
  getFeeTypeCodec,
} from '../../../src/generated/types/feeType';

describe('FeeType', () => {
  it('should have correct enum values', () => {
    expect(FeeType.Bps).toBe(0);
    expect(FeeType.Fixed).toBe(1);
  });

  it('should serialize fee type values correctly', () => {
    const encoder = getFeeTypeEncoder();
    
    expect(encoder.encode(FeeType.Bps)).toEqual(new Uint8Array([0]));
    expect(encoder.encode(FeeType.Fixed)).toEqual(new Uint8Array([1]));
  });

  it('should deserialize fee type values correctly', () => {
    const decoder = getFeeTypeDecoder();
    
    expect(decoder.decode(new Uint8Array([0]))).toBe(FeeType.Bps);
    expect(decoder.decode(new Uint8Array([1]))).toBe(FeeType.Fixed);
  });

  it('should roundtrip encode/decode correctly', () => {
    const codec = getFeeTypeCodec();
    const feeTypes = [FeeType.Bps, FeeType.Fixed];
    
    feeTypes.forEach((feeType) => {
      const encoded = codec.encode(feeType);
      const decoded = codec.decode(encoded);
      expect(decoded).toBe(feeType);
    });
  });
});