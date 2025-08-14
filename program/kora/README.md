# Kora Gasless Relayer Testing

This directory contains testing utilities for integrating the Kora gasless relayer as an operator for the Commerce Program.

## Overview

[Kora](https://github.com/solana-foundation/kora) is an open source Solana paymaster node that provides a JSON-RPC interface for handling gasless transactions and fee abstractions. This implementation of Kora enables the Commerce Program Operator to act as a gasless relayer that sponsors transaction fees for users interacting with the Commerce Program. This allows users to perform commerce operations (payments, refunds, etc.) without needing SOL for transaction fees.

The test demonstrates a complete gasless payment flow where:
1. A buyer without SOL can make payments using tokens
2. Kora sponsors the transaction fees (SOL) for the user
3. The Commerce Program processes the payment normally

## Files

- `src/index.ts` - Main integration test for gasless payment flow
- `src/utils.ts` - Utility functions for account management and order ID handling
- `src/kora-utils.ts` - Kora RPC client for transaction signing
- `keys/` - Deterministic keypairs for consistent testing
- `test-kora.toml` - Kora configuration with Commerce Program allowlist
- `test-kora-integration.sh` - Full integration test script
- `package.json` - Dependencies for testing

## Setup

1. Install dependencies:
   ```bash
   cd kora/
   pnpm install
   ```

2. Make sure Docker is running

3. Ensure you have the required keypairs in the `keys/` directory:
   - `kora-operator.json` - Kora operator keypair
   - `commerce-merchant.json` - Merchant keypair
   - `test-mint.json` - Test token mint keypair

## Running Tests

### Full Integration Test
```bash
./test-kora-integration.sh
```

This will:
- Build Kora Docker image
- Start Solana test validator
- Deploy Commerce Program
- Start Kora server with test configuration
- Run gasless transaction tests

### TypeScript Test Only
```bash
pnpm test
```

This runs just the gasless transaction flow test (requires Kora server to be running).

## Test Flow

The integration test performs the following steps:

1. **Setup Phase**:
   - Creates a test mint and mints tokens to the buyer
   - Generates PDAs for operator, merchant, and merchant-operator config
   - Sets up all necessary token accounts

2. **Commerce Account Setup**:
   - Creates operator account (Kora operator)
   - Creates merchant account with settlement wallet
   - Creates merchant-operator config with fee settings and policies
   - Dynamically determines the next available order ID

3. **Gasless Payment**:
   - Creates a payment transaction with:
     - Token transfer to Kora for fee payment (in tokens, not SOL)
     - Commerce program payment instruction
   - Sends transaction to Kora for signing and fee sponsorship
   - Submits the signed transaction to the blockchain

## Key Features

### Dynamic Order ID Management
The test automatically handles order ID sequencing by:
- Reading the current order ID from the merchant-operator config
- Using the next available order ID for new payments
- Properly calculating payment PDAs with the correct order ID

### Validator Restart Handling
The test is designed to handle validator restarts gracefully by:
- Using deterministic keypairs stored in files
- Checking account existence before creation
- Using `failIfExists: false` for idempotent account creation

### ATA Management
Properly distinguishes between:
- **Merchant Escrow ATA**: Owned by merchant PDA (for non-auto-settle)
- **Merchant Settlement ATA**: Owned by merchant signer (for auto-settle)

## What Gets Tested

1. **Account Creation**: Operator, merchant, and config accounts
2. **Token Operations**: Mint creation, token minting, ATA creation
3. **Payment Processing**: Complete payment flow with proper validation
4. **Kora Integration**: Transaction signing and fee sponsorship
5. **Order Management**: Dynamic order ID handling
6. **Error Handling**: Graceful handling of existing accounts and restarts

## Integration with Commerce Program

The test configuration (`test-kora.toml`) includes the Commerce Program ID in the allowlist:
```toml
allowed_programs = [
    "11111111111111111111111111111111",             # System Program
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",  # Token Program
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", # Associated Token Program
    "commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT",  # Commerce Program
]
```

This allows Kora to sponsor fees for any Commerce Program transactions.

## Kora Resources

- [Kora Documentation](https://github.com/solana-foundation/kora/blob/main/docs/README.md)
- [Kora GitHub](https://github.com/solana-foundation/kora)
- [Kora Node Operator Guide](https://github.com/solana-foundation/kora/tree/main/docs/operators)

## Troubleshooting

### Validator Restart Issues
If you encounter "Account not found" errors after restarting the validator:
1. The test should handle this automatically with account existence checks
2. If issues persist, delete the `test-ledger` directory to start fresh
3. Ensure all keypairs in `keys/` directory are present and valid

### Order ID Conflicts
The test automatically handles order ID sequencing, but if you see "invalid program argument" errors:
1. The test reads the current order ID from the merchant-operator config
2. It uses the next available order ID for new payments
3. Manual order ID conflicts should not occur with this implementation

### Token/ATA Issues
If you see ATA-related errors:
1. The test creates all necessary token accounts automatically
2. It properly distinguishes between escrow and settlement ATAs
3. Token amounts are calculated with proper decimal handling (6 decimals)
