import {
  combineCodec,
  getAddressDecoder,
  getAddressEncoder,
  type ReadonlyUint8Array,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';
import { type FeeType } from '../generated/types/feeType';
import {
  getPolicyDataDecoder,
  getPolicyDataEncoder,
  type PolicyData,
  type PolicyDataArgs,
} from '../generated/types/policyData';
import { getMerchantOperatorConfigEncoder as generatedEncoder, getMerchantOperatorConfigDecoder as generatedDecoder } from '../generated/accounts/merchantOperatorConfig';

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


export function getMerchantOperatorConfigEncoder(): Encoder<MerchantOperatorConfigArgs> {
  return {
    getSizeFromValue(value: MerchantOperatorConfigArgs): number {
      return (
        MERCHANT_OPERATOR_CONFIG_BASE_SIZE +
        value.numPolicies * 101 + // Each PolicyData is 101 bytes
        value.numAcceptedCurrencies * 32 // Each Address is 32 bytes
      );
    },
    encode(value: MerchantOperatorConfigArgs): Uint8Array {
      // First encode the base struct
      const baseEncoder = generatedEncoder();

      const baseBytes = baseEncoder.encode(value);

      // Encode policies (101 bytes each)
      const policiesBytes = new Uint8Array(value.numPolicies * 101);
      let offset = 0;
      for (const policy of value.policies) {
        const policyBytes = getPolicyDataEncoder().encode(policy);
        policiesBytes.set(policyBytes, offset);
        offset += 101;
      }

      // Encode accepted currencies (32 bytes each)
      const currenciesBytes = new Uint8Array(value.numAcceptedCurrencies * 32);
      offset = 0;
      for (const currency of value.acceptedCurrencies) {
        const currencyBytes = getAddressEncoder().encode(currency);
        currenciesBytes.set(currencyBytes, offset);
        offset += 32;
      }

      // Combine all bytes
      const result = new Uint8Array(baseBytes.length + policiesBytes.length + currenciesBytes.length);
      result.set(baseBytes, 0);
      result.set(policiesBytes, baseBytes.length);
      result.set(currenciesBytes, baseBytes.length + policiesBytes.length);

      return result;
    },
    write(value: MerchantOperatorConfigArgs, bytes: Uint8Array, offset: number): number {
      const encoded = this.encode(value);
      bytes.set(encoded, offset);
      return offset + encoded.length;
    }
  };
}

export function getMerchantOperatorConfigDecoder(): Decoder<MerchantOperatorConfig> {
  return {
    decode(bytes: Uint8Array | ReadonlyUint8Array, offset = 0): MerchantOperatorConfig {
      // Convert to Uint8Array if needed
      const bytesArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      
      // Decode base struct
      const baseDecoder = generatedDecoder();

      const baseData = baseDecoder.decode(bytesArray, offset);
      let currentOffset = offset + MERCHANT_OPERATOR_CONFIG_BASE_SIZE;

      // Decode policies
      const policies: PolicyData[] = [];
      for (let i = 0; i < baseData.numPolicies; i++) {
        const policy = getPolicyDataDecoder().decode(bytesArray, currentOffset);
        policies.push(policy);
        currentOffset += 101;
      }

      // Decode accepted currencies
      const acceptedCurrencies: Address[] = [];
      for (let i = 0; i < baseData.numAcceptedCurrencies; i++) {
        const currency = getAddressDecoder().decode(bytesArray, currentOffset);
        acceptedCurrencies.push(currency);
        currentOffset += 32;
      }

      return {
        ...baseData,
        policies,
        acceptedCurrencies,
      };
    },
    read(bytes: Uint8Array | ReadonlyUint8Array, offset: number): [MerchantOperatorConfig, number] {
      const result = this.decode(bytes, offset);
      const size = MERCHANT_OPERATOR_CONFIG_BASE_SIZE + 
        result.numPolicies * 101 + 
        result.numAcceptedCurrencies * 32;
      return [result, offset + size];
    }
  };
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