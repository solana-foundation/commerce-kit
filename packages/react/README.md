# @solana-commerce/react

## Server-Side RPC URL Resolution

For better security and performance, RPC URLs are now resolved server-side:

### 🎯 Benefits
- **🔒 Security**: Keep RPC API keys out of client bundle
- **⚡ Performance**: Server-side connection pooling and caching  
- **🛡️ Rate Limiting**: Centralized rate limit management
- **🔧 Configuration**: Environment-based RPC selection

### 🚀 Usage

#### Option 1: Environment Variables (Recommended)
```bash
# .env.local
SOLANA_RPC_MAINNET=https://your-premium-rpc.com
SOLANA_RPC_DEVNET=https://your-dev-rpc.com
SOLANA_RPC_URL=https://fallback-rpc.com
```

#### Option 2: Explicit RPC URL
```typescript
<PaymentButton 
  config={{
    rpcUrl: "https://your-rpc-endpoint.com", // Pre-resolved server-side
    // ... other config
  }}
/>
```

#### Option 3: API Route (Next.js)
Create `/pages/api/rpc-endpoints.ts` or `/app/api/rpc-endpoints/route.ts`:

```typescript
import { POST } from '@solana-commerce/react/api/rpc-endpoints';
export { POST };
```

### 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Server        │    │   PaymentButton  │    │   SecureIframe  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ ENV vars    │ │───▶│ │ RPC Resolver │ │───▶│ │ ArcProvider │ │
│ │ • MAINNET   │ │    │ │              │ │    │ │             │ │
│ │ • DEVNET    │ │    │ └──────────────┘ │    │ └─────────────┘ │
│ │ • TESTNET   │ │    │                  │    │                 │
│ └─────────────┘ │    └──────────────────┘    └─────────────────┘
└─────────────────┘                                               
```

### 🔄 Migration from Client-Side

**Before (❌ Client-side):**
```typescript
// RPC URL constructed in browser
const rpcUrl = config.rpcUrl || `https://api.${network}.solana.com`;
```

**After (✅ Server-side):**
```typescript
// RPC URL resolved server-side before client creation
const resolvedUrl = await fetchRpcUrl({ network, priority: 'reliable' });
```

### 🧪 Development

The system gracefully falls back to public endpoints when server resolution fails, making development seamless while providing production benefits.