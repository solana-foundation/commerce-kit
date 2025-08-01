# Operational Deployment Guide

This document covers critical operational considerations for using the Solana Commerce Program in production environments.

## Table of Contents

- [Settlement Wallet Management](#settlement-wallet-management)
- [Refund Handling](#refund-handling)
- [Error Recovery Strategies](#error-recovery-strategies)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Cost Optimization](#cost-optimization)

## Settlement Wallet Management

### ATA Initialization Requirements

**Critical**: The payment and settlement instructions assume merchants are responsible for maintaining open Associated Token Accounts (ATAs) for all accepted currencies.

- Payments, Settlements, and Refunds will fail if any party's in the transaction lacks the required ATA
- This can block payment clearing and impact cash flow
- Operators and Merchants should NOT CLOSE ATAs unless you no longer plan to use that wallet for settlement or refunds (in which case you should use the [`update_merchant_settlement_wallet`](../program/src/processor/update_merchant_settlement_wallet.rs) or [`update_operator_authority`](../program/src/processor/update_operator_authority.rs) instruction)

### Operational Recommendations
1. **During Merchant/Operator Onboarding**:
   ```typescript
   // Ensure all accepted currency ATAs exist
   for (const mint of acceptedCurrencies) {
     const ata = await findAssociatedTokenPda({
       mint,
       owner: settlementWallet // or operator authority
       tokenProgram: TOKEN_PROGRAM_ADDRESS, // currently all tokens use the SPL Token Program
     });
     
     if (!await accountExists(ata)) {
       await createAssociatedTokenAccount(mint, settlementWallet);
     }
   }
   ```
   *Note: the [`initialize_merchant`](../program/src/processor/initialize_merchant.rs) instruction will create merchant ATAs for USDC & USDT*

2. **Payment Flow Validation**:
   - Check ATA existence before attempting payment
   - Alert merchant/operator if ATAs are missing

## Payment Indexing

**Issue**: After a payment is cleared, the operator can run the [`close_payment`](../program/src/processor/close_payment.rs) instruction to close the payment account. This will delete the payment PDA and all associated data.

### Recommended Policies
**Payment Indexing**:
- Recommended: Index payments in a database for reporting and analytics
- Use tools like [Yellowstone gRPC](https://github.com/rpcpool/yellowstone-grpc) and [Carbon](https://github.com/sevenlabs-hq/carbon) to index payments


## Handling Clearance/Refunds

### Recommended Policies

1. **Automatic Clearance**:
   - Ensures funds are not idle in the escrow
   - Implementation: Background job checking policy validations and automated clearance

2. **Manual Review Queue**:
   - Implementation: Dashboard for stuck payments

3. **Hybrid Approach**:
   - Consider a manual review threshold for payments that are less than the manual review threshold, automatically clear the payment

   ```typescript
   if (payment.amount < MANUAL_REVIEW_THRESHOLD) {
     await automaticClearance(payment);
   } else {
     await queueForManualReview(payment);
   }
   ```

## Transaction Fee Management

- Use priority fees to ensure transactions are processed quickly
- Implement client-side retry logic with exponential backoff
- Simulate transactions to estimate compute unit usage and optimize instructions
- Leverage [Kora](../kora/README.md) to enable the Operator to cover transaction fees for users


## Common Error Scenarios

| Error | Cause | Recovery Strategy |
|-------|-------|-------------------|
| `AccountNotFound` | Missing ATA | Create necessary ATAs |
| `InvalidInstructionData` | Invalid instruction data or uninitialized ATA | Verify ATAs and input parameters |