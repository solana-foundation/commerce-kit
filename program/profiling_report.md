# Commerce Program - CU Analysis Report

Generated on: 2025-09-15 14:00:09

Total operation types analyzed: 9
Total test calls analyzed: 15

## Executive Summary

- **Most expensive operation**: `ClearPayment` (40851 CUs average)
- **Least expensive operation**: `CreateOperator` (3671 CUs average)
- **Total CU consumption**: 290,313 CUs across all operations
- **Peak single operation**: `ClearPayment` (43101 CUs)
- **Largest transaction**: `InitializeMerchantOperatorConfig` (760 bytes)

## Detailed Operation Breakdown

| Operation | Total Calls | Mean CU | Max CU | TX Size |
|-----------|-------------|---------|--------|---------|
| ClearPayment | 2 | 40,851 | 43,101 | 204 bytes |
| RefundPayment | 3 | 29,157 | 32,715 | 204 bytes |
| MakePayment | 2 | 28,766 | 31,016 | 217 bytes |
| ClosePayment | 1 | 18,384 | 18,384 | 204 bytes |
| UpdateMerchantSettlementWallet | 1 | 9,946 | 9,946 | 204 bytes |
| InitializeMerchantOperatorConfig | 2 | 8,562 | 10,062 | 760 bytes |
| InitializeMerchant | 1 | 6,865 | 6,865 | 205 bytes |
| UpdateMerchantAuthority | 1 | 3,946 | 3,946 | 204 bytes |
| CreateOperator | 2 | 3,671 | 3,671 | 205 bytes |

