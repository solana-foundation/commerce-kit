import { expect } from '@jest/globals';
import {
  getPolicyDataEncoder,
  getPolicyDataCodec,
  policyData,
  isPolicyData,
  type PolicyDataArgs,
} from '../../../src/generated/types/policyData';
import type { RefundPolicyArgs } from '../../../src/generated/types/refundPolicy';
import type { ChargebackPolicyArgs } from '../../../src/generated/types/chargebackPolicy';
import type { SettlementPolicyArgs } from '../../../src/generated/types/settlementPolicy';

describe('PolicyData', () => {
  const mockRefundPolicy: RefundPolicyArgs = {
    maxAmount: 1000000n,
    maxTimeAfterPurchase: 86400n,
  };

  const mockChargebackPolicy: ChargebackPolicyArgs = {
    maxAmount: 5000000n,
    maxTimeAfterPurchase: 2592000n,
  };

  const mockSettlementPolicy: SettlementPolicyArgs = {
    minSettlementAmount: 10000000n,
    settlementFrequencyHours: 24,
    autoSettle: true,
  };

  it('should serialize refund policy data correctly', () => {
    const encoder = getPolicyDataEncoder();
    const refundData: PolicyDataArgs = policyData('Refund', [mockRefundPolicy]);
    const serialized = encoder.encode(refundData);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized.length).toBe(17); // policy_type (1 byte) + RefundPolicy (16 bytes)
    expect(serialized[0]).toBe(0); // Refund enum value
  });

  it('should serialize chargeback policy data correctly', () => {
    const encoder = getPolicyDataEncoder();
    const chargebackData: PolicyDataArgs = policyData('Chargeback', [mockChargebackPolicy]);
    const serialized = encoder.encode(chargebackData);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized[0]).toBe(1); // Chargeback enum value
  });

  it('should serialize settlement policy data correctly', () => {
    const encoder = getPolicyDataEncoder();
    const settlementData: PolicyDataArgs = policyData('Settlement', [mockSettlementPolicy]);
    const serialized = encoder.encode(settlementData);
    
    expect(serialized).toBeInstanceOf(Uint8Array);
    expect(serialized[0]).toBe(2); // Settlement enum value
  });

  it('should deserialize policy data correctly', () => {
    const codec = getPolicyDataCodec();
    
    // Test Refund policy
    const refundData: PolicyDataArgs = policyData('Refund', [mockRefundPolicy]);
    const refundSerialized = codec.encode(refundData);
    const refundDeserialized = codec.decode(refundSerialized);
    
    expect(refundDeserialized.__kind).toBe('Refund');
    expect(refundDeserialized.fields[0].maxAmount).toBe(mockRefundPolicy.maxAmount);
    expect(refundDeserialized.fields[0].maxTimeAfterPurchase).toBe(mockRefundPolicy.maxTimeAfterPurchase);
    
    // Test Chargeback policy
    const chargebackData: PolicyDataArgs = policyData('Chargeback', [mockChargebackPolicy]);
    const chargebackSerialized = codec.encode(chargebackData);
    const chargebackDeserialized = codec.decode(chargebackSerialized);
    
    expect(chargebackDeserialized.__kind).toBe('Chargeback');
    expect(chargebackDeserialized.fields[0].maxAmount).toBe(mockChargebackPolicy.maxAmount);
    
    // Test Settlement policy
    const settlementData: PolicyDataArgs = policyData('Settlement', [mockSettlementPolicy]);
    const settlementSerialized = codec.encode(settlementData);
    const settlementDeserialized = codec.decode(settlementSerialized);
    
    expect(settlementDeserialized.__kind).toBe('Settlement');
    expect(settlementDeserialized.fields[0].minSettlementAmount).toBe(mockSettlementPolicy.minSettlementAmount);
    expect(settlementDeserialized.fields[0].autoSettle).toBe(mockSettlementPolicy.autoSettle);
  });

  it('should validate policy data structure', () => {
    const codec = getPolicyDataCodec();
    const refundData: PolicyDataArgs = policyData('Refund', [mockRefundPolicy]);
    
    const encoded = codec.encode(refundData);
    const decoded = codec.decode(encoded);
    
    // Validate structure
    expect(decoded).toHaveProperty('__kind');
    expect(decoded).toHaveProperty('fields');
    expect(Array.isArray(decoded.fields)).toBe(true);
    expect(decoded.fields).toHaveLength(1);
  });

  it('should handle policy data helper functions', () => {
    // Test policyData helper
    const refundData = policyData('Refund', [mockRefundPolicy]);
    expect(refundData.__kind).toBe('Refund');
    expect(refundData.fields).toEqual([mockRefundPolicy]);
    
    const chargebackData = policyData('Chargeback', [mockChargebackPolicy]);
    expect(chargebackData.__kind).toBe('Chargeback');
    expect(chargebackData.fields).toEqual([mockChargebackPolicy]);
    
    const settlementData = policyData('Settlement', [mockSettlementPolicy]);
    expect(settlementData.__kind).toBe('Settlement');
    expect(settlementData.fields).toEqual([mockSettlementPolicy]);
  });

  it('should handle isPolicyData type guard', () => {
    const codec = getPolicyDataCodec();
    
    const refundData: PolicyDataArgs = policyData('Refund', [mockRefundPolicy]);
    const serialized = codec.encode(refundData);
    const deserialized = codec.decode(serialized);
    
    // Test type guards
    expect(isPolicyData('Refund', deserialized)).toBe(true);
    expect(isPolicyData('Chargeback', deserialized)).toBe(false);
    expect(isPolicyData('Settlement', deserialized)).toBe(false);
    
    // Test with chargeback data
    const chargebackData: PolicyDataArgs = policyData('Chargeback', [mockChargebackPolicy]);
    const chargebackSerialized = codec.encode(chargebackData);
    const chargebackDeserialized = codec.decode(chargebackSerialized);
    
    expect(isPolicyData('Chargeback', chargebackDeserialized)).toBe(true);
    expect(isPolicyData('Refund', chargebackDeserialized)).toBe(false);
  });

  it('should handle edge cases for policy data', () => {
    const codec = getPolicyDataCodec();
    
    // Test with minimum values
    const minRefundPolicy: RefundPolicyArgs = {
      maxAmount: 0n,
      maxTimeAfterPurchase: 0n,
    };
    
    const minRefundData: PolicyDataArgs = policyData('Refund', [minRefundPolicy]);
    const minEncoded = codec.encode(minRefundData);
    const minDecoded = codec.decode(minEncoded);
    
    expect(minDecoded.__kind).toBe('Refund');
    expect(minDecoded.fields[0].maxAmount).toBe(0n);
    
    // Test settlement with autoSettle false
    const manualSettlementPolicy: SettlementPolicyArgs = {
      minSettlementAmount: 1000000n,
      settlementFrequencyHours: 168, // Weekly
      autoSettle: false,
    };
    
    const manualSettlementData: PolicyDataArgs = policyData('Settlement', [manualSettlementPolicy]);
    const manualEncoded = codec.encode(manualSettlementData);
    const manualDecoded = codec.decode(manualEncoded);
    
    expect(manualDecoded.__kind).toBe('Settlement');
    expect(manualDecoded.fields[0].autoSettle).toBe(false);
    expect(manualDecoded.fields[0].settlementFrequencyHours).toBe(168);
  });
});