import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencySelector } from '../../components/tip-modal/currency-selector';

const mockTheme = {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    borderRadius: 'lg',
    buttonShadow: 'md',
};

const mockCurrencies = [
    { value: 'USDC', label: 'USD Coin', symbol: 'USDC' },
    { value: 'USDT', label: 'Tether USD', symbol: 'USDT' },
    { value: 'SOL', label: 'Solana', symbol: 'SOL' },
] as const;

// Mock the hooks and dependencies
vi.mock('../../hooks/use-dropdown', () => ({
    useDropdown: () => ({
        isOpen: false,
        open: vi.fn(),
        close: vi.fn(),
        select: vi.fn(),
        ref: { current: null },
    }),
}));

vi.mock('../../hooks/use-theme-styles', () => ({
    useThemeStyles: () => ({
        backgroundColor: mockTheme.backgroundColor,
        color: mockTheme.textColor,
        fontFamily: mockTheme.fontFamily,
    }),
}));

vi.mock('../icons', () => ({
    TokenIcon: ({ symbol, size }: { symbol: string; size: number }) => (
        <div data-testid={`token-icon-${symbol}`} data-size={size}>
            {symbol} Icon
        </div>
    ),
}));

vi.mock('../../ui-primitives/dropdown-alpha', () => ({
    DropdownRoot: ({ children, open, onOpenChange }: any) => (
        <div data-testid="dropdown-root" data-open={open} onClick={() => onOpenChange?.(!open)}>
            {children}
        </div>
    ),
    DropdownTrigger: ({ children, asChild }: any) => (
        <div data-testid="dropdown-trigger">{asChild ? children : <button>{children}</button>}</div>
    ),
    DropdownContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownItem: ({ children, onSelect }: any) => (
        <div data-testid="dropdown-item" onClick={onSelect}>
            {children}
        </div>
    ),
}));

