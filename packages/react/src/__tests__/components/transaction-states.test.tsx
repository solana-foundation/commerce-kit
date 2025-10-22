import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionError } from '../../components/transaction-states/TransactionError';
import { TransactionSuccess } from '../../components/transaction-states/TransactionSuccess';

const mockTheme = {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    borderRadius: 'lg',
    buttonShadow: 'md',
};

// Mock the icon components
vi.mock('../../components/icons', () => ({
    ErrorIcon: ({ size = 24, color }: { size?: number; color?: string }) => (
        <div data-testid="error-icon" data-size={size} data-color={color}>
            Error Icon
        </div>
    ),
    SuccessIcon: ({ size = 24, color }: { size?: number; color?: string }) => (
        <div data-testid="success-icon" data-size={size} data-color={color}>
            Success Icon
        </div>
    ),
    TokenIcon: ({ symbol, size = 20 }: { symbol: string; size?: number }) => (
        <div data-testid={`token-icon-${symbol}`} data-size={size}>
            {symbol} Icon
        </div>
    ),
}));

// Mock the config context
vi.mock('../../context/SolanaPayConfigProvider', () => ({
    useSolanaPayConfig: () => ({
        merchant: {
            name: 'Test Merchant',
        },
    }),
}));

// Default props for all transaction state components
const defaultErrorProps = {
    theme: mockTheme,
    config: { merchant: { name: 'Test Merchant' } },
    selectedCurrency: 'USDC' as const,
    displayAmount: '1.50',
    error: 'Transaction failed due to insufficient funds',
    onRetry: vi.fn(),
    onClose: vi.fn(),
};

const defaultSuccessProps = {
    theme: mockTheme,
    config: { merchant: { name: 'Test Merchant' } },
    selectedCurrency: 'USDC' as const,
    displayAmount: '1.50',
    amount: 1.5,
    signature: '5VfYmGC9L2VTqCdqRCKt7LcaUp5XYRhZzpq3r1YqDbhqKjDdKBEWQGKfMtpJJwz7CKt8Q4r2VcDZF1QCqRcSGQjU',
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    onClose: vi.fn(),
    onViewTransaction: vi.fn(),
};

