import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from '../../hooks/use-copy-to-clipboard'

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useCopyToClipboard())

    expect(result.current.copied).toBe(false)
    expect(result.current.isHovered).toBe(false)
  })

  it('should handle hover state correctly', () => {
    const { result } = renderHook(() => useCopyToClipboard())

    act(() => {
      result.current.setIsHovered(true)
    })

    expect(result.current.isHovered).toBe(true)

    act(() => {
      result.current.setIsHovered(false)
    })

    expect(result.current.isHovered).toBe(false)
  })

  it('should copy to clipboard using navigator.clipboard', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copyToClipboard('test text')
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
    expect(result.current.copied).toBe(true)
    expect(result.current.isHovered).toBe(false)

    // Should reset after 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.copied).toBe(false)
    expect(result.current.isHovered).toBe(false)
  })

  it('should fallback to document.execCommand when clipboard API fails', async () => {
    // Mock navigator.clipboard to throw
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Clipboard not available'))

    const { result } = renderHook(() => useCopyToClipboard())

    // Mock DOM manipulation
    const mockTextArea = {
      value: '',
      select: vi.fn(),
    }
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any)
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextArea as any)
    const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextArea as any)

    await act(async () => {
      await result.current.copyToClipboard('fallback text')
    })

    expect(createElement).toHaveBeenCalledWith('textarea')
    expect(mockTextArea.value).toBe('fallback text')
    expect(mockTextArea.select).toHaveBeenCalled()
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(appendChild).toHaveBeenCalled()
    expect(removeChild).toHaveBeenCalled()
    expect(result.current.copied).toBe(true)

    // Cleanup mocks
    createElement.mockRestore()
    appendChild.mockRestore()
    removeChild.mockRestore()
  })

  it('should reset copied state after timeout', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copyToClipboard('test')
    })

    expect(result.current.copied).toBe(true)

    // Advance time by 1 second - should still be true
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.copied).toBe(true)

    // Advance time by another 1 second - should be false
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.copied).toBe(false)
  })

  it('should reset hover state when copying', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    act(() => {
      result.current.setIsHovered(true)
    })

    expect(result.current.isHovered).toBe(true)

    await act(async () => {
      await result.current.copyToClipboard('test')
    })

    expect(result.current.isHovered).toBe(false)
  })

  it('should handle empty text', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copyToClipboard('')
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('')
    expect(result.current.copied).toBe(true)
  })

  it('should handle multiple copy operations', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    // First copy
    await act(async () => {
      await result.current.copyToClipboard('first text')
    })

    expect(result.current.copied).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('first text')

    // Second copy before timeout
    await act(async () => {
      await result.current.copyToClipboard('second text')
    })

    expect(result.current.copied).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('second text')

    // Should still reset after 2 seconds from last copy
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.copied).toBe(false)
  })
})
