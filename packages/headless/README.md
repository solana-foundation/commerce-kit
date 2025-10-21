# @solana-commerce/headless

Framework-agnostic commerce primitives for Solana

<!-- TODO: Add npm version badge when published -->

## Installation

```bash
pnpm add @solana-commerce/headless
```

## Features

- Framework-agnostic commerce logic
- Type-safe payment flows
- Cart and order management
- Payment verification on-chain
- Solana Pay URL generation (and QR code generation with customizable styling)
- No UI dependencies

## Quick Start

```typescript
import { createCommercePaymentRequest, createCartRequest } from '@solana-commerce/headless';

// Create a payment request
const payment = createCommercePaymentRequest({
    recipient: 'merchant-wallet-address',
    amount: 10000000, // 0.01 SOL in lamports
    currency: 'SOL',
    label: 'Store Purchase',
    message: 'Thank you for your order!',
});

// Create a cart checkout
const cart = createCartRequest(
    'merchant-wallet-address',
    [
        { id: '1', name: 'Product A', price: 5000000 },
        { id: '2', name: 'Product B', price: 10000000 },
    ],
    {
        currency: 'SOL',
        label: 'Cart Checkout',
    },
);
```

## API

### Payment Functions

- **`createCommercePaymentRequest(request)`** - Create a commerce payment request with Solana Pay URL
- **`verifyPayment(rpc, signature, expectedAmount?, expectedRecipient?, expectedMint?)`** - Verify a payment transaction on-chain
- **`waitForConfirmation(rpc, signature, timeoutMs?)`** - Wait for transaction confirmation

### Solana Pay Functions

- **`createSolanaPayRequest(request, options)`** - Create a Solana Pay request with styled QR code
- **`createQRPaymentRequest(recipientAddress, amount, tokenAddress?, options?)`** - Helper to create payment request with QR code from string inputs

### Cart Functions

- **`createCartRequest(recipient, products, options?)`** - Create a cart checkout request with multiple products

### Tip Functions

- **`createTipRequest(recipient, amount, options?)`** - Create a tip/donation request

### Buy Now Functions

- **`createBuyNowRequest(recipient, product, options?)`** - Create a single product purchase request

## Example

```typescript
import { createCartRequest, createCommercePaymentRequest, verifyPayment } from '@solana-commerce/headless';
import { createSolanaClient } from 'gill';

// 1. Create cart
const cart = createCartRequest(
    'merchant-wallet',
    [
        { id: '1', name: 'Product A', price: 50000000 },
        { id: '2', name: 'Product B', price: 30000000 },
    ],
    { currency: 'USDC', label: 'My Store' },
);

// 2. Generate payment request
const payment = createCommercePaymentRequest({
    recipient: cart.recipient,
    amount: cart.amount,
    currency: cart.currency,
    items: cart.products,
    label: cart.label,
    message: cart.message,
});

// 3. Display payment.url as QR code or link

// 4. After user pays, verify transaction
const client = createSolanaClient(/*...*/);
const verification = await verifyPayment(client.rpc, receivedSignature, payment.amount, payment.recipient);

if (verification.verified) {
    // Process order
    console.log('Order confirmed!');
}
```

## Development

```bash
pnpm install     # Install dependencies
pnpm build       # Build package
pnpm test        # Run tests
pnpm test:watch  # Test watch mode
```

## License

MIT
