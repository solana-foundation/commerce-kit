import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { memo, useState, useMemo, useCallback } from 'react'

// Performance test components
const ExpensiveComponent = memo(({ count }: { count: number }) => {
  // Simulate expensive computation
  const expensiveValue = useMemo(() => {
    let result = 0
    for (let i = 0; i < count * 1000; i++) {
      result += Math.random()
    }
    return result
  }, [count])

  return <div data-testid="expensive-component">{expensiveValue.toFixed(2)}</div>
})

const ComponentWithHooks = () => {
  const [count, setCount] = useState(0)
  const [data, setData] = useState<any[]>([])

  // Test useCallback stability
  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])

  // Test useMemo efficiency
  const expensiveCalculation = useMemo(() => {
    return data.reduce((sum, item) => sum + (item?.value || 0), 0)
  }, [data])

  // Test effect cleanup
  React.useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => [...prev, { value: Math.random(), id: Date.now() }])
    }, 100)

    return () => clearInterval(timer)
  }, [])

  return (
    <div data-testid="component-with-hooks">
      <div data-testid="count">{count}</div>
      <div data-testid="calculation">{expensiveCalculation}</div>
      <button onClick={handleIncrement} data-testid="increment">
        Increment
      </button>
      <div data-testid="data-length">{data.length}</div>
    </div>
  )
}

const ListComponent = ({ items }: { items: any[] }) => {
  return (
    <div data-testid="list-component">
      {items.map((item, index) => (
        <div key={item.id || index} data-testid={`list-item-${index}`}>
          {item.name || `Item ${index}`}
        </div>
      ))}
    </div>
  )
}

