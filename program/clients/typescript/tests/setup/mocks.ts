import {
  Address,
  BaseTransactionSignerConfig,
  SignatureBytes,
  TransactionMessageBytes,
  TransactionSigner,
} from 'gill';

/**
 * Creates a mock TransactionSigner for testing purposes
 */
export const mockTransactionSigner = (address: Address): TransactionSigner => ({
  address,
  async signTransactions(
    transactions: readonly Readonly<{
      messageBytes: TransactionMessageBytes;
      signatures: Readonly<Record<Address, SignatureBytes>>;
    }>[],
    _config?: BaseTransactionSignerConfig
  ): Promise<
    readonly Readonly<{
      messageBytes: TransactionMessageBytes;
      signatures: Readonly<Record<Address, SignatureBytes>>;
    }>[]
  > {
    return transactions;
  },
});

/**
 * Common test addresses for consistent testing
 */
export const TEST_ADDRESSES = {
  PAYER: '11111111111111111111111111111111' as Address,
  AUTHORITY: '22222222222222222222222222222222' as Address,
  MERCHANT: '33333333333333333333333333333333' as Address,
  OPERATOR: '44444444444444444444444444444444' as Address,
  BUYER: '55555555555555555555555555555555' as Address,
  PAYMENT: '66666666666666666666666666666666' as Address,
  CONFIG: '77777777777777777777777777777777' as Address,
  MINT: '88888888888888888888888888888888' as Address,
  ATA_1: '99999999999999999999999999999999' as Address,
  ATA_2: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
  ATA_3: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address,
  SETTLEMENT_WALLET: 'cccccccccccccccccccccccccccccccc' as Address,
  NEW_AUTHORITY: 'dddddddddddddddddddddddddddddddd' as Address,
} as const;

/**
 * Expected program address for all instructions
 */
export const EXPECTED_PROGRAM_ADDRESS = 'commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT';