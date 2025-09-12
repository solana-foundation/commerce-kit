import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTipForm } from '../../hooks/use-tip-form'
import type { SolanaCommerceConfig, Currency, PaymentMethod } from '../../types'

// Mock the constants and utils
vi.mock('../../constants/tip-modal', () => ({
  ALL_CURRENCIES: [
    { value: 'USDC', label: 'USD Coin', symbol: 'USDC' },
    { value: 'SOL', label: 'Solana', symbol: 'SOL' },
    { value: 'USDT', label: 'Tether USD', symbol: 'USDT' },
  ],
}))

vi.mock('../../utils', () => ({
  convertUsdToLamports: vi.fn(),
  getDecimals: vi.fn(),
}))

// Import the mocked functions
import * as tipConstants from '../../constants/tip-modal'
import * as utils from '../../utils'

describe('useTipForm', () => {
  const baseConfig: SolanaCommerceConfig = {
    mode: 'tip',
    merchant: {
      name: 'Test Merchant',
      wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    },
    allowedMints: ['USDC', 'SOL', 'USDT'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(utils.convertUsdToLamports).mockResolvedValue(1000000000) // 1 SOL in lamports
    vi.mocked(utils.getDecimals).mockReturnValue(6) // USDC decimals
  })

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      expect(result.current.state).toEqual({
        selectedAmount: 5,
        selectedCurrency: 'USDC', // First in allowedMints
        selectedPaymentMethod: 'qr',
        customAmount: '',
        showCustomInput: false,
        isProcessing: false,
        currentStep: 'form',
        currencyDropdownOpen: false,
        priceError: null,
      })
    })

    it('should initialize with first allowed mint as currency', () => {
      const configWithSolFirst = {
        ...baseConfig,
        allowedMints: ['SOL', 'USDC', 'USDT'],
      }

      const { result } = renderHook(() => useTipForm(configWithSolFirst))

      expect(result.current.state.selectedCurrency).toBe('SOL')
    })

    it('should handle empty allowedMints gracefully', () => {
      const configWithoutMints = {
        ...baseConfig,
        allowedMints: undefined,
      }

      const { result } = renderHook(() => useTipForm(configWithoutMints))

      expect(result.current.availableCurrencies).toEqual([])
      expect(result.current.state.selectedCurrency).toBe('USDC') // fallback
    })
  })

  describe('Available Currencies', () => {
    it('should filter currencies based on allowedMints', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      expect(result.current.availableCurrencies).toHaveLength(3)
      expect(result.current.availableCurrencies.map(c => c.value)).toEqual([
        'USDC', 'SOL', 'USDT'
      ])
    })

    it('should update when allowedMints change', () => {
      const { result, rerender } = renderHook(
        ({ config }) => useTipForm(config),
        { initialProps: { config: baseConfig } }
      )

      expect(result.current.availableCurrencies).toHaveLength(3)

      // Change config
      const newConfig = {
        ...baseConfig,
        allowedMints: ['USDC'],
      }
      rerender({ config: newConfig })

      expect(result.current.availableCurrencies).toHaveLength(1)
      expect(result.current.availableCurrencies[0].value).toBe('USDC')
    })
  })

  describe('State Actions', () => {
    it('should set amount and hide custom input', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.toggleCustomInput(true)
      })
      expect(result.current.state.showCustomInput).toBe(true)

      act(() => {
        result.current.actions.setAmount(10)
      })

      expect(result.current.state.selectedAmount).toBe(10)
      expect(result.current.state.showCustomInput).toBe(false)
    })

    it('should set currency', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setCurrency('SOL')
      })

      expect(result.current.state.selectedCurrency).toBe('SOL')
    })

    it('should set payment method', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setPaymentMethod('wallet')
      })

      expect(result.current.state.selectedPaymentMethod).toBe('wallet')
    })

    it('should set custom amount', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setCustomAmount('15.50')
      })

      expect(result.current.state.customAmount).toBe('15.50')
    })

    it('should toggle custom input', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.toggleCustomInput(true)
      })
      expect(result.current.state.showCustomInput).toBe(true)

      act(() => {
        result.current.actions.toggleCustomInput(false)
      })
      expect(result.current.state.showCustomInput).toBe(false)
    })

    it('should set processing state', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setProcessing(true)
      })
      expect(result.current.state.isProcessing).toBe(true)
    })

    it('should set current step', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setStep('payment')
      })
      expect(result.current.state.currentStep).toBe('payment')
    })

    it('should set currency dropdown state', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setCurrencyDropdown(true)
      })
      expect(result.current.state.currencyDropdownOpen).toBe(true)
    })

    it('should set price error', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setPriceError('Price fetch failed')
      })
      expect(result.current.state.priceError).toBe('Price fetch failed')
    })

    it('should reset to form', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      // Set some state
      act(() => {
        result.current.actions.setStep('payment')
        result.current.actions.setProcessing(true)
        result.current.actions.setPriceError('Some error')
      })

      // Reset
      act(() => {
        result.current.actions.resetToForm()
      })

      expect(result.current.state.currentStep).toBe('form')
      expect(result.current.state.isProcessing).toBe(false)
      expect(result.current.state.priceError).toBe(null)
    })
  })

  describe('Computed Values', () => {
    it('should calculate final amount from preset', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setAmount(10)
      })

      expect(result.current.computed.finalAmount).toBe(10)
    })

    it('should calculate final amount from custom input', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.toggleCustomInput(true)
        result.current.actions.setCustomAmount('25.75')
      })

      expect(result.current.computed.finalAmount).toBe(25.75)
    })

    it('should handle invalid custom amount', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.toggleCustomInput(true)
        result.current.actions.setCustomAmount('invalid')
      })

      expect(result.current.computed.finalAmount).toBe(0)
    })

    it('should validate form correctly', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      // Preset amount is always valid
      expect(result.current.computed.isFormValid).toBe(true)

      // Custom input with valid amount
      act(() => {
        result.current.actions.toggleCustomInput(true)
        result.current.actions.setCustomAmount('15')
      })
      expect(result.current.computed.isFormValid).toBe(true)

      // Custom input with invalid amount
      act(() => {
        result.current.actions.setCustomAmount('')
      })
      expect(result.current.computed.isFormValid).toBe(false)

      // Custom input with zero
      act(() => {
        result.current.actions.setCustomAmount('0')
      })
      expect(result.current.computed.isFormValid).toBe(false)
    })

    it('should find selected currency info', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      expect(result.current.computed.selectedCurrencyInfo).toEqual({
        value: 'USDC',
        label: 'USD Coin',
        symbol: 'USDC'
      })

      act(() => {
        result.current.actions.setCurrency('SOL')
      })

      expect(result.current.computed.selectedCurrencyInfo).toEqual({
        value: 'SOL',
        label: 'Solana',
        symbol: 'SOL'
      })
    })
  })

  describe('Handlers', () => {
    it('should handle submit', async () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      await act(async () => {
        await result.current.handlers.handleSubmit()
      })

      expect(result.current.state.isProcessing).toBe(true)
      expect(result.current.state.currentStep).toBe('payment')
    })

    it('should handle back', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      // Set to payment step first
      act(() => {
        result.current.actions.setStep('payment')
        result.current.actions.setProcessing(true)
      })

      act(() => {
        result.current.handlers.handleBack()
      })

      expect(result.current.state.currentStep).toBe('form')
      expect(result.current.state.isProcessing).toBe(false)
    })

    describe('Payment Complete Handler', () => {
      it('should handle SOL payment completion', async () => {
        const mockOnPayment = vi.fn()
        const { result } = renderHook(() => useTipForm(baseConfig))

        // Set SOL currency and amount
        act(() => {
          result.current.actions.setCurrency('SOL')
          result.current.actions.setAmount(10)
        })

        vi.mocked(utils.convertUsdToLamports).mockResolvedValue(500000000) // 0.5 SOL in lamports

        const paymentHandler = result.current.handlers.handlePaymentComplete(mockOnPayment)

        await act(async () => {
          await paymentHandler()
        })

        expect(vi.mocked(utils.convertUsdToLamports)).toHaveBeenCalledWith(10)
        expect(mockOnPayment).toHaveBeenCalledWith(500000000, 'SOL', 'qr')
      })

      it('should handle stablecoin payment completion', async () => {
        const mockOnPayment = vi.fn()
        const { result } = renderHook(() => useTipForm(baseConfig))

        // Set USDC currency and amount
        act(() => {
          result.current.actions.setCurrency('USDC')
          result.current.actions.setAmount(15)
        })

        vi.mocked(utils.getDecimals).mockReturnValue(6)

        const paymentHandler = result.current.handlers.handlePaymentComplete(mockOnPayment)

        await act(async () => {
          await paymentHandler()
        })

        expect(vi.mocked(utils.getDecimals)).toHaveBeenCalledWith('USDC')
        expect(mockOnPayment).toHaveBeenCalledWith(15000000, 'USDC', 'qr') // 15 * 10^6
      })

      it('should handle custom amount', async () => {
        const mockOnPayment = vi.fn()
        const { result } = renderHook(() => useTipForm(baseConfig))

        // Set custom amount
        act(() => {
          result.current.actions.toggleCustomInput(true)
          result.current.actions.setCustomAmount('7.5')
          result.current.actions.setCurrency('USDC')
        })

        vi.mocked(utils.getDecimals).mockReturnValue(6)

        const paymentHandler = result.current.handlers.handlePaymentComplete(mockOnPayment)

        await act(async () => {
          await paymentHandler()
        })

        expect(mockOnPayment).toHaveBeenCalledWith(7500000, 'USDC', 'qr') // 7.5 * 10^6
      })

      it('should handle invalid amounts gracefully', async () => {
        const mockOnPayment = vi.fn()
        const { result } = renderHook(() => useTipForm(baseConfig))

        // Set invalid amount
        act(() => {
          result.current.actions.toggleCustomInput(true)
          result.current.actions.setCustomAmount('0')
        })

        const paymentHandler = result.current.handlers.handlePaymentComplete(mockOnPayment)

        await act(async () => {
          await paymentHandler()
        })

        // Should not call onPayment with invalid amount
        expect(mockOnPayment).not.toHaveBeenCalled()
      })

      it('should handle SOL price API errors', async () => {
        const mockOnPayment = vi.fn()
        const { result } = renderHook(() => useTipForm(baseConfig))

        // Set SOL currency
        act(() => {
          result.current.actions.setCurrency('SOL')
          result.current.actions.setAmount(10)
        })

        // Mock price API error
        vi.mocked(utils.convertUsdToLamports).mockRejectedValue(new Error('SOL price fetch failed'))

        const paymentHandler = result.current.handlers.handlePaymentComplete(mockOnPayment)

        await act(async () => {
          await paymentHandler()
        })

        expect(result.current.state.priceError).toBe('SOL price fetch failed')
        expect(result.current.state.isProcessing).toBe(false)
        expect(result.current.state.currentStep).toBe('form')
        expect(mockOnPayment).not.toHaveBeenCalled()
      })

      it('should handle non-price errors differently', async () => {
        const mockOnPayment = vi.fn()
        const { result } = renderHook(() => useTipForm(baseConfig))

        // Set USDC currency
        act(() => {
          result.current.actions.setCurrency('USDC')
          result.current.actions.setAmount(10)
        })

        // Mock different error
        vi.mocked(utils.getDecimals).mockImplementation(() => {
          throw new Error('Generic error')
        })

        const paymentHandler = result.current.handlers.handlePaymentComplete(mockOnPayment)

        await act(async () => {
          await paymentHandler()
        })

        // Should not set price error for non-price errors
        expect(result.current.state.priceError).toBe(null)
        expect(mockOnPayment).not.toHaveBeenCalled()
      })

      it('should handle wallet payment method', async () => {
        const mockOnPayment = vi.fn()
        const { result } = renderHook(() => useTipForm(baseConfig))

        act(() => {
          result.current.actions.setPaymentMethod('wallet')
          result.current.actions.setAmount(5)
        })

        const paymentHandler = result.current.handlers.handlePaymentComplete(mockOnPayment)

        await act(async () => {
          await paymentHandler()
        })

        expect(mockOnPayment).toHaveBeenCalledWith(
          expect.any(Number),
          'USDC',
          'wallet' // wallet payment method
        )
      })
    })
  })

  describe('Action Memoization', () => {
    it('should maintain stable action references', () => {
      const { result, rerender } = renderHook(() => useTipForm(baseConfig))

      const initialActions = result.current.actions

      // Re-render
      rerender()

      // Actions should be the same references
      expect(result.current.actions).toBe(initialActions)
      expect(result.current.actions.setAmount).toBe(initialActions.setAmount)
      expect(result.current.actions.setCurrency).toBe(initialActions.setCurrency)
    })

    it('should maintain stable computed references when state unchanged', () => {
      const { result, rerender } = renderHook(() => useTipForm(baseConfig))

      const initialComputed = result.current.computed

      // Re-render without changing state
      rerender()

      expect(result.current.computed.finalAmount).toBe(initialComputed.finalAmount)
      expect(result.current.computed.isFormValid).toBe(initialComputed.isFormValid)
    })

    it('should update computed values when state changes', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      const initialFinalAmount = result.current.computed.finalAmount

      act(() => {
        result.current.actions.setAmount(20)
      })

      expect(result.current.computed.finalAmount).not.toBe(initialFinalAmount)
      expect(result.current.computed.finalAmount).toBe(20)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.setAmount(10)
        result.current.actions.setCurrency('SOL')
        result.current.actions.setPaymentMethod('wallet')
        result.current.actions.toggleCustomInput(true)
        result.current.actions.setCustomAmount('25')
        result.current.actions.setStep('payment')
        result.current.actions.setProcessing(true)
      })

      expect(result.current.state).toEqual({
        selectedAmount: 10,
        selectedCurrency: 'SOL',
        selectedPaymentMethod: 'wallet',
        customAmount: '25',
        showCustomInput: true,
        isProcessing: true,
        currentStep: 'payment',
        currencyDropdownOpen: false,
        priceError: null,
      })

      expect(result.current.computed.finalAmount).toBe(25) // from custom input
    })

    it('should handle decimal amounts correctly', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.toggleCustomInput(true)
        result.current.actions.setCustomAmount('15.99')
      })

      expect(result.current.computed.finalAmount).toBe(15.99)
      expect(result.current.computed.isFormValid).toBe(true)
    })

    it('should handle zero amounts', () => {
      const { result } = renderHook(() => useTipForm(baseConfig))

      act(() => {
        result.current.actions.toggleCustomInput(true)
        result.current.actions.setCustomAmount('0')
      })

      expect(result.current.computed.finalAmount).toBe(0)
      expect(result.current.computed.isFormValid).toBe(false)
    })

    it('should handle missing currency info gracefully', () => {
      const configWithInvalidCurrency = {
        ...baseConfig,
        allowedMints: ['INVALID_CURRENCY' as Currency],
      }

      const { result } = renderHook(() => useTipForm(configWithInvalidCurrency))

      expect(result.current.computed.selectedCurrencyInfo).toBeUndefined()
    })
  })
})
