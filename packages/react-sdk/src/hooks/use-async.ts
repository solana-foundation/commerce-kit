/**
 * useAsync Hook
 * Handle async operations with loading, error, and data states
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T = any>(
  asyncFunction?: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  // Keep track of the current async operation to prevent race conditions
  const asyncRef = useRef<number>(0);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    if (!asyncFunction) return null;

    // Increment counter for this execution
    const currentExecution = ++asyncRef.current;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunction(...args);
      
      // Only update state if this is still the current execution
      if (currentExecution === asyncRef.current) {
        setState({
          data: result,
          error: null,
          loading: false,
        });
      }
      
      return result;
    } catch (error) {
      // Only update state if this is still the current execution
      if (currentExecution === asyncRef.current) {
        setState({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        });
      }
      
      return null;
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    // Increment counter to cancel any pending operations
    asyncRef.current++;
    setState({
      data: null,
      error: null,
      loading: false,
    });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && asyncFunction) {
      execute();
    }
  }, [immediate, asyncFunction, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}
