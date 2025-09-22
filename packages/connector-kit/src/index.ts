// Initialize UI global styles (e.g., spinner keyframes) once per app
export { injectArcConnectorGlobalStyles } from './ui/global-styles';

// Core exports
export { ConnectorClient } from './lib/connector-client';
export type { ConnectorState, ConnectorConfig, WalletInfo, AccountInfo } from './lib/connector-client';

// React exports
export { ConnectorProvider, useConnector, useConnectorClient } from './ui/connector-provider';
export type { ConnectorSnapshot } from './ui/connector-provider';
export { UnifiedProvider, AppProvider, WalletProvider } from './ui/unified-provider';
export type { UnifiedProviderProps } from './ui/unified-provider';

// UI exports
export { ConnectButton } from './ui/connect-button';
export type { ConnectButtonProps } from './ui/connect-button';
export { ConnectorDialog } from './ui/dialog';
export { WalletList } from './ui/wallet-list';
export { AccountDropdown } from './ui/account-dropdown';
export type { ConnectorTheme } from './ui/theme';
export { Spinner } from './ui/spinner';
