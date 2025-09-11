import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../../hooks/use-timer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useTimer({ duration: 60 }))

    expect(result.current.timeRemaining).toBe(60)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('should auto-start when autoStart is true', () => {
    const { result } = renderHook(() => useTimer({ duration: 60, autoStart: true }))

    expect(result.current.isRunning).toBe(true)
  })

  it('should start and stop timer correctly', () => {
    const { result } = renderHook(() => useTimer({ duration: 60 }))

    act(() => {
      result.current.start()
    })

    expect(result.current.isRunning).toBe(true)

    act(() => {
      result.current.pause()
    })

    expect(result.current.isRunning).toBe(false)
  })

  it('should count down correctly', () => {
    const { result } = renderHook(() => useTimer({ duration: 60 }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.timeRemaining).toBe(59)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.timeRemaining).toBe(54)
  })

  it('should call onTick callback with remaining time', () => {
    const onTick = vi.fn()
    const { result } = renderHook(() => useTimer({ duration: 10, onTick }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onTick).toHaveBeenCalledWith(9)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onTick).toHaveBeenCalledWith(8)
  })

  it('should call onComplete callback when timer reaches zero', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTimer({ duration: 3, onComplete }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(result.current.isComplete).toBe(true)
    expect(result.current.isRunning).toBe(false)
  })

  it('should reset timer to initial duration', () => {
    const { result } = renderHook(() => useTimer({ duration: 60 }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.timeRemaining).toBe(50)

    act(() => {
      result.current.reset()
    })

    expect(result.current.timeRemaining).toBe(60)
    expect(result.current.isRunning).toBe(false)
  })

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() => useTimer({ duration: 100 }))

    expect(result.current.progress).toBe(0)

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(25000)
    })

    expect(result.current.progress).toBe(0.25)

    act(() => {
      vi.advanceTimersByTime(50000)
    })

    expect(result.current.progress).toBe(0.75)
  })

  it('should format time correctly', () => {
    const { result } = renderHook(() => useTimer({ duration: 125 }))

    expect(result.current.formatTime()).toBe('2:05')
    expect(result.current.formatTime(60)).toBe('1:00')
    expect(result.current.formatTime(30)).toBe('0:30')
    expect(result.current.formatTime(0)).toBe('0:00')
  })

  it('should stop timer when component unmounts', () => {
    const { result, unmount } = renderHook(() => useTimer({ duration: 60 }))

    act(() => {
      result.current.start()
    })

    expect(result.current.isRunning).toBe(true)

    unmount()

    // Timer should be cleaned up, no errors should occur
    expect(() => {
      vi.advanceTimersByTime(1000)
    }).not.toThrow()
  })

  it('should handle stop correctly', () => {
    const { result } = renderHook(() => useTimer({ duration: 60 }))

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.timeRemaining).toBe(55)
    expect(result.current.isRunning).toBe(true)

    act(() => {
      result.current.stop()
    })

    expect(result.current.isRunning).toBe(false)

    // Time should not continue after stop
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.timeRemaining).toBe(55)
  })
})
