import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        target: 'es2020',
    },
    define: {
        'import.meta.vitest': undefined,
    },
    test: {
        // Environment configuration
        environment: 'happy-dom', // Use happy-dom for React testing

        // Setup files for React
        setupFiles: ['./src/__tests__/setup.ts'],

        // Test timeout configuration
        testTimeout: 10000, // 10 seconds for read operations
        hookTimeout: 5000, // 5 seconds for setup/teardown

        // Prevent hanging processes
        teardownTimeout: 3000,

        // Ensure unhandled errors are properly surfaced
        dangerouslyIgnoreUnhandledErrors: false,

        // Global setup
        globals: true,

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
        },

        // File patterns - only include our src tests
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules/**', 'dist/**', '.git/**', '**/node_modules/**'],

        // Reporter configuration
        reporters: ['verbose', 'json'],

        // Retry configuration for flaky network tests
        retry: 1,
    },
});
