# Solana Commerce Kit

Modern toolkit for building Solana commerce applications

<!-- TODO: Add npm version badges when packages are published -->

## Overview

Solana Commerce Kit is a comprehensive TypeScript SDK for building e-commerce applications on Solana. It provides everything from low-level payment primitives to high-level React components, enabling developers to integrate payments, tips, and checkout flows with minimal configuration.

Built on modern Solana libraries (@solana/kit, Wallet Standard) with a focus on type safety, developer experience, and production readiness.

**Key Features:**
- Complete payment flows for tips, purchases, and cart checkout
- Production-ready React components with customizable theming
- Framework-agnostic commerce logic
- Wallet Standard integration for multi-wallet support
- Full Solana Pay protocol implementation
- TypeScript-first with comprehensive type definitions

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [@solana-commerce/solana-commerce](./) | All-in-one SDK with complete functionality |  |
| [@solana-commerce/react](./packages/react) | React components for payments, tips, and checkout | [README](./packages/react/README.md) |
| [@solana-commerce/sdk](./packages/sdk) | Core React hooks for Solana development | [README](./packages/sdk/README.md) |
| [@solana-commerce/headless](./packages/headless) | Framework-agnostic commerce logic | [README](./packages/headless/README.md) |
| [@solana-commerce/connector](./packages/connector) | Wallet connection built on Wallet Standard | [README](./packages/connector/README.md) |
| [@solana-commerce/solana-pay](./packages/solana-pay) | Solana Pay protocol implementation | [README](./packages/solana-pay/README.md) |

## Package Overview

### @solana-commerce/solana-commerce
Meta-package that re-exports all functionality. Install this for complete access to the entire toolkit.

### @solana-commerce/react
Complete UI components for commerce applications:
- PaymentButton with secure iframe architecture
- Tip modal with customizable amounts
- Wallet connection UI
- Transaction state management
- Customizable theming system

### @solana-commerce/sdk
Type-safe React hooks for Solana development:
- Wallet management (`useWallet`, `useStandardWallets`)
- Account operations (`useBalance`, `useTransferSOL`)
- Token transfers (`useTransferToken`)
- RPC client access (`useArcClient`)

### @solana-commerce/headless
Framework-agnostic commerce primitives:
- Payment flow logic
- Cart management
- Order processing
- Checkout calculations
- Type definitions

### @solana-commerce/connector
Headless wallet connector with optional React support:
- Wallet Standard integration
- Multi-wallet detection and connection
- React provider and hooks
- Framework-agnostic core client

### @solana-commerce/solana-pay
Complete Solana Pay protocol implementation:
- Payment URL creation and parsing
- QR code generation
- SOL and SPL token transfers
- Transaction building

## Architecture

```
commerce-kit/   # @solana-commerce/solana-commerce - all packages in one install
|---packages/
│   ├── @solana-commerce/connector
│   ├── @solana-commerce/headless
│   ├── @solana-commerce/react
│   ├── @solana-commerce/sdk
│   └── @solana-commerce/solana-pay
```

**Choosing a Package:**
- Need everything? → `@solana-commerce/solana-commerce`
- Wallet connection? → `@solana-commerce/connector`
- Custom UI or non-React framework? → `@solana-commerce/headless`
- Building React app with UI? → `@solana-commerce/react`
- Need just hooks? → `@solana-commerce/sdk`
- Solana Pay protocol? → `@solana-commerce/solana-pay`

## Usage Examples

### E-commerce Checkout

```typescript
import { PaymentButton } from '@solana-commerce/react';

function CheckoutButton() {
  return (
    <PaymentButton
      config={{
        merchant: {
          name: 'Digital Store',
          wallet: 'merchant-wallet-address'
        },
        mode: 'cart',
        products: [
          {
            id: 'course-1',
            name: 'Solana Development Course',
            price: 100000000, // 0.1 SOL in lamports
            currency: 'SOL'
          }
        ],
        allowedMints: ['SOL', 'USDC'],
        theme: {
          primaryColor: '#9945FF',
          borderRadius: 'lg'
        }
      }}
      onPaymentSuccess={(signature) => {
        console.log('Payment successful!', signature);
      }}
    />
  );
}
```

### Custom Integration with Hooks

```typescript
import { ArcProvider, useWallet, useTransferSOL } from '@solana-commerce/sdk';

function CustomPayment() {
  const { wallet, connect } = useWallet();
  const { transferSOL, isLoading } = useTransferSOL();

  const handlePayment = async () => {
    if (!wallet) {
      await connect();
      return;
    }

    const { signature } = await transferSOL({
      to: 'merchant-address',
      amount: BigInt(1_000_000_000) // 1 SOL
    });

    console.log('Payment sent:', signature);
  };

  return <button onClick={handlePayment}>Pay 1 SOL</button>;
}
```

<!-- TODO: Add Example for each package -->

## Development

### Prerequisites
- Node.js 18+
- pnpm 8+

### Setup
```bash
git clone https://github.com/solana-foundation/commerce-kit.git
cd commerce-kit
pnpm install
```

### Commands
```bash
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm dev            # Watch mode for development
pnpm format         # Format code
pnpm lint           # Lint code
```

### Working on Individual Packages

Navigate to a package and use its scripts:

```bash
cd packages/sdk
pnpm dev          # Watch mode
pnpm test:watch   # Test watch mode
```

## Documentation

Coming soon.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT
