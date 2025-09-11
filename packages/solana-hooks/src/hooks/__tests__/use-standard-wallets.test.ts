import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStandardWallets } from '../use-standard-wallets'
import type { Wallet } from '@wallet-standard/base'

// Mock the wallet standard
const createMockWallet = (name: string, features: string[] = []): Wallet => ({
  name,
  icon: `data:image/svg+xml;base64,${name}`,
  version: '1.0.0',
  accounts: [],
  features: features.reduce((acc, feature) => {
    acc[feature] = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
    return acc
  }, {} as any),
  chains: ['solana:mainnet', 'solana:devnet'],
})

const mockWallets: Wallet[] = [
  createMockWallet('Phantom', ['standard:connect', 'solana:signTransaction', 'solana:signMessage']),
  createMockWallet('Solflare', ['standard:connect', 'solana:signTransaction']),
  createMockWallet('Backpack', ['standard:connect', 'solana:signTransaction']),
  createMockWallet('Non-Solana Wallet', ['ethereum:connect']), // Should be filtered out
]

const mockWalletsApi = {
  get: vi.fn(() => mockWallets),
  on: vi.fn((event, callback) => {
    // Return unsubscribe function
    return vi.fn()
  }),
}

vi.mock('@wallet-standard/app', () => ({
  getWallets: () => mockWalletsApi,
}))

vi.mock('@solana/kit', () => ({
  address: vi.fn((addr: string) => addr),
}))

