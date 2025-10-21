# @solana-commerce/connector

Headless wallet connector built on Wallet Standard

<!-- TODO: Add npm version badge when published -->

## Installation

```bash
pnpm add @solana-commerce/connector
```

## Features

- Wallet Standard integration
- Solana Kit and Commerce Kit integration
- Multi-wallet support and detection
- React provider and hooks
- Framework-agnostic core client
- Type-safe wallet interactions
- Auto-connect support
- Account change detection

## Quick Start

### Headless Usage

```typescript
import { ConnectorClient } from '@solana-commerce/connector';

const connector = new ConnectorClient();

// Get current state (includes wallets list)
const state = connector.getConnectorState();
console.log('Available wallets:', state.wallets);

// Connect to a wallet by name
await connector.select('Phantom');

// Get updated state
const newState = connector.getConnectorState();
console.log('Connected:', newState.connected);
console.log('Accounts:', newState.accounts);
```

### React Usage

```typescript
import { ConnectorProvider, useConnector } from '@solana-commerce/connector';

function App() {
  return (
    <ConnectorProvider>
      <WalletComponent />
    </ConnectorProvider>
  );
}

function WalletComponent() {
  const { wallets, select, disconnect, accounts, connected } = useConnector();

  if (!connected) {
    return (
      <div>
        {wallets.map(w => (
          <button key={w.name} onClick={() => select(w.name)}>
            {w.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p>Connected: {accounts[0]?.address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

## API

### ConnectorClient

Core headless client for wallet management.

#### Constructor

```typescript
import { ConnectorClient } from '@solana-commerce/connector';

const client = new ConnectorClient({
    autoConnect: true, // Auto-connect to last wallet
    debug: false, // Enable debug logging
    accountPollingIntervalMs: 1500, // Account polling interval
    storage: window.localStorage, // Custom storage (optional)
});
```

#### Methods

**`getConnectorState()`**

Get current connector state including wallets, connection status, and accounts.

```typescript
const state = client.getConnectorState();

// State structure:
// {
//   wallets: WalletInfo[],        // All detected wallets
//   selectedWallet: Wallet | null, // Currently connected wallet
//   connected: boolean,            // Connection status
//   connecting: boolean,           // Connection in progress
//   accounts: AccountInfo[],       // Connected accounts
//   selectedAccount: string | null // Currently selected account address
// }

console.log('Available wallets:', state.wallets);
// [
//   {
//     wallet: Wallet,           // Wallet Standard object
//     name: 'Phantom',
//     icon: 'data:image/...',
//     installed: true,
//     connectable: true         // Has required features
//   },
//   ...
// ]
```

**`select(walletName)`**

Connect to a wallet by name.

```typescript
// List available wallets
const { wallets } = client.getConnectorState();

// Connect by name
await client.select('Phantom');

// Check connection
const { connected, accounts } = client.getConnectorState();
if (connected) {
    console.log('Connected to:', accounts[0].address);
}
```

**`disconnect()`**

Disconnect from current wallet.

```typescript
await client.disconnect();

const { connected } = client.getConnectorState();
console.log('Connected:', connected); // false
```

**`selectAccount(address)`**

Switch to a different account (for multi-account wallets).

```typescript
const { accounts } = client.getConnectorState();

// Switch to second account
if (accounts.length > 1) {
    await client.selectAccount(accounts[1].address);
}
```

**`subscribe(listener)`**

Subscribe to state changes.

```typescript
const unsubscribe = client.subscribe(state => {
    console.log('Wallets:', state.wallets.length);
    console.log('Connected:', state.connected);
    console.log('Accounts:', state.accounts.length);
});

// Later: cleanup
unsubscribe();
```

**`destroy()`**

Clean up all resources (event listeners, timers).

```typescript
client.destroy();
```

### React Hooks

#### `useConnector()`

Main hook for wallet interaction. Returns state plus action methods.

```typescript
import { useConnector } from '@solana-commerce/connector';