describe('Transaction State Components', () => {
    describe('TransactionError', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should render error message', () => {
            render(<TransactionError {...defaultErrorProps} />);

            expect(screen.getByText('Transaction failed due to insufficient funds')).toBeInTheDocument();
            expect(screen.getByTestId('error-icon')).toBeInTheDocument();
        });

        it('should render retry button when onRetry is provided', () => {
            render(<TransactionError {...defaultErrorProps} />);

            const retryButton = screen.getByText('Try Again');
            expect(retryButton).toBeInTheDocument();
            expect(retryButton).toHaveAttribute('type', 'button');
        });

        it('should call onRetry when retry button is clicked', () => {
            const onRetry = vi.fn();
            render(<TransactionError {...defaultErrorProps} onRetry={onRetry} />);

            const retryButton = screen.getByText('Try Again');
            fireEvent.click(retryButton);

            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should render close button when onClose is provided', () => {
            render(<TransactionError {...defaultErrorProps} />);

            const closeButton = screen.getByText('Close');
            expect(closeButton).toBeInTheDocument();
        });

        it('should call onClose when close button is clicked', () => {
            const onClose = vi.fn();
            render(<TransactionError {...defaultErrorProps} onClose={onClose} />);

            const closeButton = screen.getByText('Close');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('should not render retry button when onRetry is not provided', () => {
            render(<TransactionError theme={mockTheme} error="Non-retryable error" onClose={vi.fn()} />);

            expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
            expect(screen.getByText('Close')).toBeInTheDocument();
        });

        it('should apply theme styles', () => {
            render(<TransactionError {...defaultErrorProps} />);

            const errorContainer = document.querySelector('.ck-transaction-error');
            expect(errorContainer).toHaveStyle({
                backgroundColor: mockTheme.backgroundColor,
                color: mockTheme.textColor,
            });
        });

        it('should handle long error messages', () => {
            const longError =
                'This is a very long error message that might wrap to multiple lines and should be handled gracefully by the component without breaking the layout or causing overflow issues';

            render(<TransactionError {...defaultErrorProps} error={longError} />);

            expect(screen.getByText(longError)).toBeInTheDocument();
        });

        it('should handle Error objects as well as strings', () => {
            const errorObject = new Error('Error object message');

            render(<TransactionError {...defaultErrorProps} error={errorObject.message} />);

            expect(screen.getByText('Error object message')).toBeInTheDocument();
        });
    });

    describe('TransactionSuccess', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should render success message with amount and currency', () => {
            render(<TransactionSuccess {...defaultSuccessProps} />);

            expect(screen.getByText(/Successfully sent/)).toBeInTheDocument();
            expect(screen.getByText(/1.5 USDC/)).toBeInTheDocument();
            expect(screen.getByTestId('success-icon')).toBeInTheDocument();
        });

        it('should display transaction signature', () => {
            render(<TransactionSuccess {...defaultSuccessProps} />);

            // Should show a shortened version of the signature
            expect(screen.getByText(/5VfY...GQjU/)).toBeInTheDocument();
        });

        it('should display recipient address', () => {
            render(<TransactionSuccess {...defaultSuccessProps} />);

            // Should show a shortened version of the recipient
            expect(screen.getByText(/9WzD...AWWM/)).toBeInTheDocument();
        });

        it('should render view transaction button', () => {
            render(<TransactionSuccess {...defaultSuccessProps} />);

            expect(screen.getByText('See Transaction')).toBeInTheDocument();
        });

        it('should call onViewTransaction when view button is clicked', () => {
            const onViewTransaction = vi.fn();
            render(<TransactionSuccess {...defaultSuccessProps} onViewTransaction={onViewTransaction} />);

            const viewButton = screen.getByText('See Transaction');
            fireEvent.click(viewButton);

            expect(onViewTransaction).toHaveBeenCalledWith(defaultSuccessProps.signature);
        });


        it('should handle different currencies correctly', () => {
            const { rerender } = render(<TransactionSuccess {...defaultSuccessProps} currency="SOL" amount={0.5} />);

            expect(screen.getByText(/0.5 SOL/)).toBeInTheDocument();

            rerender(<TransactionSuccess {...defaultSuccessProps} currency="USDT" amount={100} />);
            expect(screen.getByText(/100 USDT/)).toBeInTheDocument();
        });

        it('should handle large amounts correctly', () => {
            render(<TransactionSuccess {...defaultSuccessProps} amount={1000000} />);

            expect(screen.getByText(/1000000 USDC/)).toBeInTheDocument();
        });

        it('should handle decimal amounts correctly', () => {
            render(<TransactionSuccess {...defaultSuccessProps} amount={0.000001} />);

            expect(screen.getByText(/0.000001 USDC/)).toBeInTheDocument();
        });

        it('should apply theme styles', () => {
            render(<TransactionSuccess {...defaultSuccessProps} />);

            const successContainer = document.querySelector('.ck-transaction-success');
            expect(successContainer).toHaveStyle({
                backgroundColor: mockTheme.backgroundColor,
                color: mockTheme.textColor,
            });
        });
    });

    describe('Address formatting', () => {
        it('should format long addresses correctly', () => {
            const longAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

            render(<TransactionSuccess {...defaultSuccessProps} recipient={longAddress} />);

            // Should show first 4 and last 4 characters
            expect(screen.getByText(/9WzD...AWWM/)).toBeInTheDocument();
        });

        it('should handle short addresses', () => {
            const shortAddress = '12345';

            render(<TransactionSuccess {...defaultSuccessProps} recipient={shortAddress} />);

            // Should show the full address if it's short
            expect(screen.getByText(new RegExp(shortAddress))).toBeInTheDocument();
        });
    });

    describe('Signature formatting', () => {
        it('should format long signatures correctly', () => {
            const longSignature =
                '5VfYmGC9L2VTqCdqRCKt7LcaUp5XYRhZzpq3r1YqDbhqKjDdKBEWQGKfMtpJJwz7CKt8Q4r2VcDZF1QCqRcSGQjU';

            render(<TransactionSuccess {...defaultSuccessProps} signature={longSignature} />);

            // Should show first 4 and last 4 characters
            expect(screen.getByText(/5VfY...GQjU/)).toBeInTheDocument();
        });

        it('should handle short signatures', () => {
            const shortSignature = 'abc123';

            render(<TransactionSuccess {...defaultSuccessProps} signature={shortSignature} />);

            // Should show the full signature if it's short
            expect(screen.getByText(new RegExp(shortSignature))).toBeInTheDocument();
        });
    });

    describe('Component composition', () => {
        it('should compose error state correctly with all props', () => {
            render(
                <TransactionError
                    theme={mockTheme}
                    error="Complete error with all actions"
                    onRetry={vi.fn()}
                    onClose={vi.fn()}
                    showDetails={true}
                    canRetry={true}
                />,
            );

            expect(screen.getByTestId('error-icon')).toBeInTheDocument();
            expect(screen.getByText('Complete error with all actions')).toBeInTheDocument();
            expect(screen.getByText('Try Again')).toBeInTheDocument();
            expect(screen.getByText('Close')).toBeInTheDocument();
        });

        it('should compose success state correctly with all props', () => {
            render(
                <TransactionSuccess
                    {...defaultSuccessProps}
                    showDetails={true}
                    explorerUrl="https://explorer.solana.com"
                />,
            );

            expect(screen.getByTestId('success-icon')).toBeInTheDocument();
            expect(screen.getByText('See Transaction')).toBeInTheDocument();
            expect(screen.getByText('Close')).toBeInTheDocument();
        });
    });

    describe('Icon integration', () => {
        it('should pass correct props to ErrorIcon', () => {
            render(<TransactionError {...defaultErrorProps} />);

            const errorIcon = screen.getByTestId('error-icon');
            expect(errorIcon).toHaveAttribute('data-size', '32'); // Larger size for transaction state
            expect(errorIcon).toHaveAttribute('data-color', '#ef4444'); // Error red color
        });

        it('should pass correct props to SuccessIcon', () => {
            render(<TransactionSuccess {...defaultSuccessProps} />);

            const successIcon = screen.getByTestId('success-icon');
            expect(successIcon).toHaveAttribute('data-size', '32'); // Larger size for transaction state
            expect(successIcon).toHaveAttribute('data-color', '#10b981'); // Success green color
        });
    });
});
