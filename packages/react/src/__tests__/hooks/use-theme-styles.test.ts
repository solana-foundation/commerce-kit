import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeStyles } from '../../hooks/use-theme-styles';
import type { ThemeConfig } from '../../types';

// Mock the utils functions
vi.mock('../../utils', () => ({
    getBorderRadius: vi.fn(),
    getButtonShadow: vi.fn(),
    getButtonBorder: vi.fn(),
    getRadius: vi.fn(),
}));

// Import the mocked functions
import * as utils from '../../utils';

describe('useThemeStyles', () => {
    const baseTheme: Required<ThemeConfig> = {
        primaryColor: '#9945FF',
        secondaryColor: '#14F195',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        borderRadius: 'lg',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        buttonShadow: 'md',
        buttonBorder: 'black-10',
    };

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Set up default mock implementations
        vi.mocked(utils.getBorderRadius).mockReturnValue('16px');
        vi.mocked(utils.getButtonShadow).mockReturnValue('0 4px 6px rgba(0,0,0,0.1)');
        vi.mocked(utils.getButtonBorder).mockReturnValue('1.5px solid rgba(0,0,0,0.1)');
        vi.mocked(utils.getRadius).mockReturnValue('16px');
    });

    describe('Base Styles Generation', () => {
        it('should generate base CSS custom properties', () => {
            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme }));

            const styles = result.current;

            expect(styles).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--secondary-color': '#14F195',
                    '--background-color': '#ffffff',
                    '--text-color': '#111827',
                    '--text-color-60': '#11182760',
                    '--text-color-70': '#11182770',
                    '--font-family': 'system-ui, -apple-system, sans-serif',
                }),
            );

            expect(vi.mocked(utils.getBorderRadius)).toHaveBeenCalledWith('lg');
        });

        it('should handle different color formats', () => {
            const themeWithDifferentColors: Required<ThemeConfig> = {
                ...baseTheme,
                primaryColor: 'rgb(153, 69, 255)',
                textColor: 'hsl(220, 13%, 9%)',
            };

            const { result } = renderHook(() => useThemeStyles({ theme: themeWithDifferentColors }));

            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': 'rgb(153, 69, 255)',
                    '--text-color': 'hsl(220, 13%, 9%)',
                    '--text-color-60': 'hsl(220, 13%, 9%)60',
                    '--text-color-70': 'hsl(220, 13%, 9%)70',
                }),
            );
        });
    });

    describe('Button Variant', () => {
        it('should generate button-specific styles', () => {
            vi.mocked(utils.getRadius).mockReturnValue('16px');
            vi.mocked(utils.getButtonBorder).mockReturnValue('1.5px solid rgba(0,0,0,0.1)');
            vi.mocked(utils.getButtonShadow).mockReturnValue('0 4px 6px rgba(0,0,0,0.1)');

            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme, variant: 'button' }));

            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--border-radius': '16px',
                    '--button-border': '1.5px solid rgba(0,0,0,0.1)',
                    '--button-shadow': '0 4px 6px rgba(0,0,0,0.1)',
                }),
            );

            expect(vi.mocked(utils.getRadius)).toHaveBeenCalledWith('button', 'lg');
            expect(vi.mocked(utils.getButtonBorder)).toHaveBeenCalledWith(baseTheme);
            expect(vi.mocked(utils.getButtonShadow)).toHaveBeenCalledWith('md');
        });
    });

    describe('Payment Method Variant', () => {
        it('should generate payment method-specific styles', () => {
            vi.mocked(utils.getRadius).mockReturnValue('16px');

            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme, variant: 'payment-method' }));

            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--border-radius': '16px',
                    '--primary-color-10': '#9945FF10',
                    '--primary-color-60': '#9945FF60',
                }),
            );

            expect(vi.mocked(utils.getRadius)).toHaveBeenCalledWith('payment', 'lg');
        });
    });

    describe('Amount Variant', () => {
        it('should generate amount-specific styles', () => {
            vi.mocked(utils.getRadius).mockReturnValue('16px');

            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme, variant: 'amount' }));

            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--border-radius': '16px',
                    '--primary-color-10': '#9945FF10',
                    '--primary-color-60': '#9945FF60',
                }),
            );

            expect(vi.mocked(utils.getRadius)).toHaveBeenCalledWith('preset', 'lg');
        });
    });

    describe('Modal Variant', () => {
        it('should generate modal-specific styles', () => {
            vi.mocked(utils.getRadius).mockReturnValue('20px');

            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme, variant: 'modal' }));

            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--modal-border-radius': '20px',
                }),
            );

            expect(vi.mocked(utils.getRadius)).toHaveBeenCalledWith('modal', 'lg');
        });
    });

    describe('Dropdown Variant', () => {
        it('should generate dropdown-specific styles', () => {
            vi.mocked(utils.getRadius).mockReturnValue('8px');

            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme, variant: 'dropdown' }));

            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--dropdown-radius': '8px',
                }),
            );

            expect(vi.mocked(utils.getRadius)).toHaveBeenCalledWith('dropdown', 'lg');
        });
    });

    describe('Input Variant', () => {
        it('should generate input-specific styles (default fallback)', () => {
            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme, variant: 'input' }));

            // Should fallback to base styles only
            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--secondary-color': '#14F195',
                    '--background-color': '#ffffff',
                    '--text-color': '#111827',
                }),
            );

            // Should not have variant-specific styles
            expect(result.current).not.toHaveProperty('--button-shadow');
            expect(result.current).not.toHaveProperty('--primary-color-10');
        });
    });

    describe('Memoization', () => {
        it('should memoize styles and only recalculate when theme or variant changes', () => {
            const { result, rerender } = renderHook(({ theme, variant }) => useThemeStyles({ theme, variant }), {
                initialProps: { theme: baseTheme, variant: 'button' as const },
            });

            const initialStyles = result.current;

            // Re-render with same props
            rerender({ theme: baseTheme, variant: 'button' });

            // Should return the same object (memoized)
            expect(result.current).toBe(initialStyles);

            // Re-render with different variant
            rerender({ theme: baseTheme, variant: 'modal' });

            // Should return new object
            expect(result.current).not.toBe(initialStyles);
        });

        it('should recalculate when theme properties change', () => {
            const { result, rerender } = renderHook(({ theme }) => useThemeStyles({ theme }), {
                initialProps: { theme: baseTheme },
            });

            const initialStyles = result.current;

            const modifiedTheme = { ...baseTheme, primaryColor: '#FF6B35' };
            rerender({ theme: modifiedTheme });

            expect(result.current).not.toBe(initialStyles);
            expect(result.current['--primary-color']).toBe('#FF6B35');
        });
    });

    describe('Border Radius Handling', () => {
        it('should handle different border radius values', () => {
            const testCases: Array<{ radius: ThemeConfig['borderRadius']; expected: string }> = [
                { radius: 'none', expected: '0px' },
                { radius: 'sm', expected: '12px' },
                { radius: 'md', expected: '16px' },
                { radius: 'lg', expected: '20px' },
                { radius: 'xl', expected: '24px' },
                { radius: 'full', expected: '2rem' },
            ];

            testCases.forEach(({ radius, expected }) => {
                vi.mocked(utils.getRadius).mockReturnValue(expected);

                const themeWithRadius = { ...baseTheme, borderRadius: radius };
                const { result } = renderHook(() => useThemeStyles({ theme: themeWithRadius, variant: 'button' }));

                expect(vi.mocked(utils.getRadius)).toHaveBeenCalledWith('button', radius);
                expect(result.current['--border-radius']).toBe(expected);
            });
        });
    });

    describe('Shadow Handling', () => {
        it('should handle different button shadow values', () => {
            const testCases: Array<{ shadow: ThemeConfig['buttonShadow']; expected: string }> = [
                { shadow: 'none', expected: 'none' },
                { shadow: 'sm', expected: '0 1px 2px rgba(0,0,0,0.06)' },
                { shadow: 'md', expected: '0 4px 6px rgba(0,0,0,0.1)' },
                { shadow: 'lg', expected: '0 10px 15px rgba(0,0,0,0.15)' },
                { shadow: 'xl', expected: '0 20px 25px rgba(0,0,0,0.2)' },
            ];

            testCases.forEach(({ shadow, expected }) => {
                vi.mocked(utils.getButtonShadow).mockReturnValue(expected);

                const themeWithShadow = { ...baseTheme, buttonShadow: shadow };
                const { result } = renderHook(() => useThemeStyles({ theme: themeWithShadow, variant: 'button' }));

                expect(vi.mocked(utils.getButtonShadow)).toHaveBeenCalledWith(shadow);
                expect(result.current['--button-shadow']).toBe(expected);
            });
        });
    });

    describe('Return Type', () => {
        it('should return React.CSSProperties compatible object', () => {
            const { result } = renderHook(() => useThemeStyles({ theme: baseTheme }));

            const styles = result.current;

            // Should be a plain object
            expect(typeof styles).toBe('object');
            expect(styles).not.toBe(null);

            // Should have CSS custom property keys (starting with --)
            const keys = Object.keys(styles);
            expect(keys.length).toBeGreaterThan(0);
            expect(keys.every(key => key.startsWith('--'))).toBe(true);

            // Should have string values
            const values = Object.values(styles);
            expect(values.every(value => typeof value === 'string')).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty theme gracefully', () => {
            const emptyTheme = {} as Required<ThemeConfig>;

            const { result } = renderHook(() => useThemeStyles({ theme: emptyTheme }));

            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': undefined,
                    '--secondary-color': undefined,
                    '--background-color': undefined,
                    '--text-color': undefined,
                }),
            );
        });

        it('should handle null/undefined values in theme', () => {
            const themeWithNulls = {
                ...baseTheme,
                primaryColor: null as any,
                textColor: undefined as any,
            };

            const { result } = renderHook(() => useThemeStyles({ theme: themeWithNulls }));

            expect(result.current['--primary-color']).toBe(null);
            expect(result.current['--text-color']).toBe(undefined);
            expect(result.current['--text-color-60']).toBe('undefined60');
            expect(result.current['--text-color-70']).toBe('undefined70');
        });

        it('should handle invalid variant gracefully', () => {
            const { result } = renderHook(() =>
                useThemeStyles({
                    theme: baseTheme,
                    variant: 'invalid-variant' as any,
                }),
            );

            // Should fallback to base styles
            expect(result.current).toEqual(
                expect.objectContaining({
                    '--primary-color': '#9945FF',
                    '--secondary-color': '#14F195',
                }),
            );

            // Should not have variant-specific styles
            expect(result.current).not.toHaveProperty('--button-shadow');
        });
    });
});
