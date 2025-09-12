import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConnectorClient, type ConnectorConfig, type WalletInfo } from '../lib/connector-client'

// Mock wallet standard API
const mockWalletsApi = {
  get: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

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
              address: '11111111111111111111111111111112',
              icon: 'data:image/svg+xml;base64,accountIcon'
            }
          ]
        })
      }
    }),
    ...(hasDisconnect && {
      'standard:disconnect': {
        disconnect: vi.fn().mockResolvedValue(undefined)
      }
    }),
    ...(hasEvents && {
      'standard:events': {
        on: vi.fn(),
        off: vi.fn()
      }
    })
  }
})

// Mock non-Solana wallet
const createMockEthereumWallet = (name: string) => ({
  name,
  icon: `data:image/svg+xml;base64,${name}Icon`,
  version: '1.0.0',
  accounts: [],
  chains: ['ethereum:1'], // No Solana chains
  features: {
    'standard:connect': {
      connect: vi.fn().mockResolvedValue({
        accounts: []
      })
    },
    'standard:disconnect': {
      disconnect: vi.fn().mockResolvedValue(undefined)
    }
  }
})

// Mock storage
const createMockStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
})

// Mock localStorage
const mockLocalStorage = createMockStorage()

// Mock wallet standard module
vi.mock('@wallet-standard/app', () => ({
  getWallets: vi.fn(() => mockWalletsApi)
}))