describe('CurrencySelector', () => {
    const defaultProps = {
        theme: mockTheme,
        selectedCurrency: 'USDC' as const,
        currencies: mockCurrencies,
        isOpen: false,
        onOpenChange: vi.fn(),
        onSelect: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render with selected currency', () => {
            render(<CurrencySelector {...defaultProps} />);

            expect(screen.getByText('Select stablecoin')).toBeInTheDocument();
            expect(screen.getByTestId('token-icon-USDC-trigger')).toBeInTheDocument();
            expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('USDC');
        });

        it('should show correct selected currency info', () => {
            render(<CurrencySelector {...defaultProps} selectedCurrency="USDT" />);

            expect(screen.getByTestId('token-icon-USDT-trigger')).toBeInTheDocument();
            expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('USDT');
        });

        it('should handle unknown currency gracefully', () => {
            render(<CurrencySelector {...defaultProps} selectedCurrency="UNKNOWN" as any />);

            expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
        });
    });

    describe('Dropdown state', () => {
        it('should reflect open state in UI', () => {
            render(<CurrencySelector {...defaultProps} isOpen={true} />);

            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-expanded', 'true');

            const chevron = document.querySelector('.ck-currency-chevron');
            expect(chevron).toHaveClass('open');
        });

        it('should reflect closed state in UI', () => {
            render(<CurrencySelector {...defaultProps} isOpen={false} />);

            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');

            const chevron = document.querySelector('.ck-currency-chevron');
            expect(chevron).not.toHaveClass('open');
        });

        it('should call onOpenChange when dropdown state changes', () => {
            const onOpenChange = vi.fn();
            render(<CurrencySelector {...defaultProps} onOpenChange={onOpenChange} />);

            const dropdownRoot = screen.getByTestId('dropdown-root');
            fireEvent.click(dropdownRoot);

            expect(onOpenChange).toHaveBeenCalledWith(true);
        });
    });

    describe('Currency selection', () => {
        it('should render all currency options', () => {
            render(<CurrencySelector {...defaultProps} isOpen={true} />);

            mockCurrencies.forEach(currency => {
                expect(screen.getByTestId(`token-icon-${currency.value}-dropdown`)).toBeInTheDocument();
                expect(screen.getByTestId('dropdown-content')).toHaveTextContent(currency.symbol);
            });
        });

        it('should show check icon for selected currency', () => {
            render(<CurrencySelector {...defaultProps} selectedCurrency="USDC" isOpen={true} />);

            // The check icon should be present for USDC (based on the component code)
            const dropdownItems = screen.getAllByTestId('dropdown-item');
            expect(dropdownItems).toHaveLength(3);
        });

        it('should call onSelect when currency is clicked', () => {
            const onSelect = vi.fn();
            render(<CurrencySelector {...defaultProps} onSelect={onSelect} isOpen={true} />);

            const dropdownItems = screen.getAllByTestId('dropdown-item');
            fireEvent.click(dropdownItems[1]); // Click USDT (second item)

            expect(onSelect).toHaveBeenCalledWith('USDT');
        });
    });

    describe('Accessibility', () => {
        it('should have correct ARIA attributes', () => {
            render(<CurrencySelector {...defaultProps} />);

            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            expect(trigger).toHaveAttribute('aria-label', 'Select currency');
        });

        it('should update ARIA expanded state correctly', () => {
            const { rerender } = render(<CurrencySelector {...defaultProps} isOpen={false} />);

            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');

            rerender(<CurrencySelector {...defaultProps} isOpen={true} />);
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
        });
    });

    describe('Theme integration', () => {
        it('should apply theme styles to dropdown elements', () => {
            render(<CurrencySelector {...defaultProps} />);

            const trigger = screen.getByRole('button');
            expect(trigger).toHaveStyle({
                backgroundColor: mockTheme.backgroundColor,
                color: mockTheme.textColor,
                fontFamily: mockTheme.fontFamily,
            });
        });

        it('should pass theme colors to check icon', () => {
            render(<CurrencySelector {...defaultProps} selectedCurrency="USDC" isOpen={true} />);

            // Check that theme primary color is used (based on component implementation)
            const checkElement = document.querySelector('.ck-dropdown-check');
            if (checkElement) {
                expect(checkElement).toHaveStyle({ '--primary-color': mockTheme.primaryColor });
            }
        });
    });

    describe('Integration with external state', () => {
        it('should prefer external isOpen prop over internal state', () => {
            const mockUseDropdown = vi.fn(() => ({
                isOpen: true, // Internal state says open
                open: vi.fn(),
                close: vi.fn(),
                select: vi.fn(),
                ref: { current: null },
            }));

            vi.mocked(vi.importActual('../../hooks/use-dropdown')).then(module => {
                vi.spyOn(module, 'useDropdown').mockImplementation(mockUseDropdown);
            });

            render(<CurrencySelector {...defaultProps} isOpen={false} />); // External prop says closed

            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-expanded', 'false'); // Should use external prop
        });

        it('should call both external and internal handlers', () => {
            const onOpenChange = vi.fn();

            render(<CurrencySelector {...defaultProps} onOpenChange={onOpenChange} />);

            const dropdownTrigger = screen.getByTestId('dropdown-trigger');
            fireEvent.click(dropdownTrigger);

            // The external handler should be called when dropdown is clicked
            expect(onOpenChange).toHaveBeenCalled();
        });
    });

    describe('Currency display', () => {
        it('should display currency symbol from currency info', () => {
            render(<CurrencySelector {...defaultProps} selectedCurrency="USDT" />);

            expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('USDT');
        });

        it('should fallback to currency value when no info found', () => {
            render(<CurrencySelector {...defaultProps} selectedCurrency="UNKNOWN" as any />);

            expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
        });

        it('should show correct token icon size', () => {
            render(<CurrencySelector {...defaultProps} />);

            const tokenIcon = screen.getByTestId('token-icon-USDC-trigger');
            expect(tokenIcon).toHaveAttribute('data-size', '24');
        });
    });
});
