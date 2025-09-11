import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTransactionBuilder, createTransactionContext } from '../transaction-builder'
import type { Address, TransactionSigner } from '@solana/kit'

// Mock the Solana Kit modules
vi.mock('@solana/kit', async () => {
  const actual = await vi.importActual('@solana/kit')
  return {
    ...actual,
    address: vi.fn((addr: string) => addr as Address),
    lamports: vi.fn((amount: bigint) => amount),
    getAddressEncoder: vi.fn(() => ({
      encode: vi.fn((addr: string) => new Uint8Array(32)),
    })),
  }
})

// Mock transport
const createMockTransport = () => ({
  request: vi.fn(),
})

// Mock signer
const createMockSigner = (): TransactionSigner => ({
  address: 'So11111111111111111111111111111111111111112' as Address,
  signTransaction: vi.fn(),
  signMessage: vi.fn(),
})

describe('Transaction Builder', () => {
  let mockTransport: ReturnType<typeof createMockTransport>
  let mockSigner: TransactionSigner
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransport = createMockTransport()
    mockSigner = createMockSigner()
  })

  describe('createTransactionContext', () => {
    it('should create transaction context with correct parameters', () => {
      const context = createTransactionContext(
        'https://api.devnet.solana.com',
        'confirmed',
        true
      )
      
      expect(context).toBeDefined()
      expect(context.rpcUrl).toBe('https://api.devnet.solana.com')
      expect(context.commitment).toBe('confirmed')
      expect(context.skipPreflight).toBe(true)
    })

    it('should handle optional parameters', () => {
      const context = createTransactionContext('https://api.devnet.solana.com')
      
      expect(context.rpcUrl).toBe('https://api.devnet.solana.com')
      expect(context.commitment).toBe('processed') // default
      expect(context.skipPreflight).toBe(false) // default
    })
  })

  describe('Transaction Builder', () => {
    it('should create transaction builder instance', () => {
      const context = createTransactionContext('https://api.devnet.solana.com')
      const builder = createTransactionBuilder(context)
      
      expect(builder).toBeDefined()
      expect(builder.transferSOL).toBeDefined()
      expect(builder.transferToken).toBeDefined()
    })

    describe('SOL Transfer', () => {
      it('should build SOL transfer transaction', async () => {
        // Mock successful responses
        mockTransport.request
          .mockResolvedValueOnce({ // getRecentBlockhash
            value: {
              blockhash: 'mock-blockhash-123',
              feeCalculator: { lamportsPerSignature: 5000 },
            },
          })
          .mockResolvedValueOnce('mock-signature-123') // sendTransaction
          .mockResolvedValueOnce({ // confirmTransaction
            value: {
              confirmations: null,
              status: { Ok: null },
            },
          })

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        const result = await builder.transferSOL(
          'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS' as Address,
          1000000000n, // 1 SOL
          mockSigner
        )

        expect(result).toEqual({
          signature: 'mock-signature-123',
          amount: 1000000000n,
          from: mockSigner.address,
          to: 'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
          blockTime: expect.any(Number),
          slot: expect.any(Number),
        })

        expect(mockTransport.request).toHaveBeenCalledWith('getRecentBlockhash')
        expect(mockTransport.request).toHaveBeenCalledWith('sendTransaction', expect.any(Array))
      })

      it('should handle SOL transfer errors', async () => {
        mockTransport.request.mockRejectedValueOnce(new Error('Insufficient funds'))

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        await expect(
          builder.transferSOL(
            'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS' as Address,
            1000000000n,
            mockSigner
          )
        ).rejects.toThrow('Insufficient funds')
      })

      it('should validate minimum SOL amount', async () => {
        const context = createTransactionContext('https://api.devnet.solana.com')
        const builder = createTransactionBuilder(context)
        
        await expect(
          builder.transferSOL(
            'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS' as Address,
            0n, // Invalid amount
            mockSigner
          )
        ).rejects.toThrow('Amount must be greater than zero')
      })

      it('should validate recipient address', async () => {
        const context = createTransactionContext('https://api.devnet.solana.com')
        const builder = createTransactionBuilder(context)
        
        await expect(
          builder.transferSOL(
            'invalid-address' as Address,
            1000000000n,
            mockSigner
          )
        ).rejects.toThrow('Invalid recipient address')
      })
    })

    describe('Token Transfer', () => {
      it('should build token transfer transaction', async () => {
        // Mock successful responses
        mockTransport.request
          .mockResolvedValueOnce({ // getRecentBlockhash
            value: {
              blockhash: 'mock-blockhash-123',
              feeCalculator: { lamportsPerSignature: 5000 },
            },
          })
          .mockResolvedValueOnce({ // getTokenAccountsByOwner - source
            value: [{
              pubkey: 'source-token-account',
              account: {
                data: {
                  parsed: {
                    info: {
                      tokenAmount: {
                        amount: '1000000',
                        decimals: 6,
                        uiAmount: 1.0,
                      },
                    },
                  },
                },
              },
            }],
          })
          .mockResolvedValueOnce({ // getTokenAccountsByOwner - destination
            value: [{
              pubkey: 'dest-token-account',
              account: {
                data: {
                  parsed: {
                    info: {
                      tokenAmount: {
                        amount: '0',
                        decimals: 6,
                        uiAmount: 0,
                      },
                    },
                  },
                },
              },
            }],
          })
          .mockResolvedValueOnce('mock-signature-456') // sendTransaction

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        const result = await builder.transferToken(
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address, // USDC mint
          'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS' as Address,
          1000000n, // 1 USDC (6 decimals)
          mockSigner
        )

        expect(result).toEqual({
          signature: 'mock-signature-456',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: 1000000n,
          from: mockSigner.address,
          to: 'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
          blockTime: expect.any(Number),
          slot: expect.any(Number),
        })
      })

      it('should handle insufficient token balance', async () => {
        mockTransport.request
          .mockResolvedValueOnce({ // getRecentBlockhash
            value: {
              blockhash: 'mock-blockhash-123',
              feeCalculator: { lamportsPerSignature: 5000 },
            },
          })
          .mockResolvedValueOnce({ // getTokenAccountsByOwner - no tokens
            value: [],
          })

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        await expect(
          builder.transferToken(
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address,
            'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS' as Address,
            1000000n,
            mockSigner
          )
        ).rejects.toThrow('No token account found')
      })
    })

    describe('Transaction Confirmation', () => {
      it('should confirm transaction with retries', async () => {
        // First confirmation attempt fails, second succeeds
        mockTransport.request
          .mockResolvedValueOnce({ // First confirmTransaction - not confirmed
            value: null,
          })
          .mockResolvedValueOnce({ // Second confirmTransaction - confirmed
            value: {
              confirmations: null,
              status: { Ok: null },
            },
          })

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        const result = await builder.confirmTransaction('mock-signature')
        
        expect(result).toEqual({
          confirmations: null,
          status: { Ok: null },
        })
        
        expect(mockTransport.request).toHaveBeenCalledTimes(2)
      })

      it('should timeout confirmation after max retries', async () => {
        // All confirmation attempts return null
        mockTransport.request.mockResolvedValue({ value: null })

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        context.confirmationTimeout = 1000 // 1 second
        
        const builder = createTransactionBuilder(context)
        
        await expect(
          builder.confirmTransaction('mock-signature')
        ).rejects.toThrow('Transaction confirmation timeout')
      })

      it('should handle confirmation errors', async () => {
        mockTransport.request.mockResolvedValueOnce({
          value: {
            confirmations: null,
            status: { Err: 'Transaction failed' },
          },
        })

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        await expect(
          builder.confirmTransaction('mock-signature')
        ).rejects.toThrow('Transaction failed')
      })
    })

    describe('Fee Calculation', () => {
      it('should calculate transaction fees', async () => {
        mockTransport.request.mockResolvedValueOnce({
          value: {
            feeCalculator: {
              lamportsPerSignature: 5000,
            },
          },
        })

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        const fees = await builder.calculateFees(1) // 1 signature
        
        expect(fees).toBe(5000n)
      })

      it('should handle multiple signatures', async () => {
        mockTransport.request.mockResolvedValueOnce({
          value: {
            feeCalculator: {
              lamportsPerSignature: 5000,
            },
          },
        })

        const context = createTransactionContext('https://api.devnet.solana.com')
        context.transport = mockTransport
        
        const builder = createTransactionBuilder(context)
        
        const fees = await builder.calculateFees(3) // 3 signatures
        
        expect(fees).toBe(15000n) // 3 * 5000
      })
    })
  })
})
