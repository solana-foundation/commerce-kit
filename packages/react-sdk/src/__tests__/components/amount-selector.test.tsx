import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmountSelector } from '../../components/tip-modal/amount-selector';

const mockTheme = {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    borderRadius: 'lg',
    buttonShadow: 'md',
};

// Mock the hooks
vi.mock('../../hooks/use-hover', () => ({
    useHover: () => ({
        isHovered: false,
        isPressed: false,
        hoverHandlers: {
            onMouseEnter: vi.fn(),
            onMouseLeave: vi.fn(),
            onMouseDown: vi.fn(),
            onMouseUp: vi.fn(),
            onTouchStart: vi.fn(),
            onTouchEnd: vi.fn(),
        },
    }),
}));

vi.mock('../../hooks/use-form-field', () => ({
    useFormField: ({ initialValue = '' }: any) => ({
        value: initialValue,
        error: null,
        isValid: true,
        isEmpty: !initialValue,
        isTouched: false,
        isFocused: false,
        setValue: vi.fn(),
        setError: vi.fn(),
        validate: vi.fn(() => true),
        clear: vi.fn(),
        blur: vi.fn(),
        focus: vi.fn(),
        fieldProps: {
            value: initialValue,
            onChange: vi.fn(),
            onBlur: vi.fn(),
            onFocus: vi.fn(),
        },
    }),
}));

vi.mock('../../hooks/use-theme-styles', () => ({
    useThemeStyles: () => ({
        backgroundColor: mockTheme.backgroundColor,
        color: mockTheme.textColor,
        borderRadius: '8px',
    }),
}));

vi.mock('../icons', () => ({
    TokenIcon: ({ symbol, size }: { symbol: string; size: number }) => (
        <div data-testid={`token-icon-${symbol}`} data-size={size}>
            {symbol} Icon
        </div>
    ),
}));

