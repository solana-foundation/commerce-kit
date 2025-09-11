import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHttpTransport } from '../../transports/http'
import { getClusterInfo } from '../../utils/cluster'
import type { Transport } from '../../transports/types'

// Mock fetch for controlled RPC responses
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock RPC response helper
const createRpcResponse = (result: any) => ({
  json: () => Promise.resolve({
    jsonrpc: '2.0',
    id: 1,
    result,
  }),
  ok: true,
  status: 200,
})

const createRpcError = (code: number, message: string) => ({
  json: () => Promise.resolve({
    jsonrpc: '2.0',
    id: 1,
    error: { code, message },
  }),
  ok: false,
  status: 400,
})

describe('RPC Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('HTTP Transport', () => {
    it('should create HTTP transport with correct configuration', () => {
      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      expect(transport).toBeDefined()
      expect(transport.request).toBeDefined()
    })

    it('should make successful RPC requests', async () => {
      const mockResult = { lamports: 1000000000, executable: false, owner: '11111111111111111111111111111111' }
      mockFetch.mockResolvedValueOnce(createRpcResponse(mockResult))

      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      const result = await transport.request('getAccountInfo', ['So11111111111111111111111111111111111111112'])
      
      expect(result).toEqual(mockResult)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.devnet.solana.com',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"getAccountInfo"'),
        })
      )
    })

    it('should handle RPC errors properly', async () => {
      mockFetch.mockResolvedValueOnce(createRpcError(-32602, 'Invalid params'))

      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      await expect(
        transport.request('getAccountInfo', ['invalid-address'])
      ).rejects.toThrow('Invalid params')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      await expect(
        transport.request('getAccountInfo', ['So11111111111111111111111111111111111111112'])
      ).rejects.toThrow('Network error')
    })

    it('should timeout requests appropriately', async () => {
      // Mock a request that never resolves
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      const transport = createHttpTransport('https://api.devnet.solana.com', {
        timeout: 100, // 100ms timeout
      })
      
      await expect(
        transport.request('getAccountInfo', ['So11111111111111111111111111111111111111112'])
      ).rejects.toThrow('Request timeout')
    })
  })

  describe('Cluster Information', () => {
    it('should get correct devnet cluster info', () => {
      const clusterInfo = getClusterInfo('devnet')
      
      expect(clusterInfo).toEqual({
        name: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        websocketUrl: 'wss://api.devnet.solana.com',
        canAirdrop: true,
      })
    })

    it('should get correct mainnet cluster info', () => {
      const clusterInfo = getClusterInfo('mainnet')
      
      expect(clusterInfo).toEqual({
        name: 'mainnet',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        websocketUrl: 'wss://api.mainnet-beta.solana.com',
        canAirdrop: false,
      })
    })

    it('should get correct testnet cluster info', () => {
      const clusterInfo = getClusterInfo('testnet')
      
      expect(clusterInfo).toEqual({
        name: 'testnet',
        rpcUrl: 'https://api.testnet.solana.com',
        websocketUrl: 'wss://api.testnet.solana.com',
        canAirdrop: true,
      })
    })

    it('should handle custom RPC URLs', () => {
      const customUrl = 'https://custom-rpc.example.com'
      const clusterInfo = getClusterInfo(customUrl)
      
      expect(clusterInfo).toEqual({
        name: 'custom',
        rpcUrl: customUrl,
        websocketUrl: customUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
        canAirdrop: false,
      })
    })
  })

  describe('RPC Method Integration', () => {
    it('should handle getBalance requests', async () => {
      const mockBalance = { value: 1000000000 } // 1 SOL in lamports
      mockFetch.mockResolvedValueOnce(createRpcResponse(mockBalance))

      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      const result = await transport.request('getBalance', ['So11111111111111111111111111111111111111112'])
      
      expect(result).toEqual(mockBalance)
    })

    it('should handle getRecentBlockhash requests', async () => {
      const mockBlockhash = {
        value: {
          blockhash: 'mock-blockhash-123',
          feeCalculator: {
            lamportsPerSignature: 5000,
          },
        },
      }
      mockFetch.mockResolvedValueOnce(createRpcResponse(mockBlockhash))

      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      const result = await transport.request('getRecentBlockhash')
      
      expect(result).toEqual(mockBlockhash)
    })

    it('should handle sendTransaction requests', async () => {
      const mockSignature = 'mock-transaction-signature-123456789'
      mockFetch.mockResolvedValueOnce(createRpcResponse(mockSignature))

      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      const result = await transport.request('sendTransaction', ['mock-serialized-transaction'])
      
      expect(result).toBe(mockSignature)
    })

    it('should handle confirmTransaction requests', async () => {
      const mockConfirmation = {
        value: {
          confirmations: null,
          status: { Ok: null },
        },
      }
      mockFetch.mockResolvedValueOnce(createRpcResponse(mockConfirmation))

      const transport = createHttpTransport('https://api.devnet.solana.com')
      
      const result = await transport.request('confirmTransaction', ['mock-signature'])
      
      expect(result).toEqual(mockConfirmation)
    })
  })

  describe('Transport Configuration', () => {
    it('should handle custom headers', async () => {
      const customHeaders = {
        'X-API-Key': 'test-api-key',
        'Authorization': 'Bearer token',
      }
      
      mockFetch.mockResolvedValueOnce(createRpcResponse({}))

      const transport = createHttpTransport('https://api.custom.solana.com', {
        headers: customHeaders,
      })
      
      await transport.request('getBalance', ['So11111111111111111111111111111111111111112'])
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.custom.solana.com',
        expect.objectContaining({
          headers: expect.objectContaining(customHeaders),
        })
      )
    })

    it('should handle retry logic', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createRpcResponse({ value: 1000000000 }))

      const transport = createHttpTransport('https://api.devnet.solana.com', {
        retries: 1,
      })
      
      const result = await transport.request('getBalance', ['So11111111111111111111111111111111111111112'])
      
      expect(result).toEqual({ value: 1000000000 })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const transport = createHttpTransport('https://api.devnet.solana.com', {
        retries: 2,
      })
      
      await expect(
        transport.request('getBalance', ['So11111111111111111111111111111111111111112'])
      ).rejects.toThrow('Network error')
      
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })
})
