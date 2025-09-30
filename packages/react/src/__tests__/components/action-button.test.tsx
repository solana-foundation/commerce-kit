import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionButton } from '../../components/tip-modal/action-button';

const mockTheme = {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    borderRadius: 'lg',
    buttonShadow: 'md',
};

describe('ActionButton', () => {
    it('should render button with children', () => {
        render(<ActionButton theme={mockTheme}>Test Button</ActionButton>);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should call onClick when clicked', () => {
        const mockOnClick = vi.fn();

        render(
            <ActionButton theme={mockTheme} onClick={mockOnClick}>
                Click Me
            </ActionButton>,
        );

        fireEvent.click(screen.getByRole('button'));
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when isDisabled is true', () => {
        const mockOnClick = vi.fn();

        render(
            <ActionButton theme={mockTheme} isDisabled onClick={mockOnClick}>
                Disabled Button
            </ActionButton>,
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();

        fireEvent.click(button);
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should be disabled when isProcessing is true', () => {
        const mockOnClick = vi.fn();

        render(
            <ActionButton theme={mockTheme} isProcessing onClick={mockOnClick}>
                Processing Button
            </ActionButton>,
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();

        fireEvent.click(button);
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should show SOL equivalent when provided', () => {
        render(
            <ActionButton theme={mockTheme} solEquivalent="0.05 SOL">
                Pay $10
            </ActionButton>,
        );

        expect(screen.getByText('Pay $10')).toBeInTheDocument();
        expect(screen.getByText('(0.05 SOL)')).toBeInTheDocument();
    });

    it('should not show SOL equivalent when not provided', () => {
        render(<ActionButton theme={mockTheme}>Pay $10</ActionButton>);

        expect(screen.getByText('Pay $10')).toBeInTheDocument();
        expect(screen.queryByText(/\d+\.\d+\s+SOL/)).not.toBeInTheDocument(); // Look for format like "0.05 SOL"
        expect(screen.queryByText(/\(/)).not.toBeInTheDocument(); // No parentheses should be present
    });

    it('should apply theme styles', () => {
        render(<ActionButton theme={mockTheme}>Styled Button</ActionButton>);

        const button = screen.getByText('Styled Button').closest('button');
        expect(button).toHaveClass('ck-action-button');
    });

    it('should handle both isDisabled and isProcessing being true', () => {
        const mockOnClick = vi.fn();

        render(
            <ActionButton theme={mockTheme} isDisabled isProcessing onClick={mockOnClick}>
                Double Disabled
            </ActionButton>,
        );

        const button = screen.getByText('Double Disabled').closest('button');
        expect(button).toBeDisabled();

        fireEvent.click(button!);
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should render complex children', () => {
        render(
            <ActionButton theme={mockTheme}>
                <span>Pay</span>
                <strong>$10</strong>
            </ActionButton>,
        );

        expect(screen.getByText('Pay')).toBeInTheDocument();
        expect(screen.getByText('$10')).toBeInTheDocument();
    });

    it('should handle empty solEquivalent', () => {
        render(
            <ActionButton theme={mockTheme} solEquivalent="">
                Pay $10 Empty
            </ActionButton>,
        );

        expect(screen.getByText('Pay $10 Empty')).toBeInTheDocument();
        expect(screen.queryByText('()')).not.toBeInTheDocument();
    });
});
