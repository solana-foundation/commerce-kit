import React from 'react';
import type { ThemeConfig } from '../../types';
import { ErrorIcon } from '../icons';

const RetryIcon = (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M9.30087 3.20115C8.45564 2.35534 7.2893 1.83317 5.9999 1.83317C3.42257 1.83317 1.33323 3.92251 1.33323 6.49984C1.33323 9.07717 3.42257 11.1665 5.9999 11.1665C8.12658 11.1665 9.9224 9.74345 10.4842 7.79644C10.5736 7.48691 10.8969 7.30838 11.2064 7.39771C11.516 7.48703 11.6945 7.81036 11.6052 8.1199C10.9031 10.5529 8.66016 12.3332 5.9999 12.3332C2.77824 12.3332 0.166563 9.7215 0.166563 6.49984C0.166563 3.27818 2.77824 0.666504 5.9999 0.666504C7.61129 0.666504 9.07102 1.32065 10.1261 2.37648C10.4972 2.74777 10.8965 3.20851 11.2498 3.6382V1.83317C11.2498 1.511 11.511 1.24984 11.8332 1.24984C12.1553 1.24984 12.4165 1.511 12.4165 1.83317V5.33317C12.4165 5.65534 12.1553 5.9165 11.8332 5.9165H8.33317C8.011 5.9165 7.74984 5.65534 7.74984 5.33317C7.74984 5.011 8.011 4.74984 8.33317 4.74984H10.6486C10.2495 4.24901 9.74668 3.64726 9.30087 3.20115Z"
            fill="currentColor"
            fillOpacity="0.72"
        />
    </svg>
);

interface TransactionErrorProps {
    theme: Required<ThemeConfig>;
    error: string | Error;
    onRetry?: () => void;
    onClose?: () => void;
}

export function TransactionError({ theme, error, onRetry, onClose }: TransactionErrorProps) {
    const errorMessage = error instanceof Error ? error.message : error;
    return (
        <div
            className="ck-transaction-error ck-transaction-error-container"
            style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
        >
            {/* Error Icon */}
            <div className="ck-transaction-error-icon">
                <ErrorIcon size={32} color="#ef4444" />
            </div>

            {/* Error Message with Token */}
            <div className="ck-transaction-error-content">
                <div>
                    <div className="ck-transaction-error-title" style={{ color: theme.textColor }}>
                        Payment Failed
                    </div>
                    <div className="ck-transaction-error-message" style={{ color: theme.textColor }}>
                        {error instanceof Error ? error.message : error}
                    </div>
                </div>

                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="ck-transaction-try-again-button"
                        style={{ color: theme.textColor }}
                    >
                        {RetryIcon}
                        Try Again
                    </button>
                )}

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="ck-transaction-close-button"
                        style={{ color: theme.textColor }}
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}

TransactionError.displayName = 'TransactionError';
