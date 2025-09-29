import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaymentStatus } from '../../hooks/use-payment-status';

describe('usePaymentStatus', () => {
    it('should initialize with idle status', () => {
        const { result } = renderHook(() => usePaymentStatus());

        expect(result.current.status).toBe('idle');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isComplete).toBe(false);
        expect(result.current.canRetry).toBe(false);
    });

    it('should handle success correctly', () => {
        const { result } = renderHook(() => usePaymentStatus());

        act(() => {
            result.current.handleSuccess();
        });

        expect(result.current.status).toBe('success');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isComplete).toBe(true);
        expect(result.current.canRetry).toBe(false);
    });

    it('should handle error with string message', () => {
        const { result } = renderHook(() => usePaymentStatus());

        act(() => {
            result.current.handleError('Payment failed');
        });

        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Payment failed');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isComplete).toBe(true);
        expect(result.current.canRetry).toBe(true);
    });

    it('should handle error with Error object', () => {
        const { result } = renderHook(() => usePaymentStatus());

        act(() => {
            result.current.handleError(new Error('Network error'));
        });

        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Network error');
        expect(result.current.canRetry).toBe(true);
    });

    it('should handle cancel correctly', () => {
        const { result } = renderHook(() => usePaymentStatus());

        act(() => {
            result.current.handleCancel();
        });

        expect(result.current.status).toBe('cancelled');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isComplete).toBe(true);
        expect(result.current.canRetry).toBe(false);
    });

    it('should handle timeout correctly', () => {
        const { result } = renderHook(() => usePaymentStatus());

        act(() => {
            result.current.handleTimeout();
        });

        expect(result.current.status).toBe('timeout');
        expect(result.current.error).toBe('Payment request timed out. Please try again.');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isComplete).toBe(true);
        expect(result.current.canRetry).toBe(true);
    });

    it('should handle retry correctly', () => {
        const { result } = renderHook(() => usePaymentStatus());

        // First set error status
        act(() => {
            result.current.handleError('Some error');
        });

        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Some error');

        // Then retry
        act(() => {
            result.current.retry();
        });

        expect(result.current.status).toBe('idle');
        expect(result.current.error).toBeNull();
        expect(result.current.canRetry).toBe(false);
    });

    it('should handle reset correctly', () => {
        const { result } = renderHook(() => usePaymentStatus());

        // Set some status
        act(() => {
            result.current.setStatus('processing');
            result.current.setError('Some error');
        });

        expect(result.current.status).toBe('processing');
        expect(result.current.error).toBe('Some error');

        // Reset
        act(() => {
            result.current.reset();
        });

        expect(result.current.status).toBe('idle');
        expect(result.current.error).toBeNull();
    });

    it('should correctly identify loading states', () => {
        const { result } = renderHook(() => usePaymentStatus());

        const loadingStates = ['connecting', 'scanning', 'processing', 'confirming'];

        loadingStates.forEach(status => {
            act(() => {
                result.current.setStatus(status as any);
            });

            expect(result.current.isLoading).toBe(true);
        });
    });

    it('should correctly identify complete states', () => {
        const { result } = renderHook(() => usePaymentStatus());

        const completeStates = ['success', 'error', 'cancelled', 'timeout'];

        completeStates.forEach(status => {
            act(() => {
                result.current.setStatus(status as any);
            });

            expect(result.current.isComplete).toBe(true);
        });
    });

    it('should correctly identify retryable states', () => {
        const { result } = renderHook(() => usePaymentStatus());

        act(() => {
            result.current.setStatus('error');
        });

        expect(result.current.canRetry).toBe(true);

        act(() => {
            result.current.setStatus('timeout');
        });

        expect(result.current.canRetry).toBe(true);

        act(() => {
            result.current.setStatus('success');
        });

        expect(result.current.canRetry).toBe(false);
    });

    it('should allow manual status setting', () => {
        const { result } = renderHook(() => usePaymentStatus());

        act(() => {
            result.current.setStatus('connecting');
        });

        expect(result.current.status).toBe('connecting');
        expect(result.current.isLoading).toBe(true);

        act(() => {
            result.current.setError('Manual error');
        });

        expect(result.current.error).toBe('Manual error');
    });
});
