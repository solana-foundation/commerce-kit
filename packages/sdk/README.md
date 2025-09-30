# @solana-commerce/sdk

**Modern React hooks for Solana development** - Type-safe, progressive complexity, built on Solana Kit 2.0

## 📦 Installation

```bash
npm install @solana-commerce/sdk
# or
yarn add @solana-commerce/sdk
# or  
pnpm add @solana-commerce/sdk
```

## 🚀 Quick Start

```typescript
import { ArcProvider, useBalance, useWallet } from '@solana-commerce/sdk';

function App() {
  return (
    <ArcProvider config={{ network: 'devnet' }}>
      <WalletComponent />
    </ArcProvider>
  );
}

function WalletComponent() {
  const { wallet, connect } = useWallet();
  const { balance } = useBalance();

  return <div>Balance: {balance} SOL</div>;
}
```

## 📁 Package Exports

This package provides two import paths:

### **Default Import** - Complete SDK

```typescript
import { ArcProvider, useBalance, useTransferSOL } from '@solana-commerce/sdk';
```

- **Use When**: Building full-featured Solana apps
- **Includes**: All hooks, providers, and utilities

### **`/react`** - React Hooks Only  

```typescript
import { useBalance, useWallet } from '@solana-commerce/sdk/react';
```

- **Use When**: Building React apps with Solana
- **Includes**: All React hooks and providers

## 🔧 Key Features

- **🎯 Type Safety**: Built on Solana Kit 2.0 with full TypeScript support
- **⚡ Performance**: Optimized re-renders and intelligent caching
- **🌐 Context-Based**: No prop drilling, automatic state coordination
- **🚀 Modern Standards**: Wallet Standard compatible
- **🔌 Flexible**: Works with any RPC provider

## 📚 Core Hooks

### Wallet Management
- `useWallet()` - Wallet connection and state
- `useStandardWallets()` - Wallet Standard integration

### Account Operations  
- `useBalance()` - Account balance monitoring
- `useTransferSOL()` - SOL transfers
- `useTransferToken()` - SPL token transfers

### Network & Configuration
- `useArcClient()` - RPC client access
- Network utilities and cluster management

## 🎯 Usage Patterns

### Basic Balance Display
```typescript
function BalanceDisplay() {
  const { balance, isLoading } = useBalance();
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{balance} SOL</div>;
}
```

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

### Token Transfer
```typescript
function SendToken() {
  const { transferToken } = useTransferToken();
  
  const handleTransfer = async () => {
    await transferToken({
      mint: 'token-mint-address',
      to: 'recipient-address', 
      amount: BigInt(1_000_000) // Amount in token's minor units
    });
  };
  
  return <button onClick={handleTransfer}>Send Token</button>;
}
```

## ⚙️ Configuration

### ArcProvider Setup
```typescript
function App() {
  return (
    <ArcProvider 
      config={{
        network: 'devnet', // 'mainnet' | 'devnet' | 'testnet' | 'localnet'
        rpcUrl: 'https://api.devnet.solana.com', // Optional custom RPC
        debug: true // Enable debug logging
      }}
    >
      <YourApp />
    </ArcProvider>
  );
}
```

### Custom RPC Configuration
```typescript
<ArcProvider 
  config={{
    network: 'mainnet',
    rpcUrl: 'https://your-private-rpc.com',
    connector: customConnectorInstance // Optional shared connector
  }}
>
  <YourApp />
</ArcProvider>
```

## 🔗 Integration with Commerce Kit

This package is designed to work seamlessly with other `@solana-commerce` packages:

```typescript
import { PaymentButton } from '@solana-commerce/react';
import { ArcProvider } from '@solana-commerce/sdk';

function CommerceApp() {
  return (
    <ArcProvider config={{ network: 'mainnet' }}>
      <PaymentButton 
        config={{
          merchant: { name: 'My Store', wallet: 'merchant-address' },
          mode: 'tip'
        }}
      />
    </ArcProvider>
  );
}
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build

# Type checking
pnpm type-check
```

## 🤝 Related Packages

- **[@solana-commerce/react](../react)** - Complete commerce UI components
- **[@solana-commerce/headless](../headless)** - Headless commerce logic
- **[@solana-commerce/connector](../connector)** - Wallet connection utilities
- **[@solana-commerce/solana-pay](../solana-pay)** - Solana Pay implementation

## 📄 License

MIT