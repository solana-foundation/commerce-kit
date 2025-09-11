import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { useTransferSOL } from '../use-transfer-sol'
import { TestWrapper, createMockSigner, MOCK_ADDRESSES, MOCK_LAMPORTS } from '../../test-utils/mock-providers'

// Mock the core modules
vi.mock('../../core/arc-client-provider', () => ({
  useArcClient: () => ({
    wallet: {
      address: MOCK_ADDRESSES.WALLET_1,
      signer: createMockSigner(),
      connected: true,
    },
    network: {
      rpcUrl: 'https://api.devnet.solana.com',
      isDevnet: true,
    },
    config: {
      commitment: 'confirmed',
    },
  }),
}))

vi.mock('../../core/rpc-manager', () => ({
  releaseRpcConnection: vi.fn(),
}))

vi.mock('../../core/transaction-builder', () => ({
  createTransactionBuilder: vi.fn(() => ({
    transferSOL: vi.fn().mockResolvedValue({
      signature: 'mock-signature-123',
      amount: MOCK_LAMPORTS.ONE_SOL,
      from: MOCK_ADDRESSES.WALLET_1,
      to: MOCK_ADDRESSES.WALLET_2,
      blockTime: 1234567890,
      slot: 123456,
    }),
  })),
  createTransactionContext: vi.fn(),
}))

vi.mock('../../utils/invalidate', () => ({
  createInvalidator: vi.fn(() => ({
    invalidateAfterTransfer: vi.fn(),
  })),
}))

const createWrapper = (props: any = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <TestWrapper queryClient={queryClient} {...props}>
      {children}
    </TestWrapper>
  )
}

describe('useTransferSOL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useTransferSOL(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toBe(null)
    expect(result.current.toInput).toBe('')
    expect(result.current.amountInput).toBe('')
  })

  it('should initialize with provided input values', () => {
    const { result } = renderHook(() => useTransferSOL('test-address', '1.5'), {
      wrapper: createWrapper(),
    })

    expect(result.current.toInput).toBe('test-address')
    expect(result.current.amountInput).toBe('1.5')
  })

  it('should update input states', () => {
    const { result } = renderHook(() => useTransferSOL(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.setToInput('new-address')
      result.current.setAmountInput('2.0')
    })

    expect(result.current.toInput).toBe('new-address')
    expect(result.current.amountInput).toBe('2.0')
  })

  it('should handle input change events', () => {
    const { result } = renderHook(() => useTransferSOL(), {
      wrapper: createWrapper(),
    })

    const toEvent = {
      target: { value: 'address-from-event' }
    } as React.ChangeEvent<HTMLInputElement>

    const amountEvent = {
      target: { value: '3.14' }
    } as React.ChangeEvent<HTMLInputElement>

    act(() => {
      result.current.handleToInputChange(toEvent)
      result.current.handleAmountInputChange(amountEvent)
    })

    expect(result.current.toInput).toBe('address-from-event')
    expect(result.current.amountInput).toBe('3.14')
  })

  describe('transferSOL function', () => {
    it('should successfully transfer SOL', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      const transferOptions = {
        to: MOCK_ADDRESSES.WALLET_2,
        amount: MOCK_LAMPORTS.ONE_SOL,
      }

      let transferResult: any

      await act(async () => {
        transferResult = await result.current.transferSOL(transferOptions)
      })

      expect(transferResult).toEqual({
        signature: 'mock-signature-123',
        amount: MOCK_LAMPORTS.ONE_SOL,
        from: MOCK_ADDRESSES.WALLET_1,
        to: MOCK_ADDRESSES.WALLET_2,
        blockTime: 1234567890,
        slot: 123456,
      })
    })

    it('should handle transfer errors', async () => {
      // Mock the transaction builder to throw an error
      const mockTransferSOL = vi.fn().mockRejectedValue(new Error('Transfer failed'))
      
      vi.doMock('../../core/transaction-builder', () => ({
        createTransactionBuilder: vi.fn(() => ({
          transferSOL: mockTransferSOL,
        })),
        createTransactionContext: vi.fn(),
      }))

      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      const transferOptions = {
        to: MOCK_ADDRESSES.WALLET_2,
        amount: MOCK_LAMPORTS.ONE_SOL,
      }

      await act(async () => {
        try {
          await result.current.transferSOL(transferOptions)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })
    })
  })

  describe('transferFromInputs function', () => {
    it('should transfer using input values', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.setToInput(MOCK_ADDRESSES.WALLET_2)
        result.current.setAmountInput('1.0')
      })

      let transferResult: any

      await act(async () => {
        transferResult = await result.current.transferFromInputs()
      })

      expect(transferResult).toBeDefined()
      expect(transferResult.amount).toBe(MOCK_LAMPORTS.ONE_SOL)
    })

    it('should throw error when inputs are missing', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        try {
          await result.current.transferFromInputs()
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect((error as Error).message).toBe('Both recipient address and amount are required')
        }
      })
    })

    it('should throw error for invalid amount format', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.setToInput(MOCK_ADDRESSES.WALLET_2)
        result.current.setAmountInput('invalid-amount')
      })

      await act(async () => {
        try {
          await result.current.transferFromInputs()
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect((error as Error).message).toBe('Invalid number format')
        }
      })
    })
  })

  describe('handleSubmit function', () => {
    it('should prevent default and transfer when inputs are valid', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      const preventDefault = vi.fn()
      const event = { preventDefault }

      act(() => {
        result.current.setToInput(MOCK_ADDRESSES.WALLET_2)
        result.current.setAmountInput('0.5')
      })

      let submitResult: any

      await act(async () => {
        submitResult = await result.current.handleSubmit(event)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(submitResult).toBeDefined()
      expect(submitResult.amount).toBe(MOCK_LAMPORTS.HALF_SOL)
    })

    it('should return undefined when inputs are missing', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      let submitResult: any

      await act(async () => {
        submitResult = await result.current.handleSubmit()
      })

      expect(submitResult).toBeUndefined()
    })

    it('should work without preventDefault method', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.setToInput(MOCK_ADDRESSES.WALLET_2)
        result.current.setAmountInput('0.1')
      })

      let submitResult: any

      await act(async () => {
        submitResult = await result.current.handleSubmit({})
      })

      expect(submitResult).toBeDefined()
      expect(submitResult.amount).toBe(MOCK_LAMPORTS.POINT_ONE_SOL)
    })
  })

  describe('reset function', () => {
    it('should reset the mutation state', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      // First trigger a transfer
      await act(async () => {
        await result.current.transferSOL({
          to: MOCK_ADDRESSES.WALLET_2,
          amount: MOCK_LAMPORTS.ONE_SOL,
        })
      })

      expect(result.current.data).not.toBe(null)

      // Then reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)
    })
  })

  describe('loading states', () => {
    it('should show loading state during transfer', async () => {
      const { result } = renderHook(() => useTransferSOL(), {
        wrapper: createWrapper(),
      })

      const transferPromise = act(async () => {
        result.current.transferSOL({
          to: MOCK_ADDRESSES.WALLET_2,
          amount: MOCK_LAMPORTS.ONE_SOL,
        })
      })

      // During the transfer, loading should be true
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await transferPromise

      // After completion, loading should be false
      expect(result.current.isLoading).toBe(false)
    })
  })
})
