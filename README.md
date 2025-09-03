# Commerce SDK

A comprehensive, production-ready Solana e-commerce SDK with full theming, multiple payment modes, and stablecoin support.

## 🎯 Current Status: Production Ready

✅ **Complete E-commerce Solution** - PaymentButton with tip/buyNow/cart modes  
✅ **Comprehensive Theming System** - Colors, borders, fonts, custom styling  
✅ **Stablecoin Support** - USDC, USDT, and SPL token integration  
✅ **SSR-Safe Architecture** - Dialog-alpha system, no hydration issues  
✅ **Professional Documentation** - Complete guides and API references  
✅ **TypeScript Monorepo** - Full type safety across all packages  

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development (all packages + docs)
pnpm dev

# Open documentation site
open http://localhost:3000
```

### Simple Integration

```tsx
import { PaymentButton } from '@solana-commerce/react-sdk';

<PaymentButton
  config={{
    mode: 'cart',
    merchant: {
      name: 'My Store',
      wallet: 'YOUR_SOLANA_ADDRESS'
    },
    theme: {
      primaryColor: '#9945FF',
      borderRadius: 'lg'
    },
    products: [{
      id: 'item-1',
      name: 'Premium Course',
      price: 100000000, // 0.1 SOL
      currency: 'SOL'
    }],
    allowedMints: ['SOL', 'USDC']
  }}
  onPaymentSuccess={(signature) => {
    console.log('Payment successful!', signature);
  }}
/>
```

## 📦 Package Architecture

```
@solana-commerce/
├── headless-sdk/     # Core payment logic, stablecoin support, utilities
├── react-sdk/        # PaymentButton, SolanaPayButton, examples
├── ui-primitives/    # Dialog-alpha system (SSR-safe, accessible)
└── docs/            # Complete documentation with interactive demos
```

### Current Feature Set

**✅ Complete E-commerce Components:**
- PaymentButton with multiple modes (tip/buyNow/cart)
- Product management with metadata support
- Merchant configuration and branding
- Custom trigger elements and positioning

**✅ Advanced Theming System:**
- Primary/secondary colors and backgrounds
- Border radius controls (none/sm/md/lg/xl)
- Font family customization
- Custom CSS style overrides

**✅ Payment & Currency Support:**
- SOL native payments
- USDC/USDT stablecoin integration
- Configurable allowed mints
- Real Solana Pay URL generation

**✅ Developer Experience:**
- Complete TypeScript definitions
- SSR-safe architecture (no hydration issues)
- Event handling for payment lifecycle
- Comprehensive documentation and examples

## 🔧 Development

### File Structure
```
packages/
├── headless-sdk/src/
│   ├── index.ts                    # Enhanced payment requests & stablecoins
│   ├── blockchain-client.ts        # Solana network integration
│   ├── payment-verification.ts     # Transaction validation
│   └── transaction-builder.ts      # Payment URL generation
├── react-sdk/src/
│   ├── index.tsx                   # PaymentButton (main component)
│   ├── solana-pay-button.tsx       # Simple tip button
│   └── examples.tsx                # Usage examples for all modes
├── ui-primitives/src/
│   ├── dialog-alpha/               # Modern dialog system
│   │   ├── dialog.tsx              # Compound dialog component
│   │   ├── context.tsx             # React context & state
│   │   ├── content.tsx             # Modal content container
│   │   ├── backdrop.tsx            # Modal backdrop/overlay
│   │   └── trigger.tsx             # Dialog trigger element
│   └── react/index.tsx             # Clean re-exports
└── apps/docs/
    ├── app/(home)/                 # Interactive demo homepage
    ├── content/docs/               # Comprehensive MDX guides
    └── components/interactive-demo.tsx # Live PaymentButton demo
```

### Key Commands
```bash
pnpm dev          # Start all packages + docs with hot reload
pnpm build        # Build all packages for production
pnpm clean        # Clean build artifacts
cd apps/docs && pnpm dev  # Documentation site only
```

## 🎯 Architecture Highlights

### Dialog-Alpha System
**Problem Solved:** React re-rendering loops, SSR hydration mismatches, bundling issues

**Solution:** Simplified, SSR-safe dialog system:
```typescript
// Clean, predictable state management
const [isOpen, setIsOpen] = useState(false);

// SSR-safe rendering with CSS visibility control
<DialogContent style={{ display: isOpen ? 'flex' : 'none' }}>
  {children}
</DialogContent>

// No createPortal bundling issues
// No useEffect hook order violations
// No server/client hydration mismatches
```

### Commerce-First Design
```typescript
// Support for multiple e-commerce patterns
type CommerceMode = 'tip' | 'buyNow' | 'cart';

// Rich product metadata
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;       // in lamports
  currency?: string;   // 'SOL' | mint address
  image?: string;
  metadata?: Record<string, any>;
}

