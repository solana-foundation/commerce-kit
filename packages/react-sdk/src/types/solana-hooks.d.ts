declare module '@solana-commerce/connector-kit' {
  import { ReactNode } from 'react';

  export interface ConnectorConfig {
    autoConnect?: boolean;
    debug?: boolean;
    storage?: any;
  }

  export class ConnectorClient {
    constructor(config?: ConnectorConfig);
    getSnapshot(): any;
    subscribe(callback: (state: any) => void): () => void;
    select(walletName: string): Promise<any>;
    disconnect(): Promise<void>;
    selectAccount(address: string): Promise<void>;
    destroy?(): void;
  }

  export interface AppProviderProps {
    connectorConfig?: ConnectorConfig;
    children: ReactNode;
  }

  export function AppProvider(props: AppProviderProps): JSX.Element;
  export function useConnectorClient(): ConnectorClient | null;
}

declare module '@solana-commerce/solana-hooks' {
  import { ReactNode } from 'react';

  export interface ArcProviderProps {
    config: {
      network: string;
      rpcUrl: string;
      connector?: any;
    };
    children: ReactNode;
  }

  export function ArcProvider(props: ArcProviderProps): JSX.Element;

  export function useArcClient(): {
    wallet: {
      connected: boolean;
      address: string | null;
      signer: any | null;
      selectedAccount: string | null;
      accounts?: Array<{ address: string; icon?: string }>;
    };
    network: {
      rpcUrl: string;
    };
    config: any;
  };

  export function useTransferSOL(): {
    transferSOL: (params: { to: string; amount: bigint; from?: string }) => Promise<{ signature: string }>;
    isLoading: boolean;
    error: Error | null;
  };

  export function useTransferToken(): {
    transferToken: (params: { 
      mint: string; 
      to: string; 
      amount: bigint;
      createAccountIfNeeded?: boolean;
      from?: string;
    }) => Promise<{ signature: string }>;
    isLoading: boolean;
    error: Error | null;
  };

  export function useBalance(options?: {
    address?: string;
    mint?: any;
    refreshInterval?: number;
    enabled?: boolean;
    onUpdate?: (balance: bigint) => void;
  }): {
    balance: bigint | null;
    balanceSOL: number;
    formattedBalance: string;
    address: string | null;
    isLoading: boolean;
    error: any;
    refetch: () => void;
    refresh: () => void;
    clear: () => void;
  };

  export function address(addressString: string): any;
}
