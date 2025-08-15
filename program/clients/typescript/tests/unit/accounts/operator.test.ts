import { expect } from '@jest/globals';
import {
  getOperatorEncoder,
  getOperatorDecoder,
  getOperatorCodec,
  getOperatorSize,
  type OperatorArgs,
} from '../../../src/generated/accounts/operator';
import { address, getAddressCodec } from 'gill';

describe('Operator Account', () => {
  const mockOperatorData: OperatorArgs = {
    discriminator: 1,
    owner: address('8nqJPkDyV6GbYN8tBQfqJ5QVJH8c5aB8QrypvnZFqKvC'),
    bump: 254,
  };

  it('should serialize operator account data correctly', () => {
    const encoder = getOperatorEncoder();
    const serialized = encoder.encode(mockOperatorData);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBe(getOperatorSize());
    
    // Check discriminator
    expect(serialized[0]).toBe(1);
    
    // Verify bump is at the correct position (after discriminator and owner)
    expect(serialized[33]).toBe(254);
    
    // Verify the owner address is encoded correctly
    const addressCodec = getAddressCodec();
    const ownerBytes = addressCodec.encode(mockOperatorData.owner);
    
    // Owner address starts at position 1 (after discriminator)
    expect(serialized.slice(1, 33)).toEqual(ownerBytes);
  });

  it('should deserialize operator account data correctly', () => {
    const codec = getOperatorCodec();
    const serialized = codec.encode(mockOperatorData);
    const deserialized = codec.decode(serialized);
    
    expect(deserialized).toEqual(mockOperatorData);
    expect(deserialized.discriminator).toBe(mockOperatorData.discriminator);
    expect(deserialized.owner).toBe(mockOperatorData.owner);
    expect(deserialized.bump).toBe(mockOperatorData.bump);
  });

  it('should validate operator account structure', () => {
    const decoder = getOperatorDecoder();
    const encoder = getOperatorEncoder();
    
    // Test with valid data
    const encoded = encoder.encode(mockOperatorData);
    const decoded = decoder.decode(encoded);
    
    // Validate structure
    expect(decoded).toHaveProperty('discriminator');
    expect(decoded).toHaveProperty('owner');
    expect(decoded).toHaveProperty('bump');
    
    // Validate types
    expect(typeof decoded.discriminator).toBe('number');
    expect(typeof decoded.owner).toBe('string');
    expect(typeof decoded.bump).toBe('number');
    
    // Validate account size
    expect(getOperatorSize()).toBe(34); 
  });

  it('should handle edge cases for operator account', () => {
    // Test with minimum values
    const minData: OperatorArgs = {
      discriminator: 0,
      owner: address('11111111111111111111111111111111'),
      bump: 0,
    };
    
    const codec = getOperatorCodec();
    const encoded = codec.encode(minData);
    const decoded = codec.decode(encoded);
    
    expect(decoded).toEqual(minData);
    expect(decoded.bump).toBe(0);
    
    // Test with different discriminator
    const maxDiscriminatorData: OperatorArgs = {
      ...mockOperatorData,
      discriminator: 255,
      bump: 255,
    };
    
    const maxEncoded = codec.encode(maxDiscriminatorData);
    const maxDecoded = codec.decode(maxEncoded);
    
    expect(maxDecoded.discriminator).toBe(255);
    expect(maxDecoded.bump).toBe(255);
  });
});