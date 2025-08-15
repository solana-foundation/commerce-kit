# Solana Commerce Program Overview

## Program ID

```
commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT
```
- [Instruction Details](#instruction-details)
- [Accounts](#accounts)
- [Other Constants](#other-constants)

## Instructions

| Instruction | Description | Discriminator |
|-------------|-------------|---------------|
| [`InitializeMerchant`](#initializemerchant) | Initialize merchant PDA and settlement ATAs | 0 |
| [`CreateOperator`](#createoperator) | Creates the Operator PDA account | 1 |
| [`InitializeMerchantOperatorConfig`](#initializemerchantoperatorconfig) | Initialize merchant-operator configuration | 2 |
| [`MakePayment`](#makepayment) | Process a payment from buyer to merchant | 3 |
| [`ClearPayment`](#clearpayment) | Clear payment from escrow to settlement wallets | 4 |
| [`RefundPayment`](#refundpayment) | Refund payment back to buyer | 5 |
| [`UpdateMerchantSettlementWallet`](#updatemerchantsettlementwallet) | Update merchant's settlement wallet | 7 |
| [`UpdateMerchantAuthority`](#updatemerchantauthority) | Update merchant's authority | 8 |
| [`UpdateOperatorAuthority`](#updateoperatorauthority) | Update operator's authority | 9 |
| [`ClosePayment`](#closepayment) | Close payment account | 10 |
| [`EmitEvent`](#emitevent) | Emit event via CPI | 228 |

### Instruction Details

#### InitializeMerchant
Initializes the merchant PDA and creates settlement ATAs for USDC and USDT.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `bump` | u8 | PDA bump seed for merchant account |

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `authority` | ✓ | | Merchant authority |
| 2 | `merchant` | | ✓ | Merchant PDA to initialize |
| 3 | `settlement_wallet` | | | Settlement wallet for receiving funds |
| 4 | `system_program` | | | System program |
| 5 | `settlement_usdc_ata` | | ✓ | Settlement USDC ATA |
| 6 | `escrow_usdc_ata` | | ✓ | Escrow USDC ATA |
| 7 | `usdc_mint` | | | USDC mint |
| 8 | `settlement_usdt_ata` | | ✓ | Settlement USDT ATA |
| 9 | `escrow_usdt_ata` | | ✓ | Escrow USDT ATA |
| 10 | `usdt_mint` | | | USDT mint |
| 11 | `token_program` | | | Token program |
| 12 | `associated_token_program` | | | Associated token program |

#### CreateOperator
Creates the Operator PDA account for managing merchant configurations.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `bump` | u8 | PDA bump seed for operator account |

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `operator` | | ✓ | Operator PDA to create |
| 2 | `authority` | ✓ | | Operator authority |
| 3 | `system_program` | | | System program |

#### InitializeMerchantOperatorConfig
Initializes the configuration between a merchant and operator.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `version` | u32 | Config version number |
| `bump` | u8 | PDA bump seed |
| `operator_fee` | u64 | Operator fee amount |
| `fee_type` | FeeType | Fee type (Bps=0, Fixed=1) |
| `policies` | Vec&lt;PolicyData&gt; | List of policies (refund, settlement) |
| `accepted_currencies` | Vec&lt;Pubkey&gt; | List of accepted token mints |

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `authority` | ✓ | | Merchant authority |
| 2 | `merchant` | | | Merchant PDA |
| 3 | `operator` | | | Operator PDA |
| 4 | `config` | | ✓ | MerchantOperatorConfig PDA |
| 5 | `system_program` | | | System program |

#### MakePayment
Process a payment from buyer to merchant's escrow account.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `order_id` | u32 | Unique order identifier |
| `amount` | u64 | Payment amount in token units |
| `bump` | u8 | PDA bump seed for payment account |

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `payment` | | ✓ | Payment PDA to create |
| 2 | `operator_authority` | ✓ | | Operator authority |
| 3 | `buyer` | ✓ | | Buyer making payment |
| 4 | `operator` | | | Operator PDA |
| 5 | `merchant` | | | Merchant PDA |
| 6 | `merchant_operator_config` | | ✓ | Config PDA (for order ID) |
| 7 | `mint` | | | Payment token mint |
| 8 | `buyer_ata` | | ✓ | Buyer's token account |
| 9 | `merchant_escrow_ata` | | ✓ | Merchant's escrow ATA |
| 10 | `merchant_settlement_ata` | | ✓ | Merchant's settlement ATA |
| 11 | `token_program` | | | Token program |
| 12 | `system_program` | | | System program |
| 13 | `event_authority` | | | Event authority PDA |

#### ClearPayment
Clears payment from escrow to settlement wallets.

**Parameters:** None

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `payment` | | ✓ | Payment PDA |
| 2 | `operator_authority` | ✓ | | Operator authority |
| 3 | `buyer` | | | Buyer |
| 4 | `merchant` | | | Merchant PDA |
| 5 | `operator` | | | Operator PDA |
| 6 | `merchant_operator_config` | | | Config PDA |
| 7 | `mint` | | | Token mint |
| 8 | `merchant_escrow_ata` | | ✓ | Merchant escrow ATA |
| 9 | `merchant_settlement_ata` | | ✓ | Merchant settlement ATA |
| 10 | `operator_settlement_ata` | | ✓ | Operator settlement ATA |
| 11 | `token_program` | | | Token program |
| 12 | `associated_token_program` | | | Associated token program |
| 13 | `system_program` | | | System program |
| 14 | `event_authority` | | | Event authority PDA |

#### RefundPayment
Refunds payment back to buyer.

**Parameters:** None

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `payment` | | ✓ | Payment PDA |
| 2 | `operator_authority` | ✓ | | Operator authority |
| 3 | `buyer` | | | Refund destination owner |
| 4 | `merchant` | | | Merchant PDA |
| 5 | `operator` | | | Operator PDA |
| 6 | `merchant_operator_config` | | | Config PDA |
| 7 | `mint` | | | Token mint |
| 8 | `merchant_escrow_ata` | | ✓ | Merchant escrow ATA |
| 9 | `buyer_ata` | | ✓ | Buyer's token account |
| 10 | `token_program` | | | Token program |
| 11 | `system_program` | | | System program |
| 12 | `event_authority` | | | Event authority PDA |


#### UpdateMerchantSettlementWallet
Updates the merchant's settlement wallet and recreates ATAs for the new wallet.

**Parameters:** None

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `authority` | ✓ | ✓ | Merchant authority |
| 2 | `merchant` | | ✓ | Merchant PDA |
| 3 | `new_settlement_wallet` | | | New settlement wallet |
| 4 | `settlement_usdc_ata` | | ✓ | New settlement USDC ATA |
| 5 | `usdc_mint` | | | USDC mint |
| 6 | `settlement_usdt_ata` | | ✓ | New settlement USDT ATA |
| 7 | `usdt_mint` | | | USDT mint |
| 8 | `token_program` | | | Token program |
| 9 | `associated_token_program` | | | Associated token program |
| 10 | `system_program` | | | System program |

#### UpdateMerchantAuthority
Updates the merchant's authority to a new owner.

**Parameters:** None

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `authority` | ✓ | ✓ | Current merchant authority |
| 2 | `merchant` | | ✓ | Merchant PDA |
| 3 | `new_authority` | | | New merchant authority |

#### UpdateOperatorAuthority
Updates the operator's authority to a new owner.

**Parameters:** None

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `authority` | ✓ | ✓ | Current operator authority |
| 2 | `operator` | | ✓ | Operator PDA |
| 3 | `new_operator_authority` | | | New operator authority |

#### ClosePayment
Closes a payment account and recovers rent.

**Parameters:** None

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `payer` | ✓ | ✓ | Transaction fee payer |
| 1 | `payment` | | ✓ | Payment PDA to close |
| 2 | `operator_authority` | ✓ | | Operator authority |
| 3 | `operator` | | | Operator PDA |
| 4 | `merchant` | | | Merchant PDA |
| 5 | `buyer` | | | Buyer account |
| 6 | `merchant_operator_config` | | | Config PDA |
| 7 | `mint` | | | Token mint |
| 8 | `system_program` | | | System program |

#### EmitEvent
Invoked via CPI from another program to log event via instruction data.

**Parameters:** None (event data passed via instruction data)

**Accounts:**
| Account | Name | Signer | Writable | Description |
|---------|------|--------|----------|-------------|
| 0 | `event_authority` | ✓ | | Event authority PDA |

## Accounts

| Account | Description | Discriminator |
|-------------|-------------|---------------|
| Merchant | Merchant entity that can receive payments | 0 |
| Operator | 3rd party that manages payment processing | 1 |
| MerchantOperatorConfig | Configuration linking a merchant with an operator, including fees and policies | 2 |
| Payment | Represents a payment transaction | 3 |

### Merchant
Represents a merchant entity that can receive payments.

**PDA Derivation**: `["merchant", owner_pubkey]`

| Field | Type | Description |
|-------|------|-------------|
| `owner` | Pubkey | Authority that controls the merchant |
| `bump` | u8 | PDA bump seed |
| `settlement_wallet` | Pubkey | Wallet for receiving settled funds |

### Operator
Represents an operator that manages merchant configurations.

**PDA Derivation**: `["operator", owner_pubkey]`

| Field | Type | Description |
|-------|------|-------------|
| `owner` | Pubkey | Authority that controls the operator |
| `bump` | u8 | PDA bump seed |

### MerchantOperatorConfig
Configuration linking a merchant with an operator, including fees and policies.

**PDA Derivation**: `["merchant_operator_config", merchant_pubkey, operator_pubkey, version_bytes]`

| Field | Type | Description |
|-------|------|-------------|
| `version` | u32 | Config version number |
| `bump` | u8 | PDA bump seed |
| `merchant` | Pubkey | Merchant PDA |
| `operator` | Pubkey | Operator PDA |
| `operator_fee` | u64 | Fee amount (basis points or fixed) |
| `fee_type` | FeeType | Bps (0) or Fixed (1) |
| `current_order_id` | u32 | Last used order ID |
| `num_policies` | u32 | Number of policies stored after fixed data |
| `num_accepted_currencies` | u32 | Number of accepted token mints stored after policies |

**Dynamic data (stored after fixed fields):**
- `policies`: Vec&lt;PolicyData&gt; - Variable number of policies (refund, settlement)
- `accepted_currencies`: Vec&lt;Pubkey&gt; - Variable number of accepted token mints

### Payment
Represents a payment transaction.

**PDA Derivation**: `["payment", merchant_operator_config, buyer, mint, order_id_bytes]`

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | u32 | Unique order identifier |
| `amount` | u64 | Payment amount |
| `created_at` | i64 | Unix timestamp |
| `status` | Status | Paid (0), Cleared (1), Chargedback (2), Refunded (3) |
| `bump` | u8 | PDA bump seed |

## Policy Types

### RefundPolicy
| Field | Type | Description |
|-------|------|-------------|
| `max_amount` | u64 | Maximum refundable amount |
| `max_time_after_purchase` | u64 | Time window for refunds (seconds) |

## Other Constants

- **Event Authority PDA**: Derived from `["event_authority"]`
- **Default Mints**:
  - USDC (Mainnet): `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
  - USDT (Mainnet): `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
  - USDC (Devnet): `5S2UmJm13KgrQozS8FwMTvQVusFLdnNjeAVBL1dHFZpN`
  - USDT (Devnet): `2UEzfJMY6dNgAu3wgLmJ7izGt2Z3sPcgLW4q5UpNqJgj`