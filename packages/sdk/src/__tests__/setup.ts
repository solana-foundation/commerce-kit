import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock WebSocket for RPC subscriptions
global.WebSocket = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: WebSocket.OPEN,
})) as unknown as typeof WebSocket;

// Mock fetch for RPC calls with proper responses
global.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
    // Mock common RPC responses
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const method = body.method || 'unknown';

    // Return appropriate mock responses based on method
    let result: unknown = null;

    switch (method) {
        case 'getLatestBlockhash':
            result = {
                blockhash: 'mock-blockhash-12345',
                lastValidBlockHeight: 100000000,
            };
            break;
        case 'getBalance':
            result = 1000000000; // 1 SOL in lamports
            break;
        case 'sendTransaction':
            result = 'mock-signature-12345';
            break;
        case 'confirmTransaction':
            result = { value: { confirmationStatus: 'confirmed' } };
            break;
        case 'getAccountInfo':
            result = {
                value: {
                    data: ['', 'base64'],
                    executable: false,
                    lamports: 1000000000,
                    owner: '11111111111111111111111111111111',
                    rentEpoch: 200,
                },
            };
            break;
        default:
            result = {};
    }

    return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
            jsonrpc: '2.0',
            id: body.id || 1,
            result,
        }),
        text: async () =>
            JSON.stringify({
                jsonrpc: '2.0',
                id: body.id || 1,
                result,
            }),
    });
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// Mock crypto API with WebCrypto support for Solana digest operations
const mockDigest = vi.fn().mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
    // Return a mock hash for testing - 32 bytes for SHA-256
    const hashLength = algorithm.includes('256') ? 32 : 20;
    return new Uint8Array(hashLength).fill(0).map((_, i) => i % 256);
});

Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: vi.fn((arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        }),
        subtle: {
            digest: mockDigest,
            importKey: vi.fn(),
            sign: vi.fn(),
            verify: vi.fn(),
        },
    },
    writable: true,
});

// Create a shared mock RPC implementation that can be used across all tests
const createMockRpc = () => ({
    sendRequest: vi.fn().mockImplementation(async (method: string, params?: unknown[]) => {
        switch (method) {
            case 'getLatestBlockhash':
                return {
                    blockhash: 'mock-blockhash-12345',
                    lastValidBlockHeight: 100000000,
                };
            case 'getBalance':
                return {
                    value: 1000000000, // 1 SOL in lamports
                };
            case 'sendTransaction':
                return 'mock-signature-12345';
            case 'getAccountInfo': {
                // Return null for non-existent accounts (for error testing)
                const address = params?.[0];
                if (address === 'MISSING_ACCOUNT' || (typeof address === 'string' && address?.includes('missing'))) {
                    return { value: null };
                }
                // Return proper RPC response format with value wrapper
                return {
                    value: {
                        data: ['', 'base64'],
                        executable: false,
                        lamports: 1000000000,
                        owner: '11111111111111111111111111111111',
                        rentEpoch: 200,
                    },
                };
            }
            case 'getSignatureStatuses':
                return {
                    value: [{ confirmationStatus: 'confirmed', err: null }],
                };
            case 'getMultipleAccounts':
                return {
                    value:
                        (params?.[0] as unknown[] | undefined)?.map(() => ({
                            data: ['', 'base64'],
                            executable: false,
                            lamports: 1000000000,
                            owner: '11111111111111111111111111111111',
                            rentEpoch: 200,
                        })) || [],
                };
            default:
                return {};
        }
    }),
});

// Mock simplified RPC utilities to prevent real network calls
vi.mock('../core/rpc-manager', () => ({
    createRpc: vi.fn(() => createMockRpc()),
    createWebSocket: vi.fn(() => ({
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    })),
    // Backward compatibility aliases
    getSharedRpc: vi.fn(() => createMockRpc()),
    getSharedWebSocket: vi.fn(() => ({
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    })),
    releaseRpcConnection: vi.fn(), // No-op
}));

// Mock the ArcClientProvider and useArcClient hook
vi.mock('../core/commerce-client-provider', () => ({
    ArcClientProvider: ({ children }: { children: React.ReactNode }) => children,
    useArcClient: vi.fn(() => ({
        network: {
            rpcUrl: 'https://api.devnet.solana.com',
            isMainnet: false,
            isDevnet: true,
            isTestnet: false,
        },
        wallet: {
            address: null,
            connected: false,
            connecting: false,
            disconnecting: false,
            info: null,
            signer: null,
        },
        config: {
            network: 'devnet',
            commitment: 'confirmed',
            debug: false,
            autoConnect: false,
        },
        // Methods
        select: vi.fn(),
        disconnect: vi.fn(),
        selectAccount: vi.fn(),
    })),
}));

// Mock Solana address generation to prevent WebCrypto issues
vi.mock('@solana-program/token', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        findAssociatedTokenPda: vi.fn().mockResolvedValue([
            'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Mock ATA address
            255, // Mock bump seed
        ]),
    };
});

// Mock @solana/kit address functions
vi.mock('@solana/kit', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        address: vi.fn((addr: string) => addr),
        generateKeyPairSigner: vi.fn(() => ({
            address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
            signTransaction: vi.fn(),
            signMessage: vi.fn(),
        })),
    };
});

// Export mock utilities
export const mockLocalStorage = localStorageMock;
export const mockFetch = global.fetch;
export const mockWebSocket = global.WebSocket;
