import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { address } from '@solana/kit';
import type { ArcWebClientConfig, ArcWebClientState } from '../core/web-client';
import { ArcClientProvider } from '../core/commerce-client-provider';

// Mock Arc client state
export const createMockArcState = (overrides: Partial<ArcWebClientState> = {}): ArcWebClientState => ({
    network: {
        rpcUrl: 'https://api.devnet.solana.com',
        isMainnet: false,
        isDevnet: true,
        isTestnet: false,
        canAirdrop: true,
        clusterInfo: {
            name: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com',
            wsUrl: 'wss://api.devnet.solana.com',
            isMainnet: false,
            isDevnet: true,
            isTestnet: false,
        },
    },
    wallet: {
        wallets: [],
        selectedWallet: null,
        address: null,
        connected: false,
        connecting: false,
        signer: null,
    },
    config: {
        network: 'devnet',
        commitment: 'confirmed',
        debug: false,
        autoConnect: false,
    },
    ...overrides,
});

// Mock Arc client
export const createMockArcClient = (state: Partial<ArcWebClientState> = {}) => ({
    ...createMockArcState(state),

    // Methods
    connect: vi.fn(),
    disconnect: vi.fn(),
    updateConfig: vi.fn(),

    // State setters (for internal use)
    setState: vi.fn(),
    setWallet: vi.fn(),
    setNetwork: vi.fn(),
});

// Mock wallet signer
export const createMockSigner = () => ({
    address: address('So11111111111111111111111111111111111111112'),
    signTransaction: vi.fn(),
    signMessage: vi.fn(),
});

// Test wrapper component
interface TestWrapperProps {
    children: React.ReactNode;
    arcState?: Partial<ArcWebClientState>;
    queryClient?: QueryClient;
}

export function TestWrapper({ children, arcState = {}, queryClient }: TestWrapperProps) {
    const client =
        queryClient ||
        new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

    // Create a mock config for ArcClientProvider
    const mockConfig = {
        network: 'devnet' as const,
        commitment: 'confirmed' as const,
        debug: false,
        autoConnect: false,
    };

    // Since we can't easily mock ArcClientProvider, let's create a simple wrapper
    // that provides the mock client through context
    return (
        <QueryClientProvider client={client}>
            <MockArcClientProvider arcState={arcState}>{children}</MockArcClientProvider>
        </QueryClientProvider>
    );
}

// Create a simple mock provider that bypasses the real ArcClientProvider
const MockArcClientContext = React.createContext<ReturnType<typeof createMockArcClient> | null>(null);

function MockArcClientProvider({
    children,
    arcState = {},
}: {
    children: React.ReactNode;
    arcState?: Partial<ArcWebClientState>;
}) {
    const mockClient = createMockArcClient(arcState);
    return <MockArcClientContext.Provider value={mockClient}>{children}</MockArcClientContext.Provider>;
}

// Mock RPC responses
export const createMockRpcResponse = (result: unknown) => ({
    jsonrpc: '2.0',
    id: 1,
    result,
});

export const createMockRpcError = (code: number, message: string) => ({
    jsonrpc: '2.0',
    id: 1,
    error: { code, message },
});

// Common mock data
export const MOCK_ADDRESSES = {
    SYSTEM_PROGRAM: '11111111111111111111111111111111',
    TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    USDC_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT_MINT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    WALLET_1: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    WALLET_2: 'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
};

export const MOCK_LAMPORTS = {
    ONE_SOL: 1_000_000_000n,
    HALF_SOL: 500_000_000n,
    POINT_ONE_SOL: 100_000_000n,
    MINIMUM: 1n,
};