function Component() {
  const {
    // State
    wallets,         // WalletInfo[] - Available wallets
    selectedWallet,  // Wallet | null - Connected wallet
    accounts,        // AccountInfo[] - Connected accounts
    selectedAccount, // string | null - Selected account address
    connected,       // boolean - Connection status
    connecting,      // boolean - Connecting in progress

    // Actions
    select,          // (walletName: string) => Promise<void>
    disconnect,      // () => Promise<void>
    selectAccount    // (address: string) => Promise<void>
  } = useConnector();

  return (
    <div>
      {!connected && wallets.map(w => (
        <button
          key={w.name}
          onClick={() => select(w.name)}
          disabled={!w.connectable}
        >
          {w.icon && <img src={w.icon} alt={w.name} width={24} />}
          {w.name}
        </button>
      ))}

      {connected && (
        <div>
          <p>Address: {accounts[0]?.address}</p>
          {accounts.length > 1 && (
            <select
              value={selectedAccount || ''}
              onChange={(e) => selectAccount(e.target.value)}
            >
              {accounts.map(acc => (
                <option key={acc.address} value={acc.address}>
                  {acc.address.slice(0, 8)}...
                </option>
              ))}
            </select>
          )}
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```

#### `useConnectorClient()`

Access the underlying ConnectorClient instance.

```typescript
import { useConnectorClient } from '@solana-commerce/connector';

function Component() {
  const client = useConnectorClient();

  const handleCustomAction = () => {
    const state = client.getConnectorState();
    console.log('Current state:', state);
  };

  return <button onClick={handleCustomAction}>Custom Action</button>;
}
```

### React Provider

#### `ConnectorProvider`

Wrap your app with the connector provider.

```typescript
import { ConnectorProvider } from '@solana-commerce/connector';

function App() {
  return (
    <ConnectorProvider
      config={{
        autoConnect: true,
        debug: process.env.NODE_ENV === 'development'
      }}
    >
      <YourApp />
    </ConnectorProvider>
  );
}
```

### UI Components

#### `WalletList`

Pre-built wallet selection UI.

```typescript
import { WalletList, useConnector } from '@solana-commerce/connector';

function WalletModal() {
  const { wallets } = useConnector();

  return (
    <WalletList
      wallets={wallets}
      onWalletSelect={(wallet) => {
        console.log('Selected:', wallet.name);
      }}
    />
  );
}
```

#### `AccountDropdown`

Pre-built account dropdown UI.

```typescript
import { AccountDropdown } from '@solana-commerce/connector';

function MyComponent() {
  return <div><AccountDropdown /></div>;
}
```

## Configuration

### Auto-Connect

Automatically reconnect to the last used wallet on app load.

```typescript
<ConnectorProvider config={{ autoConnect: true }}>
  <App />
</ConnectorProvider>
```

### Custom Storage

Use custom storage for persistence (useful for React Native or SSR).

```typescript
const customStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key)
};

<ConnectorProvider config={{ storage: customStorage }}>
  <App />
</ConnectorProvider>
```

### Account Polling

Configure polling interval for account changes (when wallet doesn't support events).

```typescript
<ConnectorProvider config={{ accountPollingIntervalMs: 2000 }}>
  <App />
</ConnectorProvider>
```

## Wallet Standard

This connector implements the [Wallet Standard](https://github.com/wallet-standard/wallet-standard) specification, ensuring compatibility with all compliant wallets, e.g.:

- Phantom
- Solflare
- Backpack
- Glow
- Brave Wallet
- Any Wallet Standard compatible wallet

## Development

```bash
pnpm install     # Install dependencies
pnpm build       # Build package
pnpm test        # Run tests
pnpm test:watch  # Run tests in watch mode
pnpm type-check  # TypeScript validation
pnpm lint        # Lint code
```

## License

MIT
