import { describe, it, expect, vi } from 'vitest';
import {
    createQR,
    createQROptions,
    createStyledQRCode,
    createQRDataURL,
    createQRCanvas,
    type QROptions,
} from '../create-qr';

// Mock QRCode library
vi.mock('qrcode', () => ({
    default: {
        create: vi.fn(text => ({
            modules: {
                size: 21, // Standard QR code size
                get: vi.fn((row, col) => (row + col) % 2 === 0), // Mock pattern
            },
        })),
        toCanvas: vi.fn().mockResolvedValue(undefined),
    },
}));

describe('QR Code Generation', () => {
    const testURL = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1';

    describe('createQR', () => {
        it('should create QR code with default options', async () => {
            const result = await createQR(testURL);

            expect(typeof result).toBe('string');
            expect(result).toContain('<svg');
            expect(result).toContain('</svg>');
            expect(result).toContain('512'); // Default size
        });

        it('should create QR code with custom size', async () => {
            const result = await createQR(testURL, 256);

            expect(result).toContain('256');
        });

        it('should create QR code with custom colors', async () => {
            const result = await createQR(testURL, 512, 'blue', 'red');

            expect(result).toContain('blue'); // Background
            expect(result).toContain('red'); // Foreground
        });

        it('should handle URL object input', async () => {
            const url = new URL(testURL);
            const result = await createQR(url);

            expect(typeof result).toBe('string');
            expect(result).toContain('<svg');
        });
    });

    describe('createQROptions', () => {
        it('should create default options', () => {
            const options = createQROptions(testURL);

            expect(options).toMatchObject({
                width: 512,
                margin: 2,
                color: {
                    dark: 'black',
                    light: 'white',
                },
                errorCorrectionLevel: 'Q',
                dotStyle: 'rounded',
                cornerStyle: 'extra-rounded',
            });
        });

        it('should create options with custom parameters', () => {
            const options = createQROptions(testURL, 256, 'blue', 'red');

            expect(options).toMatchObject({
                width: 256,
                color: {
                    dark: 'red',
                    light: 'blue',
                },
            });
        });

        it('should handle URL object input', () => {
            const url = new URL(testURL);
            const options = createQROptions(url);

            expect(options.width).toBe(512);
        });
    });

    describe('createStyledQRCode', () => {
        describe('Basic Styling', () => {
            it('should create SVG with default style', async () => {
                const options: QROptions = {
                    width: 512,
                    margin: 2,
                    color: { dark: 'black', light: 'white' },
                    errorCorrectionLevel: 'Q',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg width="512" height="512"');
                expect(result).toContain('fill="white"'); // Background
                expect(result).toContain('fill="black"'); // Foreground
            });

            it('should apply custom colors', async () => {
                const options: QROptions = {
                    width: 256,
                    color: { dark: '#ff0000', light: '#00ff00' },
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('fill="#00ff00"'); // Background
                expect(result).toContain('fill="#ff0000"'); // Foreground
            });

            it('should apply custom margin', async () => {
                const options: QROptions = {
                    width: 512,
                    margin: 10,
                };

                const result = await createStyledQRCode(testURL, options);

                // Margin affects positioning - exact values depend on module calculation
                expect(result).toContain('<svg');
            });
        });

        describe('Corner Styles', () => {
            it('should apply square corners', async () => {
                const options: QROptions = {
                    width: 512,
                    cornerStyle: 'square',
                };

                const result = await createStyledQRCode(testURL, options);

                // Square corners should have rx="0"
                expect(result).toContain('rx="0"');
            });

            it('should apply rounded corners', async () => {
                const options: QROptions = {
                    width: 512,
                    cornerStyle: 'rounded',
                };

                const result = await createStyledQRCode(testURL, options);

                // Should contain rounded corners
                expect(result).toContain('<svg');
            });

            it('should apply extra-rounded corners', async () => {
                const options: QROptions = {
                    width: 512,
                    cornerStyle: 'extra-rounded',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg');
            });

            it('should apply full-rounded corners', async () => {
                const options: QROptions = {
                    width: 512,
                    cornerStyle: 'full-rounded',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg');
            });

            it('should apply maximum-rounded corners', async () => {
                const options: QROptions = {
                    width: 512,
                    cornerStyle: 'maximum-rounded',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg');
            });
        });

        describe('Dot Styles', () => {
            it('should apply square dots', async () => {
                const options: QROptions = {
                    width: 512,
                    dotStyle: 'square',
                };

                const result = await createStyledQRCode(testURL, options);

                // Square dots should use <rect> without radius
                expect(result).toContain('<rect');
            });

            it('should apply rounded dots', async () => {
                const options: QROptions = {
                    width: 512,
                    dotStyle: 'rounded',
                };

                const result = await createStyledQRCode(testURL, options);

                // Rounded dots should have radius
                expect(result).toContain('<rect');
            });

            it('should apply circular dots', async () => {
                const options: QROptions = {
                    width: 512,
                    dotStyle: 'dots',
                };

                const result = await createStyledQRCode(testURL, options);

                // Circular dots should use <circle>
                expect(result).toContain('<circle');
            });
        });

        describe('Logo Integration', () => {
            it('should embed logo when provided', async () => {
                const options: QROptions = {
                    width: 512,
                    logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                    logoSize: 100,
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<image');
                expect(result).toContain('width="100" height="100"');
                expect(result).toContain('href="data:image/png;base64,');
            });

            it('should add logo background when specified', async () => {
                const options: QROptions = {
                    width: 512,
                    logo: 'data:image/png;base64,test',
                    logoSize: 80,
                    logoBackgroundColor: 'white',
                    logoMargin: 10,
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<image');
                expect(result).toContain('fill="white"'); // Background
                expect(result).toContain('width="80" height="80"'); // Logo size
            });

            it('should use default logo size when not specified', async () => {
                const options: QROptions = {
                    width: 500,
                    logo: 'data:image/png;base64,test',
                };

                const result = await createStyledQRCode(testURL, options);

                // Default logo size should be 20% of QR size (500 * 0.2 = 100)
                expect(result).toContain('<image');
                expect(result).toContain('width="100" height="100"');
            });
        });

        describe('Error Correction Levels', () => {
            it('should apply Low error correction', async () => {
                const options: QROptions = {
                    errorCorrectionLevel: 'L',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg');
            });

            it('should apply Medium error correction', async () => {
                const options: QROptions = {
                    errorCorrectionLevel: 'M',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg');
            });

            it('should apply Quartile error correction', async () => {
                const options: QROptions = {
                    errorCorrectionLevel: 'Q',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg');
            });

            it('should apply High error correction', async () => {
                const options: QROptions = {
                    errorCorrectionLevel: 'H',
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg');
            });
        });

        describe('Complex Configurations', () => {
            it('should handle complex styling with all options', async () => {
                const options: QROptions = {
                    width: 800,
                    margin: 5,
                    color: { dark: '#1a1a1a', light: '#f0f0f0' },
                    errorCorrectionLevel: 'H',
                    dotStyle: 'dots',
                    cornerStyle: 'full-rounded',
                    logo: 'data:image/png;base64,test',
                    logoSize: 120,
                    logoBackgroundColor: '#ffffff',
                    logoMargin: 15,
                };

                const result = await createStyledQRCode(testURL, options);

                expect(result).toContain('<svg width="800" height="800"');
                expect(result).toContain('fill="#f0f0f0"'); // Background
                expect(result).toContain('fill="#1a1a1a"'); // Foreground
                expect(result).toContain('<circle'); // Dot style
                expect(result).toContain('<image'); // Logo
                expect(result).toContain('width="120" height="120"'); // Logo size
            });
        });
    });

    describe('createQRDataURL', () => {
        it('should create data URL from SVG', async () => {
            const options: QROptions = {
                width: 256,
                color: { dark: 'black', light: 'white' },
            };

            const result = await createQRDataURL(testURL, options);

            expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

            // Decode and verify SVG content
            const base64Data = result.split(',')[1];
            const svgContent = Buffer.from(base64Data, 'base64').toString();
            expect(svgContent).toContain('<svg');
            expect(svgContent).toContain('256');
        });

        it('should create data URL with complex styling', async () => {
            const options: QROptions = {
                width: 400,
                color: { dark: '#ff6b35', light: '#f7f3e9' },
                dotStyle: 'rounded',
                cornerStyle: 'extra-rounded',
            };

            const result = await createQRDataURL(testURL, options);

            expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

            const base64Data = result.split(',')[1];
            const svgContent = Buffer.from(base64Data, 'base64').toString();
            expect(svgContent).toContain('#ff6b35');
            expect(svgContent).toContain('#f7f3e9');
        });
    });

    describe('createQRCanvas', () => {
        it('should render QR to canvas', async () => {
            // Mock canvas element
            const mockCanvas = {
                getContext: vi.fn(() => ({})),
            } as unknown as HTMLCanvasElement;

            const options: QROptions = {
                width: 512,
                color: { dark: 'black', light: 'white' },
            };

            // Should not throw
            await expect(createQRCanvas(mockCanvas, testURL, options)).resolves.toBeUndefined();

            // Verify QRCode.toCanvas was called
            const QRCode = await import('qrcode');
            expect(QRCode.default.toCanvas).toHaveBeenCalledWith(mockCanvas, testURL, {
                width: 512,
                margin: undefined,
                color: { dark: 'black', light: 'white' },
                errorCorrectionLevel: undefined,
            });
        });
    });

    describe('Input Validation', () => {
        it('should handle empty URL', async () => {
            const result = await createQR('');
            expect(result).toContain('<svg');
        });

        it('should handle very long URLs', async () => {
            const longUrl = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?' + 'x'.repeat(1000);
            const result = await createQR(longUrl);
            expect(result).toContain('<svg');
        });

        it('should handle special characters in URL', async () => {
            const specialUrl =
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?message=Hello%20World%21%20%40%23%24%25';
            const result = await createQR(specialUrl);
            expect(result).toContain('<svg');
        });

        it('should handle minimal options', async () => {
            const options: QROptions = {};
            const result = await createStyledQRCode(testURL, options);
            expect(result).toContain('<svg');
        });

        it('should handle invalid colors gracefully', async () => {
            const options: QROptions = {
                color: { dark: '', light: '' },
            };
            const result = await createStyledQRCode(testURL, options);
            expect(result).toContain('<svg');
        });
    });

    describe('Performance', () => {
        it('should handle large QR codes', async () => {
            const options: QROptions = {
                width: 2048,
                errorCorrectionLevel: 'H',
            };

            const startTime = Date.now();
            const result = await createStyledQRCode(testURL, options);
            const endTime = Date.now();

            expect(result).toContain('<svg width="2048"');
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle multiple QR codes concurrently', async () => {
            const urls = [
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1',
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=2',
                'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=3',
            ];

            const promises = urls.map(url => createQR(url, 256));
            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result).toContain('<svg');
                expect(result).toContain('256');
            });
        });
    });

    describe('SVG Structure', () => {
        it('should produce valid SVG structure', async () => {
            const options: QROptions = {
                width: 512,
                color: { dark: 'black', light: 'white' },
                dotStyle: 'rounded',
                cornerStyle: 'rounded',
            };

            const result = await createStyledQRCode(testURL, options);

            // Check basic SVG structure
            expect(result).toMatch(/^<svg/);
            expect(result).toMatch(/<\/svg>$/);
            expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
            expect(result).toContain('viewBox="0 0 512 512"');

            // Check finder patterns (corner squares)
            const finderPatternCount = (result.match(/<rect.*?fill="black"/g) || []).length;
            expect(finderPatternCount).toBeGreaterThan(0);
        });

        it('should include proper SVG attributes', async () => {
            const result = await createStyledQRCode(testURL, {
                width: 300,
                color: { dark: '#333', light: '#fff' },
            });

            expect(result).toContain('width="300"');
            expect(result).toContain('height="300"');
            expect(result).toContain('viewBox="0 0 300 300"');
        });
    });
});
