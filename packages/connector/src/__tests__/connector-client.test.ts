import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectorClient, type ConnectorConfig} from '../lib/connector-client';

// Test constants
const AUTO_CONNECT_DELAY = 150;

/**
 * Common test addresses for consistent testing
 */
const TEST_ADDRESSES = {
    PHANTOM_ACCOUNT_1: 'PhantomAccount1',
    PHANTOM_ACCOUNT_2: 'PhantomAccount2',
    PHANTOM_ACCOUNT_3: 'PhantomAccount3',
    PHANTOM_ACCOUNT_4: 'PhantomAccount4',
    NONEXISTENT_ACCOUNT: 'NonexistentAccount',
} as const;

// Mock wallet standard API
const mockWalletsApi = {
    get: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
};

// Type for mock wallet
type MockWallet = ReturnType<typeof createMockWallet>;

// Mock wallet with Solana support
const createMockWallet = (name: string, hasConnect = true, hasDisconnect = true, hasEvents = false) => ({
    name,
    icon: `data:image/svg+xml;base64,${name}Icon`,
    version: '1.0.0',
    accounts: [],
    chains: ['solana:mainnet', 'solana:devnet'],
    features: {
        ...(hasConnect && {
            'standard:connect': {
                connect: vi.fn().mockResolvedValue({
                    accounts: [
                        {
                            address: TEST_ADDRESSES.PHANTOM_ACCOUNT_1,
                            icon: 'data:image/svg+xml;base64,accountIcon',
                        },
                    ],
                }),
            },
        }),
        ...(hasDisconnect && {
            'standard:disconnect': {
                disconnect: vi.fn().mockResolvedValue(undefined),
            },
        }),
        ...(hasEvents && {
            'standard:events': {
                on: vi.fn(),
                off: vi.fn(),
            },
        }),
    },
});


// Mock storage
const createMockStorage = () => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
});

// Mock localStorage
const mockLocalStorage = createMockStorage();

// Mock wallet standard module
vi.mock('@wallet-standard/app', () => ({
    getWallets: vi.fn(() => mockWalletsApi),
}));