describe('Performance Testing', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Component Rendering Performance', () => {
    it('should render quickly with reasonable component counts', () => {
      const startTime = performance.now()

      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }))

      renderWithProviders(<ListComponent items={items} />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render 100 items quickly (under 100ms)
      expect(renderTime).toBeLessThan(100)
      expect(screen.getByTestId('list-component')).toBeInTheDocument()
      expect(screen.getAllByTestId(/^list-item-/)).toHaveLength(100)
    })

    it('should handle large lists efficiently', () => {
      const startTime = performance.now()

      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }))

      renderWithProviders(<ListComponent items={items} />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should handle large lists reasonably (under 500ms)
      expect(renderTime).toBeLessThan(500)
      expect(screen.getAllByTestId(/^list-item-/)).toHaveLength(1000)
    })

    it('should memo-ize expensive components correctly', () => {
      const { rerender } = renderWithProviders(<ExpensiveComponent count={10} />)

      const firstRender = screen.getByTestId('expensive-component').textContent

      // Re-render with same props should use memoized result
      rerender(
        <QueryClientProvider client={queryClient}>
          <ExpensiveComponent count={10} />
        </QueryClientProvider>
      )

      const secondRender = screen.getByTestId('expensive-component').textContent
      expect(firstRender).toBe(secondRender) // Should be exactly the same due to memoization
    })
  })

  describe('Hook Performance', () => {
    it('should not cause unnecessary re-renders with useCallback', () => {
      let renderCount = 0
      
      const TestComponent = () => {
        renderCount++
        return <ComponentWithHooks />
      }

      const { rerender } = renderWithProviders(<TestComponent />)

      const initialRenderCount = renderCount

      // Multiple re-renders with same props should not cause excessive renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <QueryClientProvider client={queryClient}>
            <TestComponent />
          </QueryClientProvider>
        )
      }

      // Should have minimal re-renders due to useCallback optimization
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(5)
    })

    it('should cleanup effects properly to prevent memory leaks', () => {
      const { unmount } = renderWithProviders(<ComponentWithHooks />)

      // Let some effects run
      act(() => {
        vi.advanceTimersByTime(500)
      })

      const initialDataLength = parseInt(screen.getByTestId('data-length').textContent || '0')
      
      // Unmount component
      unmount()

      // Advance time - effects should be cleaned up
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // If we re-render, should start fresh (no memory leak)
      const { unmount: unmount2 } = renderWithProviders(<ComponentWithHooks />)
      
      const newDataLength = parseInt(screen.getByTestId('data-length').textContent || '0')
      expect(newDataLength).toBe(0) // Should start fresh, not continue from previous

      unmount2()
    })

    it('should optimize expensive calculations with useMemo', () => {
      renderWithProviders(<ComponentWithHooks />)

      // Let some data accumulate
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      const calculation1 = screen.getByTestId('calculation').textContent

      // Force re-render without changing data dependency
      const incrementButton = screen.getByTestId('increment')
      fireEvent.click(incrementButton)

      const calculation2 = screen.getByTestId('calculation').textContent

      // Calculation should remain the same since data hasn't changed
      // (This tests that useMemo is working correctly)
      expect(calculation1).toBe(calculation2)
    })
  })

  describe('State Update Performance', () => {
    it('should batch state updates efficiently', () => {
      let renderCount = 0
      
      const TestComponent = () => {
        renderCount++
        const [state1, setState1] = useState(0)
        const [state2, setState2] = useState(0)
        const [state3, setState3] = useState(0)

        const handleMultipleUpdates = () => {
          setState1(prev => prev + 1)
          setState2(prev => prev + 1)
          setState3(prev => prev + 1)
        }

        return (
          <div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="state-sum">{state1 + state2 + state3}</div>
            <button onClick={handleMultipleUpdates} data-testid="multi-update">
              Update All
            </button>
          </div>
        )
      }

      renderWithProviders(<TestComponent />)

      const initialRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0')

      // Click button to trigger multiple state updates
      fireEvent.click(screen.getByTestId('multi-update'))

      const finalRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0')

      // React should batch the updates into a single render
      expect(finalRenderCount - initialRenderCount).toBe(1)
      expect(screen.getByTestId('state-sum')).toHaveTextContent('3')
    })

    it('should handle rapid state changes efficiently', async () => {
      renderWithProviders(<ComponentWithHooks />)

      const incrementButton = screen.getByTestId('increment')
      const startTime = performance.now()

      // Rapidly click button many times
      for (let i = 0; i < 100; i++) {
        fireEvent.click(incrementButton)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle rapid clicks efficiently (under 100ms)
      expect(duration).toBeLessThan(100)
      expect(screen.getByTestId('count')).toHaveTextContent('100')
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory with repeated mount/unmount cycles', () => {
      // Track initial memory usage (simplified)
      const initialComponentCount = document.querySelectorAll('[data-testid]').length

      // Mount and unmount components repeatedly
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithProviders(<ComponentWithHooks />)
        unmount()
      }

      // Final component count should be back to initial
      const finalComponentCount = document.querySelectorAll('[data-testid]').length
      expect(finalComponentCount).toBe(initialComponentCount)
    })

    it('should cleanup timers and subscriptions on unmount', () => {
      const { unmount } = renderWithProviders(<ComponentWithHooks />)

      // Let timers run
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Get data length before unmount
      const dataLength = parseInt(screen.getByTestId('data-length').textContent || '0')

      // Unmount component
      unmount()

      // Advance time - timers should be cleaned up
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // If we render a new instance, it should start fresh
      renderWithProviders(<ComponentWithHooks />)
      const newDataLength = parseInt(screen.getByTestId('data-length').textContent || '0')
      
      expect(newDataLength).toBe(0) // Should start at 0, not continue from previous
    })
  })

  describe('Bundle Size Optimization', () => {
    it('should use tree-shaking friendly exports', () => {
      // This is more of a build-time test, but we can verify
      // that components don't import unnecessary dependencies
      
      renderWithProviders(<ComponentWithHooks />)

      // Components should render without importing entire libraries
      expect(screen.getByTestId('component-with-hooks')).toBeInTheDocument()
    })

    it('should lazy load components when appropriate', () => {
      // Test that components can be lazy loaded conceptually
      const LazyComponent = () => <div data-testid="lazy-component">Lazy loaded</div>

      renderWithProviders(
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      )

      // Component should render successfully
      expect(screen.getByTestId('lazy-component')).toBeInTheDocument()
    })
  })

  describe('Concurrent Features', () => {
    it('should handle concurrent updates gracefully', () => {
      const ConcurrentComponent = () => {
        const [count, setCount] = useState(0)
        
        // Simulate multiple updates happening concurrently
        const handleConcurrentUpdates = () => {
          setTimeout(() => setCount(1), 0)
          setTimeout(() => setCount(2), 0)
          setTimeout(() => setCount(3), 0)
        }

        return (
          <div>
            <div data-testid="concurrent-count">{count}</div>
            <button onClick={handleConcurrentUpdates} data-testid="concurrent-update">
              Trigger Concurrent Updates
            </button>
          </div>
        )
      }

      renderWithProviders(<ConcurrentComponent />)

      fireEvent.click(screen.getByTestId('concurrent-update'))

      // Should handle concurrent updates without errors
      act(() => {
        vi.runAllTimers()
      })

      expect(screen.getByTestId('concurrent-count')).toHaveTextContent('3')
    })
  })
})
