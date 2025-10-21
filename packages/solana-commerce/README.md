# @solana-commerce/kit

Complete Solana Commerce SDK - all packages in one install

<!-- TODO: Add npm version badge when published -->

## Installation

```bash
pnpm add @solana-commerce/kit
```

## What's Included

This meta-package includes all Solana Commerce Kit functionality:

- **@solana-commerce/react** - UI components and React integration
- **@solana-commerce/sdk** - Core React hooks for Solana development
- **@solana-commerce/headless** - Framework-agnostic commerce logic
- **@solana-commerce/connector** - Wallet Standard connection layer
- **@solana-commerce/solana-pay** - Solana Pay protocol implementation

## Quick Start

```typescript
import { PaymentButton, useWallet, useBalance } from '@solana-commerce/kit';

function App() {
  return (
    <PaymentButton
      config={{
        merchant: { name: 'My Store', wallet: 'your-wallet-address' },
        mode: 'payment',
        amount: 10.00,
        currency: 'USDC'
      }}
      onPaymentSuccess={(signature) => {
        console.log('Payment successful:', signature);
      }}
    />
  );
}
```

## Usage

All exports from individual packages are available through this meta-package:

### Components

```typescript
import { PaymentButton } from '@solana-commerce/kit';

<PaymentButton
  config={{
    merchant: { name: 'Store', wallet: 'address' },
    mode: 'cart',
    products: [
      { id: '1', name: 'Product', price: 100000000, currency: 'SOL' }
    ]
  }}
/>
```

### Hooks

```typescript
import { useWallet, useBalance, useTransferSOL } from '@solana-commerce/kit';

function WalletInfo() {
  const { wallet, connect } = useWallet();
  const { balance } = useBalance();
  const { transferSOL } = useTransferSOL();

  return (
    <div>
      <p>Balance: {balance} SOL</p>
      <button onClick={() => connect()}>Connect Wallet</button>
    </div>
  );
}
```

### Headless Functions

```typescript
import { createPayment, calculateTotal } from '@solana-commerce/kit';

const payment = createPayment({
    merchant: { wallet: 'address' },
    amount: 10.0,
    currency: 'USDC',
});

const total = calculateTotal({
    items: [{ price: 19.99, quantity: 2 }],
    tax: 0.08,
    shipping: 5.0,
});
```

### Solana Pay

```typescript
import { createQR, encodeURL } from '@solana-commerce/kit';

const url = encodeURL({
    recipient: 'wallet-address',
    amount: 10,
    label: 'Store Purchase',
});

const qr = createQR(url);
```

## When to Use This Package

**Use `@solana-commerce/kit` when:**

- Building full-featured commerce applications
- You need components, hooks, and commerce logic
- Convenience over granular dependency control
- Rapid prototyping and development

**Use individual packages when:**

- Building custom UI (→ use `@solana-commerce/headless`)
- Need only specific functionality (→ use individual packages)
- Optimizing bundle size for production
- Working with non-React frameworks

## Related Packages

Full documentation for each included package:

- [@solana-commerce/react](../react) - React components
- [@solana-commerce/sdk](../sdk) - React hooks
- [@solana-commerce/headless](../headless) - Core commerce logic
- [@solana-commerce/connector](../connector) - Wallet connection
- [@solana-commerce/solana-pay](../solana-pay) - Solana Pay implementation

## License

MIT
