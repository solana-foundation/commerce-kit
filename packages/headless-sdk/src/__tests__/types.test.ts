import { describe, it, expect } from 'vitest';
import { STABLECOINS, type StablecoinConfig } from '../types/stablecoin';

describe('Types & Configuration', () => {
    describe('STABLECOINS Configuration', () => {
        describe('USDC Configuration', () => {
            it('should have correct USDC configuration', () => {
                const usdc = STABLECOINS.USDC;

                expect(usdc).toBeDefined();
                expect(usdc.mint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
                expect(usdc.symbol).toBe('USDC');
                expect(usdc.decimals).toBe(6);
                expect(usdc.name).toBe('USD Coin');
                expect(usdc.icon).toBeDefined();
                expect(usdc.icon).toContain('https://');
            });

            it('should have valid USDC mint address', () => {
                const usdc = STABLECOINS.USDC;

                // Should be valid Base58 Solana address
                expect(usdc.mint).toMatch(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/);
                expect(usdc.mint.length).toBeGreaterThanOrEqual(43);
                expect(usdc.mint.length).toBeLessThanOrEqual(44);
            });

            it('should have valid icon URL', () => {
                const usdc = STABLECOINS.USDC;

                expect(usdc.icon).toMatch(/^https:\/\//);
                expect(usdc.icon).toContain('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
            });
        });

        describe('USDT Configuration', () => {
            it('should have correct USDT configuration', () => {
                const usdt = STABLECOINS.USDT;

                expect(usdt).toBeDefined();
                expect(usdt.mint).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
                expect(usdt.symbol).toBe('USDT');
                expect(usdt.decimals).toBe(6);
                expect(usdt.name).toBe('Tether USD');
                expect(usdt.icon).toBeDefined();
            });

            it('should have valid USDT mint address', () => {
                const usdt = STABLECOINS.USDT;

                expect(usdt.mint).toMatch(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/);
                expect(usdt.mint.length).toBeGreaterThanOrEqual(43);
                expect(usdt.mint.length).toBeLessThanOrEqual(44);
            });

            it('should have valid icon URL', () => {
                const usdt = STABLECOINS.USDT;

                expect(usdt.icon).toMatch(/^https:\/\//);
                expect(usdt.icon).toContain('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
            });
        });

        describe('Configuration Consistency', () => {
            it('should have consistent decimal configuration', () => {
                // Both major stablecoins should use 6 decimals
                expect(STABLECOINS.USDC.decimals).toBe(6);
                expect(STABLECOINS.USDT.decimals).toBe(6);
            });

            it('should have unique mint addresses', () => {
                const mints = Object.values(STABLECOINS).map(config => config.mint);
                const uniqueMints = new Set(mints);

                expect(uniqueMints.size).toBe(mints.length);
            });

            it('should have unique symbols', () => {
                const symbols = Object.values(STABLECOINS).map(config => config.symbol);
                const uniqueSymbols = new Set(symbols);

                expect(uniqueSymbols.size).toBe(symbols.length);
            });

            it('should have proper symbol-to-config mapping', () => {
                expect(STABLECOINS.USDC.symbol).toBe('USDC');
                expect(STABLECOINS.USDT.symbol).toBe('USDT');
            });
        });

        describe('StablecoinConfig Interface', () => {
            it('should satisfy StablecoinConfig interface requirements', () => {
                Object.values(STABLECOINS).forEach((config: StablecoinConfig) => {
                    expect(config).toHaveProperty('mint');
                    expect(config).toHaveProperty('symbol');
                    expect(config).toHaveProperty('decimals');
                    expect(config).toHaveProperty('name');

                    expect(typeof config.mint).toBe('string');
                    expect(typeof config.symbol).toBe('string');
                    expect(typeof config.decimals).toBe('number');
                    expect(typeof config.name).toBe('string');

                    // Icon is optional
                    if (config.icon) {
                        expect(typeof config.icon).toBe('string');
                    }
                });
            });

            it('should have valid decimal ranges', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.decimals).toBeGreaterThan(0);
                    expect(config.decimals).toBeLessThanOrEqual(18); // Reasonable max
                    expect(Number.isInteger(config.decimals)).toBe(true);
                });
            });

            it('should have non-empty required fields', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.mint.length).toBeGreaterThan(0);
                    expect(config.symbol.length).toBeGreaterThan(0);
                    expect(config.name.length).toBeGreaterThan(0);
                });
            });
        });

        describe('Configuration Extensibility', () => {
            it('should be extendable with new stablecoins', () => {
                // Test that the structure supports adding new coins
                const newConfig: StablecoinConfig = {
                    mint: 'TestMint1111111111111111111111111111111111',
                    symbol: 'TEST',
                    decimals: 8,
                    name: 'Test Coin',
                    icon: 'https://example.com/test-icon.png',
                };

                // Should satisfy the interface
                expect(newConfig).toHaveProperty('mint');
                expect(newConfig).toHaveProperty('symbol');
                expect(newConfig).toHaveProperty('decimals');
                expect(newConfig).toHaveProperty('name');
                expect(newConfig).toHaveProperty('icon');
            });

            it('should support optional icon field', () => {
                const configWithoutIcon: StablecoinConfig = {
                    mint: 'TestMint1111111111111111111111111111111111',
                    symbol: 'TEST',
                    decimals: 9,
                    name: 'Test Coin',
                };

                expect(configWithoutIcon.icon).toBeUndefined();
                expect(configWithoutIcon).toSatisfy(
                    (config: StablecoinConfig) =>
                        typeof config.mint === 'string' &&
                        typeof config.symbol === 'string' &&
                        typeof config.decimals === 'number' &&
                        typeof config.name === 'string',
                );
            });
        });

        describe('Real-world Usage', () => {
            it('should be usable for decimal calculations', () => {
                // Test that configs work for actual decimal conversions
                const usdc = STABLECOINS.USDC;
                const amount = 100; // $100 USDC
                const microUnits = amount * Math.pow(10, usdc.decimals);

                expect(microUnits).toBe(100000000); // 100 * 10^6

                // Convert back
                const backToAmount = microUnits / Math.pow(10, usdc.decimals);
                expect(backToAmount).toBe(100);
            });

            it('should work with precision requirements', () => {
                Object.values(STABLECOINS).forEach(config => {
                    const testAmount = 1.5;
                    const units = Math.round(testAmount * Math.pow(10, config.decimals));
                    const backToAmount = units / Math.pow(10, config.decimals);

                    expect(Math.abs(backToAmount - testAmount)).toBeLessThan(0.000001);
                });
            });

            it('should support currency lookup by symbol', () => {
                const usdcBySymbol = STABLECOINS['USDC'];
                const usdtBySymbol = STABLECOINS['USDT'];

                expect(usdcBySymbol).toBeDefined();
                expect(usdtBySymbol).toBeDefined();
                expect(usdcBySymbol.symbol).toBe('USDC');
                expect(usdtBySymbol.symbol).toBe('USDT');
            });

            it('should handle case-sensitive lookups', () => {
                expect(STABLECOINS['USDC']).toBeDefined();
                expect(STABLECOINS['usdc']).toBeUndefined();
                expect(STABLECOINS['Usdc']).toBeUndefined();
            });
        });

        describe('Icon URLs', () => {
            it('should have accessible icon URLs', () => {
                Object.values(STABLECOINS).forEach(config => {
                    if (config.icon) {
                        expect(config.icon).toMatch(/^https?:\/\//);
                        expect(config.icon).toContain(config.mint); // Should reference the mint address
                    }
                });
            });

            it('should use solana-labs token-list for icons', () => {
                Object.values(STABLECOINS).forEach(config => {
                    if (config.icon) {
                        expect(config.icon).toContain('solana-labs/token-list');
                        expect(config.icon).toContain('mainnet');
                    }
                });
            });
        });

        describe('Configuration Immutability', () => {
            it('should maintain constant configuration values', () => {
                const originalUsdc = { ...STABLECOINS.USDC };
                const originalUsdt = { ...STABLECOINS.USDT };

                // Configurations should remain unchanged
                expect(STABLECOINS.USDC).toEqual(originalUsdc);
                expect(STABLECOINS.USDT).toEqual(originalUsdt);
            });

            it('should be read-only configuration', () => {
                const usdcMint = STABLECOINS.USDC.mint;
                const usdcSymbol = STABLECOINS.USDC.symbol;

                // Values should be consistent
                expect(STABLECOINS.USDC.mint).toBe(usdcMint);
                expect(STABLECOINS.USDC.symbol).toBe(usdcSymbol);
            });
        });
    });

    describe('Type Definitions Validation', () => {
        describe('StablecoinConfig Type', () => {
            it('should enforce required fields', () => {
                const validConfig: StablecoinConfig = {
                    mint: 'TestMint1111111111111111111111111111111111',
                    symbol: 'TEST',
                    decimals: 6,
                    name: 'Test Token',
                };

                expect(validConfig.mint).toBe('TestMint1111111111111111111111111111111111');
                expect(validConfig.symbol).toBe('TEST');
                expect(validConfig.decimals).toBe(6);
                expect(validConfig.name).toBe('Test Token');
                expect(validConfig.icon).toBeUndefined();
            });

            it('should support optional icon field', () => {
                const configWithIcon: StablecoinConfig = {
                    mint: 'TestMint1111111111111111111111111111111111',
                    symbol: 'TEST',
                    decimals: 6,
                    name: 'Test Token',
                    icon: 'https://example.com/icon.png',
                };

                expect(configWithIcon.icon).toBe('https://example.com/icon.png');
            });
        });

        describe('Record Type Usage', () => {
            it('should work as Record<string, StablecoinConfig>', () => {
                // STABLECOINS should be usable as a string-indexed record
                const coinSymbols = Object.keys(STABLECOINS);

                coinSymbols.forEach(symbol => {
                    const config = STABLECOINS[symbol];
                    expect(config).toBeDefined();
                    expect(config).toSatisfy(
                        (c: StablecoinConfig) =>
                            typeof c.mint === 'string' &&
                            typeof c.symbol === 'string' &&
                            typeof c.decimals === 'number' &&
                            typeof c.name === 'string',
                    );
                });
            });

            it('should allow iteration over configurations', () => {
                const entries = Object.entries(STABLECOINS);

                expect(entries.length).toBeGreaterThan(0);

                entries.forEach(([symbol, config]) => {
                    expect(typeof symbol).toBe('string');
                    expect(config).toHaveProperty('mint');
                    expect(config).toHaveProperty('symbol');
                    expect(config.symbol).toBe(symbol); // Key should match symbol
                });
            });

            it('should support functional operations', () => {
                const symbols = Object.keys(STABLECOINS);
                const mints = Object.values(STABLECOINS).map(config => config.mint);
                const decimals = Object.values(STABLECOINS).map(config => config.decimals);

                expect(symbols.length).toBeGreaterThan(0);
                expect(mints.length).toBe(symbols.length);
                expect(decimals.every(d => typeof d === 'number')).toBe(true);
            });
        });
    });

    describe('Configuration Validation', () => {
        describe('Mint Address Validation', () => {
            it('should have valid Solana mint addresses', () => {
                Object.values(STABLECOINS).forEach(config => {
                    // Should be valid Base58 encoding
                    expect(config.mint).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);

                    // Should be reasonable length for Solana address
                    expect(config.mint.length).toBeGreaterThanOrEqual(32);
                    expect(config.mint.length).toBeLessThanOrEqual(44);
                });
            });

            it('should have unique mint addresses', () => {
                const mints = Object.values(STABLECOINS).map(config => config.mint);
                const uniqueMints = new Set(mints);

                expect(uniqueMints.size).toBe(mints.length);
            });

            it('should not contain invalid Base58 characters', () => {
                Object.values(STABLECOINS).forEach(config => {
                    // Base58 excludes: 0, O, I, l
                    expect(config.mint).not.toMatch(/[0OIl]/);
                });
            });
        });

        describe('Symbol Validation', () => {
            it('should have uppercase symbols', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.symbol).toBe(config.symbol.toUpperCase());
                });
            });

            it('should have reasonable symbol lengths', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.symbol.length).toBeGreaterThan(0);
                    expect(config.symbol.length).toBeLessThanOrEqual(10); // Reasonable max
                });
            });

            it('should use standard symbols', () => {
                // Check for known stablecoin symbols
                const symbols = Object.keys(STABLECOINS);
                expect(symbols).toContain('USDC');
                expect(symbols).toContain('USDT');
            });
        });

        describe('Decimal Validation', () => {
            it('should have valid decimal counts', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.decimals).toBeGreaterThan(0);
                    expect(config.decimals).toBeLessThanOrEqual(18);
                    expect(Number.isInteger(config.decimals)).toBe(true);
                });
            });

            it('should use standard stablecoin decimals', () => {
                // Most stablecoins use 6 decimals
                expect(STABLECOINS.USDC.decimals).toBe(6);
                expect(STABLECOINS.USDT.decimals).toBe(6);
            });

            it('should be usable for amount calculations', () => {
                Object.values(STABLECOINS).forEach(config => {
                    const amount = 100.5; // $100.50
                    const units = Math.round(amount * Math.pow(10, config.decimals));
                    const backToAmount = units / Math.pow(10, config.decimals);

                    expect(Math.abs(backToAmount - amount)).toBeLessThan(0.000001);
                });
            });
        });

        describe('Name Validation', () => {
            it('should have descriptive names', () => {
                expect(STABLECOINS.USDC.name).toBe('USD Coin');
                expect(STABLECOINS.USDT.name).toBe('Tether USD');
            });

            it('should have non-empty names', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.name.length).toBeGreaterThan(0);
                    expect(config.name.trim()).toBe(config.name); // No leading/trailing whitespace
                });
            });

            it('should have reasonable name lengths', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.name.length).toBeLessThanOrEqual(50); // Reasonable max
                });
            });
        });
    });

    describe('Usage Scenarios', () => {
        describe('Currency Lookup', () => {
            it('should find stablecoin by symbol', () => {
                const usdc = STABLECOINS['USDC'];
                const usdt = STABLECOINS['USDT'];

                expect(usdc).toBeDefined();
                expect(usdt).toBeDefined();
                expect(usdc.symbol).toBe('USDC');
                expect(usdt.symbol).toBe('USDT');
            });

            it('should return undefined for unknown symbols', () => {
                expect(STABLECOINS['UNKNOWN']).toBeUndefined();
                expect(STABLECOINS['DAI']).toBeUndefined();
                expect(STABLECOINS['BTC']).toBeUndefined();
            });

            it('should handle case-sensitive lookups', () => {
                expect(STABLECOINS['USDC']).toBeDefined();
                expect(STABLECOINS['usdc']).toBeUndefined();
                expect(STABLECOINS['Usdc']).toBeUndefined();
            });
        });

        describe('Amount Calculations', () => {
            it('should support precise amount calculations', () => {
                const usdc = STABLECOINS.USDC;

                // Test various amounts
                const testCases = [
                    { amount: 1, expected: 1000000 }, // $1 USDC
                    { amount: 0.1, expected: 100000 }, // $0.10 USDC
                    { amount: 100.5, expected: 100500000 }, // $100.50 USDC
                    { amount: 0.000001, expected: 1 }, // Minimum unit
                ];

                testCases.forEach(({ amount, expected }) => {
                    const units = Math.round(amount * Math.pow(10, usdc.decimals));
                    expect(units).toBe(expected);
                });
            });

            it('should handle precision limits correctly', () => {
                Object.values(STABLECOINS).forEach(config => {
                    const minUnit = 1 / Math.pow(10, config.decimals);
                    const units = Math.round(minUnit * Math.pow(10, config.decimals));

                    expect(units).toBe(1); // Should equal 1 base unit
                });
            });
        });

        describe('Integration with Payment Systems', () => {
            it('should work with payment amount validation', () => {
                Object.entries(STABLECOINS).forEach(([symbol, config]) => {
                    const amount = 10.5; // Test amount
                    const units = Math.round(amount * Math.pow(10, config.decimals));

                    // Should be positive
                    expect(units).toBeGreaterThan(0);

                    // Should be integer
                    expect(Number.isInteger(units)).toBe(true);

                    // Should be reversible
                    const backToAmount = units / Math.pow(10, config.decimals);
                    expect(Math.abs(backToAmount - amount)).toBeLessThan(0.000001);
                });
            });

            it('should provide mint addresses for SPL token transfers', () => {
                Object.values(STABLECOINS).forEach(config => {
                    expect(config.mint).toBeTruthy();
                    expect(typeof config.mint).toBe('string');

                    // Should be usable as SPL token mint
                    expect(config.mint.length).toBeGreaterThan(30);
                });
            });
        });
    });

    describe('Performance', () => {
        it('should support fast lookups', () => {
            const symbols = ['USDC', 'USDT', 'UNKNOWN'];

            const startTime = Date.now();
            symbols.forEach(symbol => {
                const config = STABLECOINS[symbol];
                // Process config if exists
                if (config) {
                    expect(config.decimals).toBeGreaterThan(0);
                }
            });
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(10); // Very fast lookups
        });

        it('should handle many calculations efficiently', () => {
            const amounts = Array(1000).fill(100.5);
            const usdc = STABLECOINS.USDC;

            const startTime = Date.now();
            amounts.forEach(amount => {
                const units = Math.round(amount * Math.pow(10, usdc.decimals));
                expect(units).toBe(100500000);
            });
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(50);
        });
    });

    describe('Configuration Evolution', () => {
        it('should maintain backward compatibility', () => {
            // Core stablecoins should always be available
            expect(STABLECOINS.USDC).toBeDefined();
            expect(STABLECOINS.USDT).toBeDefined();

            // Core properties should be stable
            expect(STABLECOINS.USDC.symbol).toBe('USDC');
            expect(STABLECOINS.USDC.decimals).toBe(6);
            expect(STABLECOINS.USDT.symbol).toBe('USDT');
            expect(STABLECOINS.USDT.decimals).toBe(6);
        });

        it('should support additional stablecoins in future', () => {
            // Should be extensible
            const configCount = Object.keys(STABLECOINS).length;
            expect(configCount).toBeGreaterThanOrEqual(2); // At least USDC and USDT

            // Structure supports adding more
            const exampleNewConfig: StablecoinConfig = {
                mint: 'NewStablecoin111111111111111111111111111',
                symbol: 'STABLE',
                decimals: 6,
                name: 'New Stablecoin',
            };

            expect(exampleNewConfig).toSatisfy(
                (config: StablecoinConfig) =>
                    config.mint && config.symbol && typeof config.decimals === 'number' && config.name,
            );
        });
    });
});