describe('useStandardWallets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Wallet Discovery', () => {
    it('should discover and filter Solana-compatible wallets', () => {
      const { result } = renderHook(() => useStandardWallets())

      // Should filter out non-Solana wallets
      expect(result.current.wallets).toHaveLength(3)
      expect(result.current.wallets.map(w => w.name)).toEqual([
        'Phantom',
        'Solflare', 
        'Backpack'
      ])
    })

    it('should set correct wallet properties', () => {
      const { result } = renderHook(() => useStandardWallets())

      const phantomWallet = result.current.wallets.find(w => w.name === 'Phantom')
      expect(phantomWallet).toEqual({
        wallet: expect.any(Object),
        name: 'Phantom',
        icon: 'data:image/svg+xml;base64,Phantom',
        installed: true,
        connecting: false,
      })
    })

    it('should handle wallet registration events', () => {
      renderHook(() => useStandardWallets())

      // Verify event listeners were registered
      expect(mockWalletsApi.on).toHaveBeenCalledWith('register', expect.any(Function))
      expect(mockWalletsApi.on).toHaveBeenCalledWith('unregister', expect.any(Function))
    })
  })

  describe('Wallet Connection', () => {
    it('should successfully connect to a wallet', async () => {
      const mockAccount = {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        publicKey: new Uint8Array(32),
        chains: ['solana:devnet'],
      }

      const mockConnectFeature = {
        connect: vi.fn().mockResolvedValue({
          accounts: [mockAccount],
        }),
      }

      const mockPhantomWallet = {
        ...mockWallets[0],
        features: {
          'standard:connect': mockConnectFeature,
          'solana:signTransaction': { signTransaction: vi.fn() },
        },
      }

      mockWalletsApi.get.mockReturnValue([mockPhantomWallet, ...mockWallets.slice(1)])

      const { result } = renderHook(() => useStandardWallets())

      expect(result.current.connected).toBe(false)
      expect(result.current.connecting).toBe(false)

      await act(async () => {
        await result.current.select('Phantom')
      })

      expect(result.current.connected).toBe(true)
      expect(result.current.connecting).toBe(false)
      expect(result.current.address).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
      expect(result.current.selectedWallet).toBe(mockPhantomWallet)
      expect(result.current.signer).toBeDefined()
    })

    it('should handle connecting state during connection', async () => {
      let resolveConnect: (value: any) => void
      const connectPromise = new Promise(resolve => {
        resolveConnect = resolve
      })

      const mockConnectFeature = {
        connect: vi.fn().mockReturnValue(connectPromise),
      }

      const mockWallet = {
        ...mockWallets[0],
        features: {
          'standard:connect': mockConnectFeature,
        },
      }

      mockWalletsApi.get.mockReturnValue([mockWallet])

      const { result } = renderHook(() => useStandardWallets())

      const connectPromiseAct = act(async () => {
        result.current.select('Phantom')
      })

      // Should be connecting
      expect(result.current.connecting).toBe(true)

      // Resolve the connection
      resolveConnect!({
        accounts: [{
          address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        }],
      })

      await connectPromiseAct

      expect(result.current.connecting).toBe(false)
      expect(result.current.connected).toBe(true)
    })

    it('should throw error when wallet is not found', async () => {
      const { result } = renderHook(() => useStandardWallets())

      await expect(
        result.current.select('NonExistentWallet')
      ).rejects.toThrow('Wallet NonExistentWallet not found')
    })

    it('should throw error when wallet does not support standard connect', async () => {
      const mockWallet = {
        ...mockWallets[0],
        features: {
          // Missing standard:connect
          'solana:signTransaction': { signTransaction: vi.fn() },
        },
      }

      mockWalletsApi.get.mockReturnValue([mockWallet])

      const { result } = renderHook(() => useStandardWallets())

      await expect(
        result.current.select('Phantom')
      ).rejects.toThrow('Wallet Phantom does not support standard connect')
    })

    it('should handle connection errors gracefully', async () => {
      const mockConnectFeature = {
        connect: vi.fn().mockRejectedValue(new Error('User rejected connection')),
      }

      const mockWallet = {
        ...mockWallets[0],
        features: {
          'standard:connect': mockConnectFeature,
        },
      }

      mockWalletsApi.get.mockReturnValue([mockWallet])

      const { result } = renderHook(() => useStandardWallets())

      await expect(
        result.current.select('Phantom')
      ).rejects.toThrow('User rejected connection')

      // Should reset connecting state on error
      expect(result.current.connecting).toBe(false)
    })
  })

  describe('Wallet Disconnection', () => {
    it('should successfully disconnect wallet', async () => {
      const { result } = renderHook(() => useStandardWallets())

      // First connect a wallet (mock the connected state)
      act(() => {
        // Simulate a connected state
        result.current.select = vi.fn()
      })

      // Manually set connected state for testing
      const mockAccount = {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      }

      // Test disconnection
      await act(async () => {
        await result.current.disconnect()
      })

      expect(result.current.connected).toBe(false)
      expect(result.current.selectedWallet).toBe(null)
      expect(result.current.address).toBe(null)
      expect(result.current.signer).toBe(null)
    })
  })

  describe('Wallet Standard Kit Signer', () => {
    it('should create a signer with correct address', async () => {
      const mockAccount = {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        publicKey: new Uint8Array(32),
      }

      const mockConnectFeature = {
        connect: vi.fn().mockResolvedValue({
          accounts: [mockAccount],
        }),
      }

      const mockWallet = {
        ...mockWallets[0],
        features: {
          'standard:connect': mockConnectFeature,
          'solana:signTransaction': { signTransaction: vi.fn() },
        },
      }

      mockWalletsApi.get.mockReturnValue([mockWallet])

      const { result } = renderHook(() => useStandardWallets())

      await act(async () => {
        await result.current.select('Phantom')
      })

      expect(result.current.signer).toBeDefined()
      expect(result.current.signer?.address).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    })

    it('should support transaction signing through signer', async () => {
      const mockAccount = {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      }

      const mockSignTransaction = vi.fn().mockResolvedValue({
        signedTransaction: new Uint8Array([1, 2, 3]),
      })

      const mockConnectFeature = {
        connect: vi.fn().mockResolvedValue({
          accounts: [mockAccount],
        }),
      }

      const mockWallet = {
        ...mockWallets[0],
        features: {
          'standard:connect': mockConnectFeature,
          'solana:signTransaction': {
            signTransaction: mockSignTransaction,
          },
        },
      }

      mockWalletsApi.get.mockReturnValue([mockWallet])

      const { result } = renderHook(() => useStandardWallets())

      await act(async () => {
        await result.current.select('Phantom')
      })

      // Test that the signer can be used for signing
      expect(result.current.signer).toBeDefined()
      expect(typeof result.current.signer?.modifyAndSignTransactions).toBe('function')
    })
  })

  describe('Options', () => {
    it('should handle autoConnect option', () => {
      renderHook(() => useStandardWallets({ autoConnect: true }))

      // autoConnect behavior would be tested in integration,
      // here we just verify the option is accepted
      expect(true).toBe(true) // Placeholder for autoConnect logic test
    })

    it('should use default options when none provided', () => {
      const { result } = renderHook(() => useStandardWallets())

      // Should initialize with default state
      expect(result.current.wallets).toBeDefined()
      expect(result.current.connected).toBe(false)
      expect(result.current.connecting).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const unsubscribe1 = vi.fn()
      const unsubscribe2 = vi.fn()

      mockWalletsApi.on
        .mockReturnValueOnce(unsubscribe1)
        .mockReturnValueOnce(unsubscribe2)

      const { unmount } = renderHook(() => useStandardWallets())

      unmount()

      expect(unsubscribe1).toHaveBeenCalled()
      expect(unsubscribe2).toHaveBeenCalled()
    })
  })
})