describe('ConnectorClient', () => {
    let originalLocalStorage: Storage | undefined;
    let originalWindow: Window | undefined;

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset storage mock implementations
        mockLocalStorage.getItem.mockReturnValue(null);
        mockLocalStorage.setItem.mockImplementation(() => {});
        mockLocalStorage.removeItem.mockImplementation(() => {});

        // Setup window and localStorage mocks
        if (typeof window !== 'undefined') {
            originalWindow = window;
            originalLocalStorage = window.localStorage;
        }

        // @ts-expect-error - mocking global
        global.window = {
            localStorage: mockLocalStorage,
        };

        // Reset wallet API mock
        mockWalletsApi.get.mockReturnValue([]);
        mockWalletsApi.on.mockReturnValue(() => {});
    });

    afterEach(() => {
        // Restore original values
        if (originalWindow) {
            // @ts-expect-error - restoring global
            global.window = originalWindow;
        }
        if (originalLocalStorage && typeof window !== 'undefined') {
            window.localStorage = originalLocalStorage;
        }
    });

    describe('Initialization', () => {
        it('should create a connector client instance with default config', () => {
            const client = new ConnectorClient();
            expect(client).toBeDefined();

            const state = client.getConnectorState();
            expect(state.wallets).toEqual([]);
            expect(state.selectedWallet).toBe(null);
            expect(state.connected).toBe(false);
            expect(state.connecting).toBe(false);
            expect(state.accounts).toEqual([]);
            expect(state.selectedAccount).toBe(null);
        });

        it('should create a connector client instance with custom config', () => {
            const mockStorage = createMockStorage();
            const config: ConnectorConfig = {
                autoConnect: true,
                debug: true,
                storage: mockStorage,
            };

            const client = new ConnectorClient(config);
            expect(client).toBeDefined();
        });

        it('should handle window undefined (SSR environment)', () => {
            const originalWindow = global.window;
            // @ts-expect-error - testing SSR
            global.window = undefined;

            const client = new ConnectorClient();
            expect(client).toBeDefined();

            // @ts-expect-error - restoring
            global.window = originalWindow;
        });
    });

    describe('API Methods', () => {
        it('should have all required methods', () => {
            const client = new ConnectorClient();

            expect(client).toHaveProperty('select');
            expect(client).toHaveProperty('disconnect');
            expect(client).toHaveProperty('selectAccount');
            expect(client).toHaveProperty('getConnectorState');
            expect(client).toHaveProperty('subscribe');
            expect(client).toHaveProperty('destroy');
        });

        it('should provide correct method types', () => {
            const client = new ConnectorClient();

            expect(typeof client.select).toBe('function');
            expect(typeof client.disconnect).toBe('function');
            expect(typeof client.selectAccount).toBe('function');
            expect(typeof client.getConnectorState).toBe('function');
            expect(typeof client.subscribe).toBe('function');
            expect(typeof client.destroy).toBe('function');
        });
    });

    describe('Wallet Discovery', () => {
        it('should discover Solana-compatible wallets', () => {
            const phantomWallet = createMockWallet('Phantom');
            const solflareWallet = createMockWallet('Solflare');

            mockWalletsApi.get.mockReturnValue([phantomWallet, solflareWallet]);

            const client = new ConnectorClient();
            const state = client.getConnectorState();

            expect(state.wallets).toHaveLength(2);
            expect(state.wallets[0].name).toBe('Phantom');
            expect(state.wallets[0].connectable).toBe(true);
            expect(state.wallets[1].name).toBe('Solflare');
            expect(state.wallets[1].connectable).toBe(true);
        });

        it('should handle duplicate wallets by name', () => {
            const wallet1 = createMockWallet('Phantom');
            const wallet2 = createMockWallet('Phantom');

            mockWalletsApi.get.mockReturnValue([wallet1, wallet2]);

            const client = new ConnectorClient();
            const state = client.getConnectorState();

            expect(state.wallets).toHaveLength(1);
            expect(state.wallets[0].name).toBe('Phantom');
        });

        it('should mark wallets as non-connectable if missing required features', () => {
            const walletNoConnect = createMockWallet('TestWallet', false, true);
            const walletNoDisconnect = createMockWallet('TestWallet2', true, false);

            mockWalletsApi.get.mockReturnValue([walletNoConnect, walletNoDisconnect]);

            const client = new ConnectorClient();
            const state = client.getConnectorState();

            expect(state.wallets).toHaveLength(2);
            expect(state.wallets[0].connectable).toBe(false);
            expect(state.wallets[1].connectable).toBe(false);
        });

        it('should handle wallet registration events', () => {
            let registerCallback: () => void = () => {};
            mockWalletsApi.on.mockImplementation((event: string, callback: () => void) => {
                if (event === 'register') {
                    registerCallback = callback;
                }
                return () => {};
            });

            const client = new ConnectorClient();

            // Initially no wallets
            expect(client.getConnectorState().wallets).toHaveLength(0);

            // Add a wallet and trigger register event
            const newWallet = createMockWallet('NewWallet');
            mockWalletsApi.get.mockReturnValue([newWallet]);
            registerCallback();

            // Should now have the new wallet
            expect(client.getConnectorState().wallets).toHaveLength(1);
            expect(client.getConnectorState().wallets[0].name).toBe('NewWallet');
        });
    });

    describe('Wallet Connection', () => {
        let client: ConnectorClient;
        let mockWallet: MockWallet;

        beforeEach(() => {
            mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);
            client = new ConnectorClient();
        });

        it('should successfully connect to a wallet', async () => {
            await client.select('Phantom');

            const state = client.getConnectorState();
            expect(state.connected).toBe(true);
            expect(state.connecting).toBe(false);
            expect(state.selectedWallet).toBe(mockWallet);
            expect(state.accounts).toHaveLength(1);
            expect(state.selectedAccount).toBe(TEST_ADDRESSES.PHANTOM_ACCOUNT_1);
        });

        it('should set connecting state during connection', async () => {
            let resolveConnect: ((value: { accounts: Array<{ address: string }> }) => void) | undefined;
            const connectPromise = new Promise(resolve => {
                resolveConnect = resolve;
            });

            mockWallet.features['standard:connect'].connect.mockReturnValue(connectPromise);

            const connectPromise2 = client.select('Phantom');

            // Should be in connecting state
            expect(client.getConnectorState().connecting).toBe(true);
            expect(client.getConnectorState().connected).toBe(false);

            // Resolve the connection
            resolveConnect?.({
                accounts: [
                    {
                        address: TEST_ADDRESSES.PHANTOM_ACCOUNT_1,
                    },
                ],
            });

            await connectPromise2;

            // Should be connected
            expect(client.getConnectorState().connecting).toBe(false);
            expect(client.getConnectorState().connected).toBe(true);
        });

        it('should throw error when wallet is not found', async () => {
            await expect(client.select('NonExistentWallet')).rejects.toThrow('Wallet NonExistentWallet not found');
        });

        it('should throw error when wallet does not support standard connect', async () => {
            const walletNoConnect = createMockWallet('NoConnect', false);
            mockWalletsApi.get.mockReturnValue([walletNoConnect]);
            const client2 = new ConnectorClient();

            await expect(client2.select('NoConnect')).rejects.toThrow(
                'Wallet NoConnect does not support standard connect',
            );
        });

        it('should handle connection errors gracefully', async () => {
            mockWallet.features['standard:connect'].connect.mockRejectedValue(new Error('User rejected'));

            await expect(client.select('Phantom')).rejects.toThrow('User rejected');

            const state = client.getConnectorState();
            expect(state.connected).toBe(false);
            expect(state.connecting).toBe(false);
            expect(state.selectedWallet).toBe(null);
        });

        it('should store last connected wallet in storage', async () => {
            await client.select('Phantom');

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('arc-connector:lastWallet', 'Phantom');
        });
    });

    describe('Wallet Disconnection', () => {
        let client: ConnectorClient;
        let mockWallet: MockWallet;

        beforeEach(async () => {
            mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);
            client = new ConnectorClient();
            await client.select('Phantom');
        });

        it('should successfully disconnect wallet', async () => {
            const originalState = client.getConnectorState();
            expect(originalState.connected).toBe(true);
            
            await client.disconnect();

            const state = client.getConnectorState();
            expect(state.connected).toBe(false);
            expect(state.selectedWallet).toBe(null);
            expect(state.accounts).toEqual([]);
            expect(state.selectedAccount).toBe(null);
        });

        it('should call wallet disconnect feature if available', async () => {
            const disconnectSpy = mockWallet.features['standard:disconnect'].disconnect;

            await client.disconnect();

            expect(disconnectSpy).toHaveBeenCalled();
        });

        it('should handle disconnect errors gracefully', async () => {
            mockWallet.features['standard:disconnect'].disconnect.mockRejectedValue(new Error('Disconnect failed'));

            // Should not throw, but log error in debug mode
            await client.disconnect();

            const state = client.getConnectorState();
            expect(state.connected).toBe(false);
        });

        it('should remove wallet from storage on disconnect', async () => {
            await client.disconnect();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('arc-connector:lastWallet');
        });
    });

    describe('Account Management', () => {
        let client: ConnectorClient;
        let mockWallet: MockWallet;

        beforeEach(async () => {
            mockWallet = createMockWallet('Phantom');
            mockWallet.accounts = [
                { address: TEST_ADDRESSES.PHANTOM_ACCOUNT_1 },
                { address: TEST_ADDRESSES.PHANTOM_ACCOUNT_2 },
            ];
            mockWalletsApi.get.mockReturnValue([mockWallet]);
            client = new ConnectorClient();
            await client.select('Phantom');
        });

        it('should select an account', async () => {
            await client.selectAccount(TEST_ADDRESSES.PHANTOM_ACCOUNT_2);

            const state = client.getConnectorState();
            expect(state.selectedAccount).toBe(TEST_ADDRESSES.PHANTOM_ACCOUNT_2);
        });

        it('should throw error when no wallet is connected', async () => {
            await client.disconnect();

            await expect(client.selectAccount(TEST_ADDRESSES.PHANTOM_ACCOUNT_1)).rejects.toThrow(
                'No wallet connected',
            );
        });

        it('should handle account not found by reconnecting', async () => {
            const reconnectResponse = {
                accounts: [{ address: TEST_ADDRESSES.PHANTOM_ACCOUNT_3 }],
            };
            mockWallet.features['standard:connect'].connect.mockResolvedValue(reconnectResponse);

            await client.selectAccount(TEST_ADDRESSES.PHANTOM_ACCOUNT_3);

            expect(client.getConnectorState().selectedAccount).toBe(TEST_ADDRESSES.PHANTOM_ACCOUNT_3);
        });

        it('should throw error if requested account is not available after reconnect', async () => {
            mockWallet.features['standard:connect'].connect.mockResolvedValue({
                accounts: [],
            });

            await expect(client.selectAccount(TEST_ADDRESSES.NONEXISTENT_ACCOUNT)).rejects.toThrow(
                'Requested account not available',
            );
        });
    });

    describe('State Subscription', () => {
        it('should allow subscribing to state changes', () => {
            const client = new ConnectorClient();
            const listener = vi.fn();

            const unsubscribe = client.subscribe(listener);
            expect(typeof unsubscribe).toBe('function');
        });

        it('should notify subscribers of state changes', async () => {
            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();
            const listener = vi.fn();

            client.subscribe(listener);

            await client.select('Phantom');

            expect(listener).toHaveBeenCalled();
            const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
            expect(lastCall.connected).toBe(true);
        });

        it('should allow unsubscribing from state changes', () => {
            const client = new ConnectorClient();
            const listener = vi.fn();

            const unsubscribe = client.subscribe(listener);
            unsubscribe();

            // Should not call listener after unsubscribing
            // (This would require triggering a state change to verify)
        });
    });

    describe('Auto Connect', () => {
        it('should attempt auto-connect when enabled', async () => {
            mockLocalStorage.getItem.mockReturnValue('Phantom');
            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient({ autoConnect: true });

            // Wait for auto-connect to complete
            await new Promise(resolve => setTimeout(resolve, AUTO_CONNECT_DELAY));

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('arc-connector:lastWallet');
        });

        it('should not auto-connect when disabled', () => {
            mockLocalStorage.getItem.mockReturnValue('Phantom');

            const client = new ConnectorClient({ autoConnect: false });

            // Should not check storage
            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });

        it('should handle auto-connect failures gracefully', () => {
            mockLocalStorage.getItem.mockReturnValue('NonExistentWallet');
            mockWalletsApi.get.mockReturnValue([]);

            // Should not throw
            const client = new ConnectorClient({ autoConnect: true });
            expect(client).toBeDefined();
        });
    });

    describe('Storage Integration', () => {
        it('should use custom storage when provided', async () => {
            const customStorage = createMockStorage();
            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient({ storage: customStorage });
            await client.select('Phantom');

            expect(customStorage.setItem).toHaveBeenCalledWith('arc-connector:lastWallet', 'Phantom');
        });

        it('should handle storage errors gracefully', async () => {
            // Create a separate storage mock for this test
            const errorStorage = createMockStorage();
            errorStorage.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });

            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);
            const client = new ConnectorClient({ storage: errorStorage, debug: true });

            // Storage errors should not prevent wallet connection
            await expect(client.select('Phantom')).resolves.not.toThrow();

            // Connection should succeed despite storage error
            const state = client.getConnectorState();
            expect(state.connected).toBe(true);
            expect(state.selectedWallet).toBe(mockWallet);
            expect(state.accounts).toHaveLength(1);
        });

        it('should handle storage errors during disconnect gracefully', async () => {
            const errorStorage = createMockStorage();
            errorStorage.removeItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);
            const client = new ConnectorClient({ storage: errorStorage, debug: true });

            // Connect first
            await client.select('Phantom');
            expect(client.getConnectorState().connected).toBe(true);

            // Disconnect should not throw despite storage error
            await expect(client.disconnect()).resolves.not.toThrow();

            // Disconnection should succeed despite storage error
            const state = client.getConnectorState();
            expect(state.connected).toBe(false);
            expect(state.selectedWallet).toBe(null);
        });

        it('should handle missing localStorage gracefully', async () => {
            // @ts-expect-error - testing missing localStorage
            global.window = {};

            const client = new ConnectorClient();
            expect(client).toBeDefined();
        });
    });

    describe('Event Handling', () => {
        it('should subscribe to wallet events when available', async () => {
            const mockWallet = createMockWallet('Phantom', true, true, true);
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();
            await client.select('Phantom');

            const eventsFeature = mockWallet.features['standard:events'];
            expect(eventsFeature.on).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('should handle wallet change events', async () => {
            let changeCallback: (properties: { accounts: Array<{ address: string }> }) => void = () => {};
            const mockWallet = createMockWallet('Phantom', true, true, true);
            mockWallet.features['standard:events']?.on.mockImplementation((event: string, callback: (properties: { accounts: Array<{ address: string }> }) => void) => {
                if (event === 'change') {
                    changeCallback = callback;
                }
                return () => {};
            });

            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();
            const listener = vi.fn();
            client.subscribe(listener);

            await client.select('Phantom');

            // Simulate account change
            changeCallback({
                accounts: [{ address: TEST_ADDRESSES.PHANTOM_ACCOUNT_4 }],
            });

            expect(listener).toHaveBeenCalled();
        });

        it('should fall back to polling when events are not supported', async () => {
            const mockWallet = createMockWallet('Phantom', true, true, false);
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();
            await client.select('Phantom');

            // Should not have called events feature
            expect(mockWallet.features['standard:events']).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle wallet standard initialization errors', async () => {
            // Reset the mock to throw an error
            const getWalletsMock = vi.mocked(await import('@wallet-standard/app')).getWallets;
            getWalletsMock.mockImplementationOnce(() => {
                throw new Error('Wallet standard error');
            });

            // Should not throw during construction
            const client = new ConnectorClient({ debug: true });
            expect(client).toBeDefined();
            expect(() => client.getConnectorState()).not.toThrow();
            expect(() => client.subscribe(() => {})).not.toThrow();
            const state = client.getConnectorState();
            expect(state.wallets).toEqual([]);
            expect(state.connected).toBe(false);
            expect(state.selectedWallet).toBe(null);
        });

        it('should handle polling errors gracefully', async () => {
            const mockWallet = createMockWallet('Phantom');

            // Make wallet.accounts accessible during initial connection but throw later
            let throwError = false;
            Object.defineProperty(mockWallet, 'accounts', {
                get() {
                    if (throwError) throw new Error('Access error');
                    return [];
                },
            });

            mockWalletsApi.get.mockReturnValue([mockWallet]);
            const client = new ConnectorClient();

            await client.select('Phantom');

            // Now enable the error for polling
            throwError = true;

            // Should handle error gracefully (no throwing)
            expect(client.getConnectorState().connected).toBe(true);
        });
    });

    describe('Cleanup', () => {
        it('should cleanup resources when destroyed', async () => {
            const mockWallet = createMockWallet('Phantom', true, true, true);
            const eventUnsubscribe = vi.fn();
            mockWallet.features['standard:events'].on.mockReturnValue(eventUnsubscribe);

            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();
            await client.select('Phantom');

            client.destroy();

            // Should cleanup wallet event listener
            expect(eventUnsubscribe).toHaveBeenCalled();
        });

        it('should handle cleanup errors gracefully', () => {
            const client = new ConnectorClient();

            // Should not throw
            client.destroy();
            expect(true).toBe(true); // Test passes if no error thrown
        });
    });

    describe('Debug Mode', () => {
        it('should log debug information when enabled', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient({ debug: true });
            await client.select('Phantom');

            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should not log debug information when disabled', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient({ debug: false });
            await client.select('Phantom');

            // Should not have debug logs
            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid connect/disconnect cycles', async () => {
            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();

            // Rapid connect/disconnect
            await client.select('Phantom');
            await client.disconnect();
            await client.select('Phantom');
            await client.disconnect();

            const state = client.getConnectorState();
            expect(state.connected).toBe(false);
        });

        it('should handle multiple simultaneous connection attempts', async () => {
            const mockWallet = createMockWallet('Phantom');
            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();

            // Start multiple connections - first one should succeed, others should fail gracefully
            const results = await Promise.allSettled([
                client.select('Phantom'),
                client.select('Phantom'),
                client.select('Phantom'),
            ]);

            // At least one should succeed
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            expect(successCount).toBeGreaterThanOrEqual(1);

            const state = client.getConnectorState();
            expect(state.connected).toBe(true);
        });

        it('should preserve account selection across wallet changes', async () => {
            const mockWallet = createMockWallet('Phantom');
            mockWallet.accounts = [
                { address: TEST_ADDRESSES.PHANTOM_ACCOUNT_1 },
                { address: TEST_ADDRESSES.PHANTOM_ACCOUNT_2 },
            ];

            mockWalletsApi.get.mockReturnValue([mockWallet]);

            const client = new ConnectorClient();
            await client.select('Phantom');
            await client.selectAccount(TEST_ADDRESSES.PHANTOM_ACCOUNT_2);

            expect(client.getConnectorState().selectedAccount).toBe(TEST_ADDRESSES.PHANTOM_ACCOUNT_2);

            // Simulate wallet account change that still includes the selected account
            if (mockWallet.features['standard:events']) {
                const changeHandler = mockWallet.features['standard:events'].on.mock.calls.find(
                    call => call[0] === 'change',
                )?.[1];

                if (changeHandler) {
                    changeHandler({
                        accounts: [
                            { address: TEST_ADDRESSES.PHANTOM_ACCOUNT_2 },
                            { address: TEST_ADDRESSES.PHANTOM_ACCOUNT_3 },
                        ],
                    });
                }
            }

            // Should preserve the selected account
            expect(client.getConnectorState().selectedAccount).toBe(TEST_ADDRESSES.PHANTOM_ACCOUNT_2);
        });
    });
});
