import {
  combineCodec,
  createDecoder,
  createEncoder,
  getAddressDecoder,
  getAddressEncoder,
  getU16Decoder,
  getU16Encoder,
  getU32Decoder,
  getU32Encoder,
  getU64Decoder,
  getU64Encoder,
  type Address,
  type Codec,
  type VariableSizeDecoder,
  type VariableSizeEncoder,
} from '@solana/kit';
import { getFeeTypeDecoder, getFeeTypeEncoder, type FeeType } from '../generated/types/feeType';
import {
  getPolicyDataDecoder,
  getPolicyDataEncoder,
  type PolicyData,
  type PolicyDataArgs,
} from '../generated/types/policyData';

export type MerchantOperatorConfig = {
  discriminator: number;
  version: number;
  bump: number;
  merchant: Address;
  operator: Address;
  operatorFee: bigint;
  feeType: FeeType;
  currentOrderId: number;
  daysToClose: number;
  numPolicies: number;
  numAcceptedCurrencies: number;
  policies: Array<PolicyData>;
  acceptedCurrencies: Array<Address>;
};

export type MerchantOperatorConfigArgs = {
  discriminator: number;
  version: number;
  bump: number;
  merchant: Address;
  operator: Address;
  operatorFee: number | bigint;
  feeType: FeeType;
  currentOrderId: number;
  daysToClose: number;
  numPolicies: number;
  numAcceptedCurrencies: number;
  policies: Array<PolicyDataArgs>;
  acceptedCurrencies: Array<Address>;
};

export function getMerchantOperatorConfigEncoder(): VariableSizeEncoder<MerchantOperatorConfigArgs> {
  return createEncoder<MerchantOperatorConfigArgs>({
    getSizeFromValue(value) {
      return (
        MERCHANT_OPERATOR_CONFIG_BASE_SIZE +
        value.numPolicies * 101 + // Each PolicyData is 101 bytes
        value.numAcceptedCurrencies * 32 // Each Address is 32 bytes
      );
    },
    write(value, bytes, offset) {
      let currentOffset = offset;

      // Write base fields
      bytes.set([value.discriminator], currentOffset);
      currentOffset += 1;

      bytes.set(new Uint8Array(getU32Encoder().encode(value.version)), currentOffset);
      currentOffset += 4;

      bytes.set([value.bump], currentOffset);
      currentOffset += 1;

      bytes.set(getAddressEncoder().encode(value.merchant), currentOffset);
      currentOffset += 32;

      bytes.set(getAddressEncoder().encode(value.operator), currentOffset);
      currentOffset += 32;

      bytes.set(getU64Encoder().encode(value.operatorFee), currentOffset);
      currentOffset += 8;

      bytes.set(getFeeTypeEncoder().encode(value.feeType), currentOffset);
      currentOffset += 1;

      bytes.set(new Uint8Array(getU32Encoder().encode(value.currentOrderId)), currentOffset);
      currentOffset += 4;

      bytes.set(new Uint8Array(getU16Encoder().encode(value.daysToClose)), currentOffset);
      currentOffset += 2;

      bytes.set(new Uint8Array(getU32Encoder().encode(value.numPolicies)), currentOffset);
      currentOffset += 4;

      bytes.set(new Uint8Array(getU32Encoder().encode(value.numAcceptedCurrencies)), currentOffset);
      currentOffset += 4;

      // Write policies
      for (const policy of value.policies) {
        bytes.set(getPolicyDataEncoder().encode(policy), currentOffset);
        currentOffset += 101;
      }

      // Write accepted currencies
      for (const currency of value.acceptedCurrencies) {
        bytes.set(getAddressEncoder().encode(currency), currentOffset);
        currentOffset += 32;
      }

      return currentOffset;
    },
  });
}

export function getMerchantOperatorConfigDecoder(): VariableSizeDecoder<MerchantOperatorConfig> {
  return createDecoder<MerchantOperatorConfig>({
    read(bytes, offset) {
      let currentOffset = offset;

      // Read base fields
      const discriminator = bytes[currentOffset];
      currentOffset += 1;

      const version = getU32Decoder().decode(bytes.subarray(currentOffset, currentOffset + 4));
      currentOffset += 4;

      const bump = bytes[currentOffset];
      currentOffset += 1;

      const merchant = getAddressDecoder().decode(bytes.subarray(currentOffset, currentOffset + 32));
      currentOffset += 32;

      const operator = getAddressDecoder().decode(bytes.subarray(currentOffset, currentOffset + 32));
      currentOffset += 32;

      const operatorFee = getU64Decoder().decode(bytes.subarray(currentOffset, currentOffset + 8));
      currentOffset += 8;

      const feeType = getFeeTypeDecoder().decode(bytes.subarray(currentOffset, currentOffset + 1));
      currentOffset += 1;

      const currentOrderId = getU32Decoder().decode(bytes.subarray(currentOffset, currentOffset + 4));
      currentOffset += 4;

      const daysToClose = getU16Decoder().decode(bytes.subarray(currentOffset, currentOffset + 2));
      currentOffset += 2;

      const numPolicies = getU32Decoder().decode(bytes.subarray(currentOffset, currentOffset + 4));
      currentOffset += 4;

      const numAcceptedCurrencies = getU32Decoder().decode(bytes.subarray(currentOffset, currentOffset + 4));
      currentOffset += 4;

      // Read policies
      const policies: PolicyData[] = [];
      for (let i = 0; i < numPolicies; i++) {
        const policy = getPolicyDataDecoder().decode(bytes.subarray(currentOffset, currentOffset + 101));
        policies.push(policy);
        currentOffset += 101;
      }

      // Read accepted currencies
      const acceptedCurrencies: Address[] = [];
      for (let i = 0; i < numAcceptedCurrencies; i++) {
        const currency = getAddressDecoder().decode(bytes.subarray(currentOffset, currentOffset + 32));
        acceptedCurrencies.push(currency);
        currentOffset += 32;
      }

      const result: MerchantOperatorConfig = {
        discriminator,
        version,
        bump,
        merchant,
        operator,
        operatorFee,
        feeType,
        currentOrderId,
        daysToClose,
        numPolicies,
        numAcceptedCurrencies,
        policies,
        acceptedCurrencies,
      };

      return [result, currentOffset];
    },
  });
}

export function getMerchantOperatorConfigCodec(): Codec<
  MerchantOperatorConfigArgs,
  MerchantOperatorConfig
> {
  return combineCodec(
    getMerchantOperatorConfigEncoder(),
    getMerchantOperatorConfigDecoder()
  );
}

// Fixed size for the base struct (without dynamic arrays)
export const MERCHANT_OPERATOR_CONFIG_BASE_SIZE = 
  1 +  // discriminator
  4 +  // version
  1 +  // bump
  32 + // merchant
  32 + // operator
  8 +  // operatorFee
  1 +  // feeType
  4 +  // currentOrderId
  2 +  // daysToClose
  4 +  // numPolicies
  4;   // numAcceptedCurrencies
// Total: 93 bytes

export function getMerchantOperatorConfigSize(config: {
  numPolicies: number;
  numAcceptedCurrencies: number;
}): number {
  return (
    MERCHANT_OPERATOR_CONFIG_BASE_SIZE +
    config.numPolicies * 101 + // Each PolicyData is 101 bytes
    config.numAcceptedCurrencies * 32 // Each Address is 32 bytes
  );
}