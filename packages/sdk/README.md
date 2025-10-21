# @solana-commerce/sdk

Modern React hooks for Solana development - Type-safe, progressive complexity, built on Solana Kit

<!-- TODO: Add npm version badge when published -->

## Installation

```bash
pnpm add @solana-commerce/sdk
```

## Quick Start

```typescript
import { ArcProvider, useTransferSOL } from '@solana-commerce/sdk';

function App() {
  return (
    <ArcProvider config={{ network: 'devnet' }}>
      <TransferComponent />
    </ArcProvider>
  );
}

function TransferComponent() {
  const { transferSOL } = useTransferSOL();

  return <button onClick={() => transferSOL({ to: 'address', amount: 1n })}>Send</button>;
}
```

## Features

- Solana React Provider with automatic RPC client management
- Solana Kit/Gill-based Solana Hooks for common operations

### Arc Provider

```typescript
<ArcProvider
  config={{
    network: 'mainnet',
    rpcUrl: 'https://your-private-rpc.com'
  }}
>
  <YourApp />
</ArcProvider>
```

### Hooks

- **useArcClient()** - Access RPC client and configuration
- **useTransferSOL()** - Transfer SOL with automatic retry
- **useTransferToken()** - Transfer SPL tokens with automatic retry
- **useStandardWallets()** - Wallet Standard integration

## Examples

### SOL Transfer

```typescript
function SendSOL() {
  const { transferSOL, isLoading } = useTransferSOL();

  const handleTransfer = async () => {
    try {
      const { signature } = await transferSOL({
        to: 'recipient-address',
        amount: BigInt(1_000_000_000) // 1 SOL in lamports
      });
      console.log('Transfer successful:', signature);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      Send 1 SOL
    </button>
  );
}
```

## Configuration

### ArcProvider Setup

```typescript
function App() {
  return (
    <ArcProvider
      config={{
        network: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        debug: true
      }}
    >
      <YourApp />
    </ArcProvider>
  );
}
```

## Development

```bash
pnpm build              # Build package
pnpm dev                # Watch mode
pnpm type-check         # Type check
pnpm test               # Run tests
pnpm lint               # Lint code
```

## License

MIT
