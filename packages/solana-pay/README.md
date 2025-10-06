# @solana-commerce/solana-pay

Solana Pay SDK implementation with QR code generation built on Solana Kit/Gill

<!-- TODO: Add npm version badge when published -->

## Installation

```bash
pnpm add @solana-commerce/solana-pay
```

## Features

- Solana Pay URL encoding and parsing
- QR code generation with styling options
- SOL and SPL token transfer building
- Transaction request support
- TypeScript-first with complete type definitions
- Compliant with [Solana Pay specification](https://docs.solanapay.com/spec)

## API

### URL Functions

- **encodeURL(fields)** - Create Solana Pay URL from payment parameters
- **parseURL(url)** - Parse Solana Pay URL into components

### QR Code Generation

- **createQR(url, size?, background?, color?)** - Generate basic QR code as data URL
- **createStyledQRCode(url, options)** - Generate QR code with custom styling (logo, colors, dot/corner styles)

### Transaction Building

- **createTransfer(params)** - Build SOL transfer transaction
- **createSOLTransfer(params)** - Build SOL transfer (alias)
- **createSPLTransfer(params)** - Build SPL token transfer transaction

## Examples

### Basic Payment URL

```typescript
import { encodeURL, createQR } from '@solana-commerce/solana-pay';

const url = encodeURL({
  recipient: 'wallet-address',
  amount: 0.1,
  label: 'Store Purchase',
  message: 'Thank you!'
  // splToken: USDC_MINT, (optional)
});

const qr = await createQR(url);
```


### Styled QR Code

```typescript
import { createStyledQRCode } from '@solana-commerce/solana-pay';

const qr = await createStyledQRCode(url, {
  width: 400,
  color: { dark: '#9945FF', light: '#FFFFFF' },
  dotStyle: 'rounded',
  cornerStyle: 'extra-rounded',
  logo: 'https://mystore.com/logo.png',
  logoSize: 80
});
```

## Development

```bash
pnpm build              # Build package
pnpm dev                # Watch mode
pnpm test               # Run tests
pnpm test:watch         # Run tests in watch mode
```

## License

MIT