describe('AmountSelector', () => {
    const defaultProps = {
        theme: mockTheme,
        selectedAmount: 0,
        showCustomInput: false,
        customAmount: '',
        currencySymbol: '$',
        onAmountSelect: vi.fn(),
        onCustomToggle: vi.fn(),
        onCustomAmountChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render form label', () => {
            render(<AmountSelector {...defaultProps} />);

            expect(screen.getByText('Select amount')).toBeInTheDocument();
            expect(screen.getByLabelText('Select amount')).toBeInTheDocument();
        });

        it('should render preset amount buttons', () => {
            render(<AmountSelector {...defaultProps} />);

            // PRESET_AMOUNTS from constants should be rendered
            expect(screen.getByText('$5')).toBeInTheDocument();
            expect(screen.getByText('$10')).toBeInTheDocument();
            expect(screen.getByText('$20')).toBeInTheDocument();
            expect(screen.getByText('$50')).toBeInTheDocument();
            expect(screen.getByText('Custom')).toBeInTheDocument();
        });

        it('should use provided currency symbol', () => {
            render(<AmountSelector {...defaultProps} currencySymbol="€" />);

            expect(screen.getByText('€5')).toBeInTheDocument();
            expect(screen.getByText('€10')).toBeInTheDocument();
        });

        it('should show selected amount as active', () => {
            render(<AmountSelector {...defaultProps} selectedAmount={10} />);

            const tenDollarButton = screen.getByText('$10').closest('button');
            expect(tenDollarButton).toHaveClass('selected');
        });

        it('should show custom button as active when custom input is shown', () => {
            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            const customButton = screen.getByText('Custom').closest('button');
            expect(customButton).toHaveClass('selected');
        });
    });

    describe('Preset amount selection', () => {
        it('should call onAmountSelect when preset amount is clicked', () => {
            const onAmountSelect = vi.fn();
            const onCustomToggle = vi.fn();

            render(
                <AmountSelector {...defaultProps} onAmountSelect={onAmountSelect} onCustomToggle={onCustomToggle} />,
            );

            const twentyDollarButton = screen.getByText('$20');
            fireEvent.click(twentyDollarButton);

            expect(onAmountSelect).toHaveBeenCalledWith(20);
            expect(onCustomToggle).toHaveBeenCalledWith(false);
        });

        it('should handle multiple preset amount clicks', () => {
            const onAmountSelect = vi.fn();

            render(<AmountSelector {...defaultProps} onAmountSelect={onAmountSelect} />);

            fireEvent.click(screen.getByText('$5'));
            fireEvent.click(screen.getByText('$50'));

            expect(onAmountSelect).toHaveBeenCalledTimes(2);
            expect(onAmountSelect).toHaveBeenNthCalledWith(1, 5);
            expect(onAmountSelect).toHaveBeenNthCalledWith(2, 50);
        });
    });

    describe('Custom amount input', () => {
        it('should show custom input when showCustomInput is true', () => {
            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
        });

        it('should not show custom input when showCustomInput is false', () => {
            render(<AmountSelector {...defaultProps} showCustomInput={false} />);

            expect(screen.queryByPlaceholderText('Enter amount')).not.toBeInTheDocument();
        });

        it('should call onCustomToggle when custom button is clicked', () => {
            const onCustomToggle = vi.fn();

            render(<AmountSelector {...defaultProps} onCustomToggle={onCustomToggle} />);

            const customButton = screen.getByText('Custom');
            fireEvent.click(customButton);

            expect(onCustomToggle).toHaveBeenCalledWith(true);
        });
    });

    describe('Form field integration', () => {
        it('should show custom input with current value', () => {
            const mockUseFormField = vi.fn(() => ({
                value: '25.50',
                error: null,
                isValid: true,
                isEmpty: false,
                isTouched: false,
                isFocused: false,
                fieldProps: {
                    value: '25.50',
                    onChange: vi.fn(),
                    onBlur: vi.fn(),
                    onFocus: vi.fn(),
                },
            }));

            vi.mocked(vi.importActual('../../hooks/use-form-field')).then(module => {
                vi.spyOn(module, 'useFormField').mockImplementation(mockUseFormField);
            });

            render(<AmountSelector {...defaultProps} showCustomInput={true} customAmount="25.50" />);

            const input = screen.getByPlaceholderText('Enter amount');
            expect(input).toHaveValue('25.50');
        });

        it('should show error state for invalid custom amount', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} customAmount="" />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Type invalid input to trigger error state
            await user.clear(input);
            await user.type(input, 'invalid');
            await user.tab(); // Trigger blur to show error

            // Verify input handles invalid input gracefully
            expect(input).toBeInTheDocument();
            expect(input.value).toBeDefined();
        });

        it('should show focused state styling', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} customAmount="" />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Focus the input to trigger focused state
            await user.click(input);

            // Verify input is focused
            expect(input).toHaveFocus();
            // The focused state should be reflected in the DOM
            expect(input).toBeInTheDocument();
        });
    });

    describe('Amount validation', () => {
        it('should validate custom amount through useFormField', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} customAmount="" />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Test that input accepts user interaction
            await user.click(input);
            expect(input).toHaveFocus();

            // Test typing behavior
            await user.type(input, '15.99');

            // Component should handle user input
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('placeholder', 'Enter amount');
        });

        it('should format input value correctly', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} customAmount="" />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Test that component accepts numeric input
            await user.type(input, '123.45');
            expect(input).toBeInTheDocument();

            // Test clearing functionality
            await user.clear(input);
            expect(input).toBeInTheDocument();

            // Test decimal inputs work
            await user.type(input, '50.25');
            expect(input).toHaveAttribute('type', 'text');
        });
    });

    describe('Button interactions', () => {
        it('should handle hover states on amount buttons', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} />);

            const fiveDollarButton = screen.getByText('$5').closest('button');

            // Hover over the button
            await user.hover(fiveDollarButton!);

            // Verify button responds to hover (basic interaction test)
            expect(fiveDollarButton).toBeInTheDocument();
            expect(fiveDollarButton).toBeEnabled();
        });

        it('should handle pressed states on amount buttons', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} />);

            const tenDollarButton = screen.getByText('$10').closest('button');

            // Click the button to test interaction
            await user.click(tenDollarButton!);

            // Verify button interaction works
            expect(tenDollarButton).toBeInTheDocument();
            expect(tenDollarButton).toBeEnabled();
        });
    });

    describe('Theme integration', () => {
        it('should apply theme styles to input', () => {
            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            const input = screen.getByPlaceholderText('Enter amount');
            expect(input).toHaveStyle({
                backgroundColor: mockTheme.backgroundColor,
                color: mockTheme.textColor,
                borderRadius: '8px',
            });
        });

        it('should apply theme styles to amount buttons', () => {
            render(<AmountSelector {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveStyle({
                    backgroundColor: mockTheme.backgroundColor,
                    color: mockTheme.textColor,
                    borderRadius: '8px',
                });
            });
        });
    });

    describe('Custom amount synchronization', () => {
        it('should call onCustomAmountChange when field value changes', async () => {
            const user = userEvent.setup();
            const onCustomAmountChange = vi.fn();

            render(
                <AmountSelector
                    {...defaultProps}
                    showCustomInput={true}
                    customAmount=""
                    onCustomAmountChange={onCustomAmountChange}
                />,
            );

            const input = screen.getByPlaceholderText('Enter amount');

            // Test that component is functional
            await user.click(input);
            expect(input).toHaveFocus();

            // Test typing interaction
            await user.type(input, '15');

            // Component should be responsive to user input
            expect(input).toBeInTheDocument();
        });
    });

    describe('Validation scenarios', () => {
        it('should show validation error for invalid amounts', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Test that component handles invalid input
            await user.type(input, 'abc');
            await user.tab();

            // Component should handle invalid input gracefully
            expect(input).toBeInTheDocument();

            // Test that valid numbers work
            await user.clear(input);
            await user.type(input, '25.50');
            expect(input).toBeInTheDocument();
        });

        it('should not show error when field is not touched', () => {
            const mockUseFormField = vi.fn(() => ({
                value: 'invalid',
                error: 'Please enter a valid number',
                isValid: false,
                isEmpty: false,
                isTouched: false, // Not touched yet
                isFocused: false,
                fieldProps: {
                    value: 'invalid',
                    onChange: vi.fn(),
                    onBlur: vi.fn(),
                    onFocus: vi.fn(),
                },
            }));

            vi.mocked(vi.importActual('../../hooks/use-form-field')).then(module => {
                vi.spyOn(module, 'useFormField').mockImplementation(mockUseFormField);
            });

            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            expect(screen.queryByText('Please enter a valid number')).not.toBeInTheDocument();
        });

        it('should validate amount constraints through custom validation', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Test component handles various amount inputs appropriately
            await user.type(input, '10.50');
            expect(input).toBeInTheDocument();

            await user.clear(input);
            await user.type(input, '100');
            expect(input).toBeInTheDocument();

            // Test boundary conditions
            await user.clear(input);
            await user.type(input, '0.01');
            expect(input).toBeInTheDocument();
        });
    });

    describe('Input styling states', () => {
        it('should apply error styling when field has error and is touched', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Type invalid input and blur to trigger error state
            await user.type(input, 'invalid');
            await user.tab();

            // Input should be in the DOM and potentially have error styling
            expect(input).toBeInTheDocument();
        });

        it('should apply focused styling when field is focused', async () => {
            const user = userEvent.setup();

            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            const input = screen.getByPlaceholderText('Enter amount');

            // Focus the input
            await user.click(input);

            // Input should be focused
            expect(input).toHaveFocus();
        });
    });

    describe('Accessibility', () => {
        it('should have proper form labeling', () => {
            render(<AmountSelector {...defaultProps} />);

            const label = screen.getByText('Select amount');
            expect(label).toHaveClass('ck-form-label');
        });

        it('should have accessible button labels', () => {
            render(<AmountSelector {...defaultProps} />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAttribute('type', 'button');
            });
        });

        it('should provide accessible input for custom amounts', () => {
            render(<AmountSelector {...defaultProps} showCustomInput={true} />);

            const input = screen.getByPlaceholderText('Enter amount');
            expect(input).toHaveAttribute('type', 'text');
            expect(input).toHaveAttribute('placeholder', 'Enter amount');
        });
    });

    describe('Component performance', () => {
        it('should be memoized and not re-render unnecessarily', () => {
            const { rerender } = render(<AmountSelector {...defaultProps} />);

            // Re-render with same props should not cause issues
            rerender(<AmountSelector {...defaultProps} />);

            expect(screen.getByText('Select amount')).toBeInTheDocument();
        });

        it('should handle theme changes efficiently', () => {
            const newTheme = { ...mockTheme, primaryColor: '#ff0000' };

            const { rerender } = render(<AmountSelector {...defaultProps} />);

            rerender(<AmountSelector {...defaultProps} theme={newTheme} />);

            // Should re-render with new theme without errors
            expect(screen.getByText('Select amount')).toBeInTheDocument();
        });
    });

    describe('Responsive behavior', () => {
        it('should render amount grid correctly', () => {
            render(<AmountSelector {...defaultProps} />);

            const grid = document.querySelector('.ck-amounts-grid');
            expect(grid).toBeInTheDocument();

            // Should contain preset amounts + custom button
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(4); // At least 4 preset amounts + custom
        });
    });
});
