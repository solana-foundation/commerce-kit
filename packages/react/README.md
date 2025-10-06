# @solana-commerce/react

React SDK for Solana commerce applications

<!-- TODO: Add npm version badge when published -->

## Installation

```bash
pnpm add @solana-commerce/react
```

## Features

<!-- TODO: Add Screenshots of the components -->

- Complete payment UI components
- PaymentButton with multiple modes (tip, payment, cart)
- Secure iframe architecture
- Customizable theming system
- Server-side RPC URL resolution
- Transaction state management
- Wallet integration built-in
- TypeScript support
- Native support for USDC and USDT (mainnet and devnet)

## Components

### Core Components
- **PaymentButton** - Main payment component supporting tip, payment, and cart modes
- **TransactionSuccess** - Success state UI component
- **TransactionError** - Error state UI component
- Many UI Primitives

### Hooks
- **useSolanaPay** - Solana Pay integration
- **useSolEquivalent** - Token to SOL conversion
- **useTipForm** - Tip form state management
- **usePaymentStatus** - Payment status tracking
- Several utility hooks for UI state management

## API

### PaymentButton

```typescript
<PaymentButton
  config={{
    merchant: {
      name: 'Store Name',
      wallet: 'merchant-wallet-address'
    },
    mode: 'payment' | 'tip' | 'cart',
    theme?: ThemeConfig,
    rpcUrl?: string,
    network?: 'mainnet' | 'devnet' | 'testnet',
    allowedMints?: string[]
  }}
  paymentConfig={{
    amount?: number,
    currency?: string,
    products?: Product[]
  }}
  onPaymentStart?: () => void
  onPayment?: (amount: number, currency: string) => void
  onPaymentSuccess?: (signature: string) => void
  onPaymentError?: (error: Error) => void
  onCancel?: () => void
/>
```

### Configuration

**Theme**

```typescript
theme: {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: string;
}
```

## Examples

### Simple Payment

```typescript
<PaymentButton
  config={{
    merchant: { name: 'Store', wallet: 'address' },
    mode: 'payment'
  }}
  paymentConfig={{
    amount: 50,
    currency: 'USDC'
  }}
  onPaymentSuccess={(signature) => {
    console.log('Payment confirmed:', signature);
  }}
/>
```

### Tip Widget

```typescript
<PaymentButton
  config={{
    merchant: { name: 'Creator', wallet: 'address' },
    mode: 'tip'
  }}
  onPaymentSuccess={(signature) => {
    console.log('Thanks for the tip!');
  }}
/>
```

### Shopping Cart

```typescript
function Cart() {
  const [items, setItems] = useState([...]);

  return (
    <PaymentButton
      config={{
        merchant: { name: 'Store', wallet: 'address' },
        mode: 'cart',
        allowedMints: ['SOL', 'USDC']
      }}
      paymentConfig={{
        products: items
      }}
      onPaymentSuccess={(signature) => {
        setItems([]);
        alert('Order placed!');
      }}
    />
  );
}
```

## Development

```bash
pnpm install            # Install dependencies
pnpm build              # Build package
pnpm build:sdk          # Build SDK package
pnpm build:iframe       # Build iframe package
pnpm type-check         # Type check
pnpm dev                # Watch mode
pnpm test               # Run tests
pnpm test:watch         # Test watch mode
pnpm test:coverage      # Coverage report
```

## License

MIT
