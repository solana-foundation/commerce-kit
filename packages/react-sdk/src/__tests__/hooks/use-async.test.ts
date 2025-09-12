import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAsync } from '../../hooks/use-async'

// Mock async functions for testing
const mockAsyncSuccess = vi.fn(() => Promise.resolve('success'))
const mockAsyncError = vi.fn(() => Promise.reject(new Error('test error')))
const mockAsyncDelay = vi.fn(() => new Promise(resolve => setTimeout(() => resolve('delayed'), 100)))

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAsync())

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)
      expect(result.current.loading).toBe(false)
    })

    it('should execute immediately when immediate is true', async () => {
      const { result } = renderHook(() => useAsync(mockAsyncSuccess, true))

      expect(result.current.loading).toBe(true)

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(mockAsyncSuccess).toHaveBeenCalledTimes(1)
      expect(result.current.data).toBe('success')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should not execute immediately when immediate is false', () => {
      renderHook(() => useAsync(mockAsyncSuccess, false))

      expect(mockAsyncSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Execute function', () => {
    it('should execute async function successfully', async () => {
      const { result } = renderHook(() => useAsync(mockAsyncSuccess))

      let executeResult: any
      await act(async () => {
        executeResult = await result.current.execute()
      })

      expect(mockAsyncSuccess).toHaveBeenCalledTimes(1)
      expect(result.current.data).toBe('success')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(executeResult).toBe('success')
    })

    it('should handle async function errors', async () => {
      const { result } = renderHook(() => useAsync(mockAsyncError))

      let executeResult: any
      await act(async () => {
        executeResult = await result.current.execute()
      })

      expect(mockAsyncError).toHaveBeenCalledTimes(1)
      expect(result.current.data).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('test error')
      expect(executeResult).toBe(null)
    })

    it('should pass arguments to async function', async () => {
      const mockAsyncWithArgs = vi.fn((...args) => Promise.resolve(args))
      const { result } = renderHook(() => useAsync(mockAsyncWithArgs))

      await act(async () => {
        await result.current.execute(undefined, 'arg1', 'arg2', 123)
      })

      expect(mockAsyncWithArgs).toHaveBeenCalledWith('arg1', 'arg2', 123)
      expect(result.current.data).toEqual(['arg1', 'arg2', 123])
    })

    it('should return null when no async function is provided', async () => {
      const { result } = renderHook(() => useAsync())

      let executeResult: any
      await act(async () => {
        executeResult = await result.current.execute()
      })

      expect(executeResult).toBe(null)
      expect(result.current.data).toBe(null)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Loading states', () => {
    it('should set loading to true during execution', async () => {
      const { result } = renderHook(() => useAsync(mockAsyncDelay))

      act(() => {
        result.current.execute()
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBe('delayed')
    })

    it('should clear error when starting new execution', async () => {
      const { result } = renderHook(() => useAsync())

      // First, execute a function that fails
      await act(async () => {
        await result.current.execute(mockAsyncError)
      })

      expect(result.current.error).toBeInstanceOf(Error)

      // Then execute a successful function
      await act(async () => {
        await result.current.execute(mockAsyncSuccess)
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)

      await act(async () => {
        await vi.runAllTimersAsync()
      })
    })
  })

  describe('Race condition prevention', () => {
    it('should prevent race conditions by ignoring outdated results', async () => {
      let resolveFirst: (value: string) => void
      let resolveSecond: (value: string) => void

      const firstPromise = new Promise<string>(resolve => {
        resolveFirst = resolve
      })
      const secondPromise = new Promise<string>(resolve => {
        resolveSecond = resolve
      })

      const mockFirstAsync = vi.fn(() => firstPromise)
      const mockSecondAsync = vi.fn(() => secondPromise)

      const { result } = renderHook(() => useAsync())

      // Start first execution
      act(() => {
        result.current.execute(mockFirstAsync)
      })

      // Start second execution before first completes
      act(() => {
        result.current.execute(mockSecondAsync)
      })

      // Resolve first promise after second
      await act(async () => {
        resolveFirst!('first result')
        await vi.runAllTimersAsync()
      })

      // Resolve second promise
      await act(async () => {
        resolveSecond!('second result')
        await vi.runAllTimersAsync()
      })

      // Should only have the second result due to race condition prevention
      expect(result.current.data).toBe('second result')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Reset function', () => {
    it('should reset to initial state', async () => {
      const { result } = renderHook(() => useAsync(mockAsyncSuccess))

      // Execute and get data
      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.data).toBe('success')

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)
      expect(result.current.loading).toBe(false)
    })

    it('should cancel pending operations when reset', async () => {
      const { result } = renderHook(() => useAsync(mockAsyncDelay))

      // Start execution
      act(() => {
        result.current.execute()
      })

      expect(result.current.loading).toBe(true)

      // Reset before completion
      act(() => {
        result.current.reset()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBe(null)

      // Complete the original promise
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // State should remain reset (not updated by completed promise)
      expect(result.current.data).toBe(null)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should convert non-Error objects to Error instances', async () => {
      const mockAsyncStringError = vi.fn(() => Promise.reject('string error'))
      const { result } = renderHook(() => useAsync(mockAsyncStringError))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('string error')
    })

    it('should handle null/undefined errors', async () => {
      const mockAsyncNullError = vi.fn(() => Promise.reject(null))
      const { result } = renderHook(() => useAsync(mockAsyncNullError))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('null')
    })
  })

  describe('Multiple executions', () => {
    it('should handle multiple sequential executions', async () => {
      const { result } = renderHook(() => useAsync())

      // First execution
      await act(async () => {
        await result.current.execute(mockAsyncSuccess)
      })

      expect(result.current.data).toBe('success')

      // Second execution with different function
      const mockAsyncSecond = vi.fn(() => Promise.resolve('second'))
      await act(async () => {
        await result.current.execute(mockAsyncSecond)
      })

      expect(result.current.data).toBe('second')
      expect(mockAsyncSuccess).toHaveBeenCalledTimes(1)
      expect(mockAsyncSecond).toHaveBeenCalledTimes(1)
    })
  })
})