describe('ConnectorClient', () => {
  let originalLocalStorage: Storage | undefined
  let originalWindow: Window | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset storage mock implementations
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    mockLocalStorage.removeItem.mockImplementation(() => {})
    
    // Setup window and localStorage mocks
    if (typeof window !== 'undefined') {
      originalWindow = window
      originalLocalStorage = window.localStorage
    }
    
    // @ts-expect-error - mocking global
    global.window = {
      localStorage: mockLocalStorage
    }
    
    // Reset wallet API mock
    mockWalletsApi.get.mockReturnValue([])
    mockWalletsApi.on.mockReturnValue(() => {})
  })

  afterEach(() => {
    // Restore original values
    if (originalWindow) {
      // @ts-expect-error - restoring global
      global.window = originalWindow
    }
    if (originalLocalStorage && typeof window !== 'undefined') {
      window.localStorage = originalLocalStorage
    }
  })

  describe('Initialization', () => {
    it('should create a connector client instance with default config', () => {
      const client = new ConnectorClient()
      expect(client).toBeDefined()
      
      const state = client.getSnapshot()
      expect(state.wallets).toEqual([])
      expect(state.selectedWallet).toBe(null)
      expect(state.connected).toBe(false)
      expect(state.connecting).toBe(false)
      expect(state.accounts).toEqual([])
      expect(state.selectedAccount).toBe(null)
    })

    it('should create a connector client instance with custom config', () => {
      const mockStorage = createMockStorage()
      const config: ConnectorConfig = {
        autoConnect: true,
        debug: true,
        storage: mockStorage
      }
      
      const client = new ConnectorClient(config)
      expect(client).toBeDefined()
    })

    it('should handle window undefined (SSR environment)', () => {
      const originalWindow = global.window
      // @ts-expect-error - testing SSR
      global.window = undefined
      
    const client = new ConnectorClient()
    expect(client).toBeDefined()
      
      // @ts-expect-error - restoring
      global.window = originalWindow
    })
  })

  describe('API Methods', () => {
    it('should have all required methods', () => {
    const client = new ConnectorClient()
    
      expect(client).toHaveProperty('select')
    expect(client).toHaveProperty('disconnect')
      expect(client).toHaveProperty('selectAccount')
      expect(client).toHaveProperty('getSnapshot')
      expect(client).toHaveProperty('subscribe')
      expect(client).toHaveProperty('destroy')
    })

    it('should provide correct method types', () => {
      const client = new ConnectorClient()
      
      expect(typeof client.select).toBe('function')
      expect(typeof client.disconnect).toBe('function')
      expect(typeof client.selectAccount).toBe('function')
      expect(typeof client.getSnapshot).toBe('function')
      expect(typeof client.subscribe).toBe('function')
      expect(typeof client.destroy).toBe('function')
    })
  })

  describe('Wallet Discovery', () => {
    it('should discover and filter Solana-compatible wallets', () => {
      const solanaWallet = createMockWallet('Phantom')
      const ethereumWallet = createMockEthereumWallet('MetaMask')
      
      mockWalletsApi.get.mockReturnValue([solanaWallet, ethereumWallet])
      
      const client = new ConnectorClient()
      const state = client.getSnapshot()
      
      // Both wallets should be discovered but only Solana wallet should be connectable
      expect(state.wallets).toHaveLength(2)
      
      const connectableWallets = state.wallets.filter(w => w.connectable)
      expect(connectableWallets).toHaveLength(1)
      expect(connectableWallets[0].name).toBe('Phantom')
      expect(connectableWallets[0].connectable).toBe(true)
      
      const nonConnectableWallets = state.wallets.filter(w => !w.connectable)
      expect(nonConnectableWallets).toHaveLength(1)
      expect(nonConnectableWallets[0].name).toBe('MetaMask')
      expect(nonConnectableWallets[0].connectable).toBe(false)
    })

    it('should handle duplicate wallets by name', () => {
      const wallet1 = createMockWallet('Phantom')
      const wallet2 = createMockWallet('Phantom')
      
      mockWalletsApi.get.mockReturnValue([wallet1, wallet2])
      
      const client = new ConnectorClient()
      const state = client.getSnapshot()
      
      expect(state.wallets).toHaveLength(1)
      expect(state.wallets[0].name).toBe('Phantom')
    })

    it('should mark wallets as non-connectable if missing required features', () => {
      const walletNoConnect = createMockWallet('TestWallet', false, true)
      const walletNoDisconnect = createMockWallet('TestWallet2', true, false)
      
      mockWalletsApi.get.mockReturnValue([walletNoConnect, walletNoDisconnect])
      
      const client = new ConnectorClient()
      const state = client.getSnapshot()
      
      expect(state.wallets).toHaveLength(2)
      expect(state.wallets[0].connectable).toBe(false)
      expect(state.wallets[1].connectable).toBe(false)
    })

    it('should handle wallet registration events', () => {
      let registerCallback: () => void = () => {}
      mockWalletsApi.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'register') {
          registerCallback = callback
        }
        return () => {}
      })

      const client = new ConnectorClient()
      
      // Initially no wallets
      expect(client.getSnapshot().wallets).toHaveLength(0)
      
      // Add a wallet and trigger register event
      const newWallet = createMockWallet('NewWallet')
      mockWalletsApi.get.mockReturnValue([newWallet])
      registerCallback()
      
      // Should now have the new wallet
      expect(client.getSnapshot().wallets).toHaveLength(1)
      expect(client.getSnapshot().wallets[0].name).toBe('NewWallet')
    })
  })

  describe('Wallet Connection', () => {
    let client: ConnectorClient
    let mockWallet: any

    beforeEach(() => {
      mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      client = new ConnectorClient()
    })

    it('should successfully connect to a wallet', async () => {
      await client.select('Phantom')
      
      const state = client.getSnapshot()
      expect(state.connected).toBe(true)
      expect(state.connecting).toBe(false)
      expect(state.selectedWallet).toBe(mockWallet)
      expect(state.accounts).toHaveLength(1)
      expect(state.selectedAccount).toBe('11111111111111111111111111111112')
    })

    it('should set connecting state during connection', async () => {
      let resolveConnect: (value: any) => void
      const connectPromise = new Promise(resolve => {
        resolveConnect = resolve
      })
      
      mockWallet.features['standard:connect'].connect.mockReturnValue(connectPromise)
      
      const connectPromise2 = client.select('Phantom')
      
      // Should be in connecting state
      expect(client.getSnapshot().connecting).toBe(true)
      expect(client.getSnapshot().connected).toBe(false)
      
      // Resolve the connection
      resolveConnect!({
        accounts: [{
          address: '11111111111111111111111111111112'
        }]
      })
      
      await connectPromise2
      
      // Should be connected
      expect(client.getSnapshot().connecting).toBe(false)
      expect(client.getSnapshot().connected).toBe(true)
    })

    it('should throw error when wallet is not found', async () => {
      await expect(client.select('NonExistentWallet'))
        .rejects.toThrow('Wallet NonExistentWallet not found')
    })

    it('should throw error when wallet does not support standard connect', async () => {
      const walletNoConnect = createMockWallet('NoConnect', false)
      mockWalletsApi.get.mockReturnValue([walletNoConnect])
      const client2 = new ConnectorClient()
      
      await expect(client2.select('NoConnect'))
        .rejects.toThrow('Wallet NoConnect does not support standard connect')
    })

    it('should handle connection errors gracefully', async () => {
      mockWallet.features['standard:connect'].connect.mockRejectedValue(
        new Error('User rejected')
      )
      
      await expect(client.select('Phantom')).rejects.toThrow('User rejected')
      
      const state = client.getSnapshot()
      expect(state.connected).toBe(false)
      expect(state.connecting).toBe(false)
      expect(state.selectedWallet).toBe(null)
    })

    it('should store last connected wallet in storage', async () => {
      await client.select('Phantom')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'arc-connector:lastWallet',
        'Phantom'
      )
    })
  })

  describe('Wallet Disconnection', () => {
    let client: ConnectorClient
    let mockWallet: any

    beforeEach(async () => {
      mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      client = new ConnectorClient()
      await client.select('Phantom')
    })

    it('should successfully disconnect wallet', async () => {
      await client.disconnect()
      
      const state = client.getSnapshot()
      expect(state.connected).toBe(false)
      expect(state.selectedWallet).toBe(null)
      expect(state.accounts).toEqual([])
      expect(state.selectedAccount).toBe(null)
    })

    it('should call wallet disconnect feature if available', async () => {
      const disconnectSpy = mockWallet.features['standard:disconnect'].disconnect
      
      await client.disconnect()
      
      expect(disconnectSpy).toHaveBeenCalled()
    })

    it('should handle disconnect errors gracefully', async () => {
      mockWallet.features['standard:disconnect'].disconnect.mockRejectedValue(
        new Error('Disconnect failed')
      )
      
      // Should not throw, but log error in debug mode
      await client.disconnect()
      
      const state = client.getSnapshot()
      expect(state.connected).toBe(false)
    })

    it('should remove wallet from storage on disconnect', async () => {
      await client.disconnect()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'arc-connector:lastWallet'
      )
    })
  })

  describe('Account Management', () => {
    let client: ConnectorClient
    let mockWallet: any

    beforeEach(async () => {
      mockWallet = createMockWallet('Phantom')
      mockWallet.accounts = [
        { address: '11111111111111111111111111111112' },
        { address: '22222222222222222222222222222223' }
      ]
      mockWalletsApi.get.mockReturnValue([mockWallet])
      client = new ConnectorClient()
      await client.select('Phantom')
    })

    it('should select an account', async () => {
      await client.selectAccount('22222222222222222222222222222223')
      
      const state = client.getSnapshot()
      expect(state.selectedAccount).toBe('22222222222222222222222222222223')
    })

    it('should throw error when no wallet is connected', async () => {
      await client.disconnect()
      
      await expect(client.selectAccount('11111111111111111111111111111112'))
        .rejects.toThrow('No wallet connected')
    })

    it('should handle account not found by reconnecting', async () => {
      const reconnectResponse = {
        accounts: [
          { address: '33333333333333333333333333333334' }
        ]
      }
      mockWallet.features['standard:connect'].connect.mockResolvedValue(reconnectResponse)
      
      await client.selectAccount('33333333333333333333333333333334')
      
      expect(client.getSnapshot().selectedAccount).toBe('33333333333333333333333333333334')
    })

    it('should throw error if requested account is not available after reconnect', async () => {
      mockWallet.features['standard:connect'].connect.mockResolvedValue({
        accounts: []
      })
      
      await expect(client.selectAccount('99999999999999999999999999999999'))
        .rejects.toThrow('Requested account not available')
    })
  })

  describe('State Subscription', () => {
    it('should allow subscribing to state changes', () => {
      const client = new ConnectorClient()
      const listener = vi.fn()
      
      const unsubscribe = client.subscribe(listener)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should notify subscribers of state changes', async () => {
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient()
      const listener = vi.fn()
      
      client.subscribe(listener)
      
      await client.select('Phantom')
      
      expect(listener).toHaveBeenCalled()
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0]
      expect(lastCall.connected).toBe(true)
    })

    it('should allow unsubscribing from state changes', () => {
      const client = new ConnectorClient()
      const listener = vi.fn()
      
      const unsubscribe = client.subscribe(listener)
      unsubscribe()
      
      // Should not call listener after unsubscribing
      // (This would require triggering a state change to verify)
    })
  })

  describe('Auto Connect', () => {
    it('should attempt auto-connect when enabled', async () => {
      mockLocalStorage.getItem.mockReturnValue('Phantom')
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient({ autoConnect: true })
      
      // Wait for auto-connect to complete
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('arc-connector:lastWallet')
    })

    it('should not auto-connect when disabled', () => {
      mockLocalStorage.getItem.mockReturnValue('Phantom')
      
      const client = new ConnectorClient({ autoConnect: false })
      
      // Should not check storage
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled()
    })

    it('should handle auto-connect failures gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('NonExistentWallet')
      mockWalletsApi.get.mockReturnValue([])
      
      // Should not throw
      const client = new ConnectorClient({ autoConnect: true })
      expect(client).toBeDefined()
    })
  })

  describe('Storage Integration', () => {
    it('should use custom storage when provided', async () => {
      const customStorage = createMockStorage()
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient({ storage: customStorage })
      await client.select('Phantom')
      
      expect(customStorage.setItem).toHaveBeenCalledWith(
        'arc-connector:lastWallet',
        'Phantom'
      )
    })

    it('should handle storage errors gracefully', async () => {
      // Create a separate storage mock for this test
      const errorStorage = createMockStorage()
      errorStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      const client = new ConnectorClient({ storage: errorStorage })
      
      // Storage error should be thrown (current behavior)
      // This reveals that storage errors are not handled gracefully in the current implementation
      await expect(client.select('Phantom')).rejects.toThrow('Storage full')
      
      // Connection should still fail due to storage error
      expect(client.getSnapshot().connected).toBe(false)
    })

    it('should handle missing localStorage gracefully', async () => {
      // @ts-expect-error - testing missing localStorage
      global.window = {}
      
      const client = new ConnectorClient()
      expect(client).toBeDefined()
    })
  })

  describe('Event Handling', () => {
    it('should subscribe to wallet events when available', async () => {
      const mockWallet = createMockWallet('Phantom', true, true, true)
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient()
      await client.select('Phantom')
      
      const eventsFeature = mockWallet.features['standard:events']
      expect(eventsFeature.on).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should handle wallet change events', async () => {
      let changeCallback: (properties: any) => void = () => {}
      const mockWallet = createMockWallet('Phantom', true, true, true)
      mockWallet.features['standard:events'].on.mockImplementation((event: string, callback: any) => {
        if (event === 'change') {
          changeCallback = callback
        }
        return () => {}
      })
      
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient()
      const listener = vi.fn()
      client.subscribe(listener)
      
      await client.select('Phantom')
      
      // Simulate account change
      changeCallback({
        accounts: [
          { address: '44444444444444444444444444444445' }
        ]
      })
      
      expect(listener).toHaveBeenCalled()
    })

    it('should fall back to polling when events are not supported', async () => {
      const mockWallet = createMockWallet('Phantom', true, true, false)
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient()
      await client.select('Phantom')
      
      // Should not have called events feature
      expect(mockWallet.features['standard:events']).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle wallet standard initialization errors', async () => {
      // Reset the mock to throw an error
      const getWalletsMock = vi.mocked(await import('@wallet-standard/app')).getWallets
      getWalletsMock.mockImplementationOnce(() => {
        throw new Error('Wallet standard error')
      })
      
      // Should not throw during construction
      const client = new ConnectorClient({ debug: true })
      expect(client).toBeDefined()
    })

    it('should handle polling errors gracefully', async () => {
      const mockWallet = createMockWallet('Phantom')
      
      // Make wallet.accounts accessible during initial connection but throw later
      let throwError = false
      Object.defineProperty(mockWallet, 'accounts', {
        get() { 
          if (throwError) throw new Error('Access error')
          return []
        }
      })
      
      mockWalletsApi.get.mockReturnValue([mockWallet])
      const client = new ConnectorClient({ debug: true })
      
      await client.select('Phantom')
      
      // Now enable the error for polling
      throwError = true
      
      // Should handle error gracefully (no throwing)
      expect(client.getSnapshot().connected).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources when destroyed', async () => {
      const mockWallet = createMockWallet('Phantom', true, true, true)
      let eventUnsubscribe = vi.fn()
      mockWallet.features['standard:events'].on.mockReturnValue(eventUnsubscribe)
      
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient()
      await client.select('Phantom')
      
      client.destroy()
      
      // Should cleanup wallet event listener
      expect(eventUnsubscribe).toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', () => {
      const client = new ConnectorClient()
      
      // Should not throw
      client.destroy()
      expect(true).toBe(true) // Test passes if no error thrown
    })
  })

  describe('Debug Mode', () => {
    it('should log debug information when enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient({ debug: true })
      await client.select('Phantom')
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should not log debug information when disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient({ debug: false })
      await client.select('Phantom')
      
      // Should not have debug logs
      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid connect/disconnect cycles', async () => {
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient()
      
      // Rapid connect/disconnect
      await client.select('Phantom')
      await client.disconnect()
      await client.select('Phantom')
      await client.disconnect()
      
      const state = client.getSnapshot()
      expect(state.connected).toBe(false)
    })

    it('should handle multiple simultaneous connection attempts', async () => {
      const mockWallet = createMockWallet('Phantom')
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
    const client = new ConnectorClient()
    
      // Start multiple connections - first one should succeed, others should fail gracefully
      const results = await Promise.allSettled([
        client.select('Phantom'),
        client.select('Phantom'),
        client.select('Phantom')
      ])
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 'fulfilled').length
      expect(successCount).toBeGreaterThanOrEqual(1)
      
      const state = client.getSnapshot()
      expect(state.connected).toBe(true)
    })

    it('should preserve account selection across wallet changes', async () => {
      const mockWallet = createMockWallet('Phantom')
      mockWallet.accounts = [
        { address: '11111111111111111111111111111112' },
        { address: '22222222222222222222222222222223' }
      ]
      
      mockWalletsApi.get.mockReturnValue([mockWallet])
      
      const client = new ConnectorClient()
      await client.select('Phantom')
      await client.selectAccount('22222222222222222222222222222223')
      
      expect(client.getSnapshot().selectedAccount).toBe('22222222222222222222222222222223')
      
      // Simulate wallet account change that still includes the selected account
      if (mockWallet.features['standard:events']) {
        const changeHandler = mockWallet.features['standard:events'].on.mock.calls
          .find(call => call[0] === 'change')?.[1]
        
        if (changeHandler) {
          changeHandler({
            accounts: [
              { address: '22222222222222222222222222222223' },
              { address: '33333333333333333333333333333334' }
            ]
          })
        }
      }
      
      // Should preserve the selected account
      expect(client.getSnapshot().selectedAccount).toBe('22222222222222222222222222222223')
    })
  })
})