// Complete theming control
interface ThemeConfig {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: string;
}
```

### Payment Flow Integration
```typescript
// Complete payment lifecycle events
<PaymentButton
  onPaymentStart={() => {/* Show loading */}}
  onPayment={(amount, currency, products) => {/* Track analytics */}}
  onPaymentSuccess={(signature) => {/* Clear cart, redirect */}}
  onPaymentError={(error) => {/* Handle failure */}}
  onCancel={() => {/* Reset state */}}
/>
```

## 🎨 Current Demo

Visit `http://localhost:3000` to see:
- **Interactive PaymentButton Demo** - Switch between tip/buyNow/cart modes
- **Live Theming Controls** - Customize colors, borders, positioning
- **Complete Documentation** - API references, guides, examples
- **Working Payment Flows** - Real Solana Pay URL generation
- **Stablecoin Integration** - USDC/USDT support examples

## 🔧 Technology Stack

- **Runtime:** Bun (3x faster than Node.js)
- **Monorepo:** Turborepo (cached parallel builds)
- **Frontend:** Next.js 15 + React 19
- **Documentation:** Fumadocs (beautiful, fast docs)
- **UI:** Dialog-alpha system (SSR-safe, accessible)
- **Blockchain:** Solana Web3.js + Solana Pay standards
- **TypeScript:** Full type safety across all packages

## 💡 Usage Examples

### Tip/Donation Widget
```tsx
<PaymentButton
  config={{
    mode: 'tip',
    merchant: { name: 'Creator', wallet: 'ADDRESS' },
    theme: { primaryColor: '#9945FF' },
    products: [{ id: 'tip', name: 'Support', price: 10000000, currency: 'SOL' }]
  }}
/>
```

### Digital Product Sales
```tsx
<PaymentButton
  config={{
    mode: 'buyNow',
    merchant: { name: 'Digital Store', wallet: 'ADDRESS' },
    products: [{
      id: 'course-1',
      name: 'Solana Development Course',
      description: 'Complete guide',
      price: 100000000,
      currency: 'SOL'
    }],
    showProductDetails: true
  }}
/>
```

### Multi-Product Cart
```tsx
<PaymentButton
  config={{
    mode: 'cart',
    merchant: { name: 'E-commerce Store', wallet: 'ADDRESS' },
    products: [
      { id: 'item-1', name: 'Course', price: 100000000, currency: 'SOL' },
      { id: 'item-2', name: 'NFT Pack', price: 500000000, currency: 'SOL' }
    ],
    allowedMints: ['SOL', 'USDC'],
    theme: { primaryColor: '#FF6B6B', borderRadius: 'xl' }
  }}
/>
```

### Stablecoin Subscriptions
```tsx
<PaymentButton
  config={{
    mode: 'buyNow',
    merchant: { name: 'SaaS Platform', wallet: 'ADDRESS' },
    products: [{
      id: 'sub-monthly',
      name: 'Monthly Subscription',
      price: 10000000, // 10 USDC (6 decimals)
      currency: 'USDC'
    }],
    allowedMints: ['USDC', 'USDT']
  }}
/>
```

## 🛠️ Team Development

### Making Changes
1. **Edit source files** in `packages/*/src/`
2. **Changes auto-rebuild** and appear in docs instantly
3. **TypeScript errors** show in terminal immediately
4. **Test changes** at `http://localhost:3000`

### Common Tasks
```bash
# Add new payment mode
packages/react-sdk/src/index.tsx  # Update PaymentButton

# Add new stablecoin support
packages/headless-sdk/src/index.ts  # Update STABLECOINS config

# Update theming options
packages/react-sdk/src/index.tsx  # Update ThemeConfig interface

# Add documentation
apps/docs/content/docs/new-guide.mdx

# Test integration
# → Edit files → see changes at localhost:3000
```

### Debugging
- **Dialog issues:** Check dialog-alpha system, ensure hooks are called consistently
- **SSR problems:** Verify client-side only code in useEffect
- **Payment flow:** Check browser console for Solana Pay URLs
- **Hot reload not working:** Restart `pnpm dev`

## 🎯 Production Deployment

The SDK is production-ready with:
- **Complete e-commerce features** (cart, products, payments)
- **Enterprise theming** (brand colors, custom styling)
- **Multi-currency support** (SOL, USDC, USDT, custom tokens)
- **SSR-safe architecture** (works with Next.js, Remix, etc.)
- **Comprehensive documentation** (guides, API references, examples)
- **TypeScript support** (full type safety)

## 🌟 Community & Support

- **GitHub**: [Commerce SDK Repository](https://github.com/solana-commerce/react-sdk)
- **Documentation**: Complete guides at `localhost:3000`
- **Examples**: Live demos and code samples
- **Discord**: Join our developer community

---

**Building the future of Solana e-commerce with production-ready, developer-friendly tools!** 🚀
