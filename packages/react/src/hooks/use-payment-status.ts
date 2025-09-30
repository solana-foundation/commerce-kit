/**
 * usePaymentStatus Hook
 * Centralized payment status management
 */

import { useState, useCallback } from 'react';

export type PaymentStatus =
    | 'idle'
    | 'connecting'
    | 'scanning'
    | 'processing'
    | 'confirming'
    | 'success'
    | 'error'
    | 'cancelled'
    | 'timeout';

interface UsePaymentStatusReturn {
    status: PaymentStatus;
    error: string | null;
    isLoading: boolean;
    isComplete: boolean;
    canRetry: boolean;
    setStatus: (status: PaymentStatus) => void;
    setError: (error: string | null) => void;
    handleSuccess: () => void;
    handleError: (error: string | Error) => void;
    handleCancel: () => void;
    handleTimeout: () => void;
    retry: () => void;
    reset: () => void;
}

export function usePaymentStatus(): UsePaymentStatusReturn {
    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleSuccess = useCallback(() => {
        setStatus('success');
        setError(null);
    }, []);

    const handleError = useCallback((errorInput: string | Error) => {
        setStatus('error');
        const errorMessage = errorInput instanceof Error ? errorInput.message : errorInput;
        setError(errorMessage);
    }, []);

    const handleCancel = useCallback(() => {
        setStatus('cancelled');
        setError(null);
    }, []);

    const handleTimeout = useCallback(() => {
        setStatus('timeout');
        setError('Payment request timed out. Please try again.');
    }, []);

    const retry = useCallback(() => {
        setStatus('idle');
        setError(null);
    }, []);

    const reset = useCallback(() => {
        setStatus('idle');
        setError(null);
    }, []);

    // Computed properties
    const isLoading = ['connecting', 'scanning', 'processing', 'confirming'].includes(status);
    const isComplete = ['success', 'error', 'cancelled', 'timeout'].includes(status);
    const canRetry = ['error', 'timeout'].includes(status);

    return {
        status,
        error,
        isLoading,
        isComplete,
        canRetry,
        setStatus,
        setError,
        handleSuccess,
        handleError,
        handleCancel,
        handleTimeout,
        retry,
        reset,
    };
}
