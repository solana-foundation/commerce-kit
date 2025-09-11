# @solana-commerce/react-sdk

React SDK for Solana Commerce platform, providing hooks and components for building Solana-powered payment interfaces.

## 🚀 Features

### Hooks
- **`useTimer`** - Countdown timer with progress tracking
- **`usePaymentStatus`** - Payment status management with state transitions
- **`useCopyToClipboard`** - Clipboard utilities with fallback support
- **`useSolanaPay`** - Solana Pay integration with QR code generation
- **`useFormField`** - Form field validation and state management
- **`useHover`** - Hover state management
- **`useAsync`** - Async operation state handling

### Components
- **`ActionButton`** - Primary action button with loading states and SOL equivalent display
- **`TipModal`** - Complete tip/payment modal with currency selection and payment methods
- **`PaymentMethodSelector`** - Payment method selection (QR, Wallet)
- **`CurrencySelector`** - Multi-currency dropdown with token icons
- **`AmountSelector`** - Amount input with preset values
- **Icons** - Comprehensive icon set for Solana, USDC, USDT, and status indicators

## 🧪 Testing

This package includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### Test Coverage
- **41 test cases** covering hooks and components
- **Hooks**: Timer functionality, payment status transitions, clipboard operations
- **Components**: Button interactions, theming, accessibility
- **Integration**: Solana Pay QR code generation and currency handling

### Test Structure
```
src/__tests__/
├── setup.ts              # Test setup and mocks
├── hooks/                 # Hook unit tests
│   ├── use-timer.test.ts
│   ├── use-payment-status.test.ts
│   └── use-copy-to-clipboard.test.ts
├── components/            # Component tests
│   └── action-button.test.tsx
└── integration/           # Integration tests
    └── solana-pay-integration.test.ts
```

## 🛠️ Development

### Scripts
- `pnpm build` - Build the package
- `pnpm dev` - Development build with watch mode
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm type-check` - TypeScript type checking

### Architecture
- **Modern React Patterns**: Hooks-based architecture with functional components
- **TypeScript First**: Full TypeScript support with comprehensive types
- **Testing**: Vitest + React Testing Library for comprehensive testing
- **Build System**: tsup for fast, modern bundling

## 📦 Dependencies

### Runtime Dependencies
- `@solana-commerce/connector-kit` - Wallet connection utilities
- `@solana-commerce/headless-sdk` - Headless commerce operations
- `@solana-commerce/solana-hooks` - Solana-specific React hooks
- `@solana-commerce/solana-pay` - Solana Pay implementation
- `@solana-commerce/ui-primitives` - Base UI components
- `gill` - Solana toolkit

### Development Dependencies
- `vitest` - Fast test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM testing matchers
- `happy-dom` - Lightweight DOM environment
- `tsup` - TypeScript bundler

## 🎨 Theming

All components support comprehensive theming:

```typescript
const theme = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6', 
  backgroundColor: '#ffffff',
  textColor: '#000000',
  fontFamily: 'Inter, sans-serif',
  borderRadius: 'lg',
  buttonShadow: 'md'
}
```

## 🔧 Usage Examples

```typescript
import { useTimer, usePaymentStatus } from '@solana-commerce/react-sdk'

// Timer hook
const { timeRemaining, start, pause, isComplete } = useTimer({
  duration: 120,
  onComplete: () => console.log('Timer finished!')
})

// Payment status management
const { 
  status, 
  handleSuccess, 
  handleError, 
  isLoading 
} = usePaymentStatus()
```

## 🚀 Quality Assurance

- **100% TypeScript** - Full type safety
- **Comprehensive Testing** - 41+ test cases with high coverage
- **Modern React** - Hooks-based architecture
- **Performance Optimized** - Memo-wrapped components and optimized re-renders
- **Accessibility** - ARIA labels and keyboard navigation support
