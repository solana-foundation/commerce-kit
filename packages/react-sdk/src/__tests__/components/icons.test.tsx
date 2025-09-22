import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SolanaIcon, USDCIcon, USDTIcon, TokenIcon, ErrorIcon, SuccessIcon } from '../../components/icons';

describe('Icon Components', () => {
    describe('SolanaIcon', () => {
        it('should render with default size', () => {
            render(<SolanaIcon />);

            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute('width', '24');
            expect(svg).toHaveAttribute('height', '24');
        });

        it('should render with custom size', () => {
            render(<SolanaIcon size={48} />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('width', '48');
            expect(svg).toHaveAttribute('height', '48');
        });

        it('should have correct accessibility attributes', () => {
            render(<SolanaIcon />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('role', 'img');
            expect(svg).toHaveAttribute('aria-label', 'Solana');
        });

        it('should accept custom className', () => {
            render(<SolanaIcon className="custom-class" />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveClass('custom-class');
        });
    });

    describe('USDCIcon', () => {
        it('should render with correct default properties', () => {
            render(<USDCIcon />);

            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute('width', '24');
            expect(svg).toHaveAttribute('height', '24');
            expect(svg).toHaveAttribute('aria-label', 'USDC');
        });

        it('should render with custom size', () => {
            render(<USDCIcon size={32} />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('width', '32');
            expect(svg).toHaveAttribute('height', '32');
        });
    });

    describe('USDTIcon', () => {
        it('should render with correct default properties', () => {
            render(<USDTIcon />);

            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute('width', '24');
            expect(svg).toHaveAttribute('height', '24');
            expect(svg).toHaveAttribute('aria-label', 'USDT');
        });

        it('should render with custom size', () => {
            render(<USDTIcon size={16} />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('width', '16');
            expect(svg).toHaveAttribute('height', '16');
        });
    });

    describe('TokenIcon', () => {
        it('should render correct icon for SOL', () => {
            render(<TokenIcon symbol="SOL" />);

            // Should render SolanaIcon
            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('aria-label', 'Solana');
        });

        it('should render correct icon for USDC', () => {
            render(<TokenIcon symbol="USDC" />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('aria-label', 'USDC');
        });

        it('should render correct icon for USDT', () => {
            render(<TokenIcon symbol="USDT" />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('aria-label', 'USDT');
        });

        it('should handle unknown token symbols', () => {
            render(<TokenIcon symbol="UNKNOWN" />);

            // Should render a default token icon or fallback
            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should pass size to underlying icon', () => {
            render(<TokenIcon symbol="SOL" size={64} />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('width', '64');
            expect(svg).toHaveAttribute('height', '64');
        });

        it('should pass className to underlying icon', () => {
            render(<TokenIcon symbol="USDC" className="token-icon-custom" />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveClass('token-icon-custom');
        });
    });

    describe('StatusIcon Components', () => {
        describe('ErrorIcon', () => {
            it('should render error icon with default properties', () => {
                render(<ErrorIcon />);

                const svg = document.querySelector('svg');
                expect(svg).toBeInTheDocument();
                expect(svg).toHaveAttribute('width', '24');
                expect(svg).toHaveAttribute('height', '24');
                expect(svg).toHaveAttribute('aria-label', 'Error');
            });

            it('should render with custom size and color', () => {
                render(<ErrorIcon size={32} color="#ff0000" />);

                const svg = document.querySelector('svg');
                expect(svg).toHaveAttribute('width', '32');
                expect(svg).toHaveAttribute('height', '32');
                // Color would be applied through CSS or fill attribute
            });

            it('should have correct accessibility for error state', () => {
                render(<ErrorIcon />);

                const svg = document.querySelector('svg');
                expect(svg).toHaveAttribute('role', 'img');
                expect(svg).toHaveAttribute('aria-label', 'Error');
            });
        });

        describe('SuccessIcon', () => {
            it('should render success icon with default properties', () => {
                render(<SuccessIcon />);

                const svg = document.querySelector('svg');
                expect(svg).toBeInTheDocument();
                expect(svg).toHaveAttribute('width', '24');
                expect(svg).toHaveAttribute('height', '24');
                expect(svg).toHaveAttribute('aria-label', 'Success');
            });

            it('should render with custom size and color', () => {
                render(<SuccessIcon size={48} color="#00ff00" />);

                const svg = document.querySelector('svg');
                expect(svg).toHaveAttribute('width', '48');
                expect(svg).toHaveAttribute('height', '48');
            });

            it('should have correct accessibility for success state', () => {
                render(<SuccessIcon />);

                const svg = document.querySelector('svg');
                expect(svg).toHaveAttribute('role', 'img');
                expect(svg).toHaveAttribute('aria-label', 'Success');
            });
        });
    });

    describe('Icon consistency', () => {
        it('should have consistent default sizes across all icons', () => {
            const { unmount: unmount1 } = render(<SolanaIcon />);
            let svg = document.querySelector('svg');
            const solanaSize = { width: svg?.getAttribute('width'), height: svg?.getAttribute('height') };
            unmount1();

            const { unmount: unmount2 } = render(<USDCIcon />);
            svg = document.querySelector('svg');
            const usdcSize = { width: svg?.getAttribute('width'), height: svg?.getAttribute('height') };
            unmount2();

            const { unmount: unmount3 } = render(<USDTIcon />);
            svg = document.querySelector('svg');
            const usdtSize = { width: svg?.getAttribute('width'), height: svg?.getAttribute('height') };
            unmount3();

            const { unmount: unmount4 } = render(<ErrorIcon />);
            svg = document.querySelector('svg');
            const errorSize = { width: svg?.getAttribute('width'), height: svg?.getAttribute('height') };
            unmount4();

            const { unmount: unmount5 } = render(<SuccessIcon />);
            svg = document.querySelector('svg');
            const successSize = { width: svg?.getAttribute('width'), height: svg?.getAttribute('height') };
            unmount5();

            // All should have the same default size (24x24)
            expect(solanaSize).toEqual({ width: '24', height: '24' });
            expect(usdcSize).toEqual({ width: '24', height: '24' });
            expect(usdtSize).toEqual({ width: '24', height: '24' });
            expect(errorSize).toEqual({ width: '24', height: '24' });
            expect(successSize).toEqual({ width: '24', height: '24' });
        });

        it('should have consistent accessibility attributes', () => {
            const icons = [
                { component: SolanaIcon, label: 'Solana' },
                { component: USDCIcon, label: 'USDC' },
                { component: USDTIcon, label: 'USDT' },
                { component: ErrorIcon, label: 'Error' },
                { component: SuccessIcon, label: 'Success' },
            ];

            icons.forEach(({ component: IconComponent, label }) => {
                const { unmount } = render(<IconComponent />);

                const svg = document.querySelector('svg');
                expect(svg).toHaveAttribute('role', 'img');
                expect(svg).toHaveAttribute('aria-label', label);

                unmount();
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle zero size gracefully', () => {
            render(<SolanaIcon size={0} />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('width', '0');
            expect(svg).toHaveAttribute('height', '0');
        });

        it('should handle very large sizes', () => {
            render(<TokenIcon symbol="SOL" size={1000} />);

            const svg = document.querySelector('svg');
            expect(svg).toHaveAttribute('width', '1000');
            expect(svg).toHaveAttribute('height', '1000');
        });

        it('should handle empty className', () => {
            render(<USDCIcon className="" />);

            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should handle missing props gracefully', () => {
            render(<TokenIcon symbol="SOL" />);

            // Should render without errors even with minimal props
            const svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    describe('Token icon mapping', () => {
        it('should map currency symbols to correct icons', () => {
            const currencies = ['SOL', 'USDC', 'USDT'] as const;

            currencies.forEach(currency => {
                const { unmount } = render(<TokenIcon symbol={currency} />);

                const svg = document.querySelector('svg');
                expect(svg).toHaveAttribute('aria-label', currency === 'SOL' ? 'Solana' : currency);

                unmount();
            });
        });

        it('should handle case variations in token symbols', () => {
            const { unmount: unmount1 } = render(<TokenIcon symbol="sol" as any />);
            let svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
            unmount1();

            const { unmount: unmount2 } = render(<TokenIcon symbol="usdc" as any />);
            svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
            unmount2();

            const { unmount: unmount3 } = render(<TokenIcon symbol="Usdt" as any />);
            svg = document.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });
});
