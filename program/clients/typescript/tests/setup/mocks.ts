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
  PAYER: '11111111111111111111111111111112' as Address,
  AUTHORITY: '4aMgkHVGzK3FAhWvJRpCpG2kTkA4dxUQSGfPbhpZsDbF' as Address,
  MERCHANT: '5JYdXKJLwfCWQdR7aBe6L1zjwvBJHXEemMVgXQM97C8V' as Address,
  OPERATOR: '6cPFGPZbUE7DQPrw24GgTYNkvr2FLnHfgqgjCxEn73K5' as Address,
  BUYER: '7BgH7Hq2P3CsQQ2DgJtfHPNNdJtKJsKJGJhRPNkkvuY3' as Address,
  PAYMENT: '8MKrYq1F8xKhXp4FJWfYSgYZNgPqvP3DQa2Jv7rXfQN8' as Address,
  CONFIG: '9LqZxwCF5N4FdpTJGcZpYPvT2GcLXMdNzQf5EyN5DhYx' as Address,
  MINT: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address,
  ATA_1: 'BT8z9sLZJdwHuZNwgXK4VdCkRGCkF7FZqN2vKNmM4xP1' as Address,
  ATA_2: 'CAnQK3i5FBdWr2GZjmX3VqrP8F3n7qWfNBhRndfzKu42' as Address,
  ATA_3: 'DPmwVvvvV7WfQqKNWdxnKjVnCJHBDvhQFd7Pb2FQFQFQ' as Address,
  SETTLEMENT_WALLET: 'EqSF9rK3aVvLpPXgVg6KzVBwX8FqQn2xN5nCvPtPGxMZ' as Address,
  NEW_AUTHORITY: 'F1tJFQPgGK2cNgvBZ2L7rXdRpVvMgKqWzFnrNZ9K6X2P' as Address,
} as const;

/**
 * Expected program address for all instructions
 */
export const EXPECTED_PROGRAM_ADDRESS = 'commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT';