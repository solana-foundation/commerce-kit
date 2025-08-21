import {
  assertAccountExists,
  assertAccountsExist,
  combineCodec,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  getAddressDecoder,
  getAddressEncoder,
  type Account,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type EncodedAccount,
  type FetchAccountConfig,
  type FetchAccountsConfig,
  type MaybeAccount,
  type MaybeEncodedAccount,
  type ReadonlyUint8Array,
} from '@solana/kit';
import { type FeeType } from '../generated/types/feeType';
import {
  getPolicyDataDecoder,
  getPolicyDataEncoder,
  type PolicyData,
  type PolicyDataArgs,
} from '../generated/types/policyData';
import {
  getMerchantOperatorConfigEncoder as generatedEncoder, getMerchantOperatorConfigDecoder as generatedDecoder
} from '../generated/accounts/merchantOperatorConfig';

const POLICY_DATA_SIZE = 101;
const ADDRESS_SIZE = 32;

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
        value.policies.length * POLICY_DATA_SIZE + // Each PolicyData is 101 bytes
        value.acceptedCurrencies.length * ADDRESS_SIZE // Each Address is 32 bytes
      );
    },
    encode(value: MerchantOperatorConfigArgs): Uint8Array {
      // First encode the base struct (without policies and acceptedCurrencies)
      const baseEncoder = generatedEncoder();
      const baseValue = {
        discriminator: value.discriminator,
        version: value.version,
        bump: value.bump,
        merchant: value.merchant,
        operator: value.operator,
        operatorFee: value.operatorFee,
        feeType: value.feeType,
        currentOrderId: value.currentOrderId,
        daysToClose: value.daysToClose,
        numPolicies: value.policies.length,
        numAcceptedCurrencies: value.acceptedCurrencies.length,
      };
      const baseBytes = baseEncoder.encode(baseValue);

      const policiesBytes = new Uint8Array(value.policies.length * POLICY_DATA_SIZE);
      let offset = 0;
      for (const policy of value.policies) {
        const policyBytes = getPolicyDataEncoder().encode(policy);
        policiesBytes.set(policyBytes, offset);
        offset += POLICY_DATA_SIZE;
      }

      const currenciesBytes = new Uint8Array(value.acceptedCurrencies.length * ADDRESS_SIZE);
      offset = 0;
      for (const currency of value.acceptedCurrencies) {
        const currencyBytes = getAddressEncoder().encode(currency);
        currenciesBytes.set(currencyBytes, offset);
        offset += ADDRESS_SIZE;
      }

      // Combine all bytes
      const basePosition = 0;
      const policiesPosition = baseBytes.length;
      const currenciesPosition = policiesPosition + policiesBytes.length;
      const result = new Uint8Array(baseBytes.length + policiesBytes.length + currenciesBytes.length);
      result.set(baseBytes, basePosition);
      result.set(policiesBytes, policiesPosition);
      result.set(currenciesBytes, currenciesPosition);

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
        currentOffset += POLICY_DATA_SIZE;
      }

      // Decode accepted currencies
      const acceptedCurrencies: Address[] = [];
      for (let i = 0; i < baseData.numAcceptedCurrencies; i++) {
        const currency = getAddressDecoder().decode(bytesArray, currentOffset);
        acceptedCurrencies.push(currency);
        currentOffset += ADDRESS_SIZE;
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
        result.numPolicies * POLICY_DATA_SIZE +
        result.numAcceptedCurrencies * ADDRESS_SIZE;
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

export function decodeMerchantOperatorConfig<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>
): Account<MerchantOperatorConfig, TAddress>;
export function decodeMerchantOperatorConfig<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<MerchantOperatorConfig, TAddress>;
export function decodeMerchantOperatorConfig<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
):
  | Account<MerchantOperatorConfig, TAddress>
  | MaybeAccount<MerchantOperatorConfig, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getMerchantOperatorConfigDecoder()
  );
}

export async function fetchMerchantOperatorConfig<
  TAddress extends string = string,
>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<MerchantOperatorConfig, TAddress>> {
  const maybeAccount = await fetchMaybeMerchantOperatorConfig(
    rpc,
    address,
    config
  );
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybeMerchantOperatorConfig<
  TAddress extends string = string,
>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<MerchantOperatorConfig, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeMerchantOperatorConfig(maybeAccount);
}

export async function fetchAllMerchantOperatorConfig(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<Account<MerchantOperatorConfig>[]> {
  const maybeAccounts = await fetchAllMaybeMerchantOperatorConfig(
    rpc,
    addresses,
    config
  );
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybeMerchantOperatorConfig(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<MaybeAccount<MerchantOperatorConfig>[]> {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) =>
    decodeMerchantOperatorConfig(maybeAccount)
  );
}
