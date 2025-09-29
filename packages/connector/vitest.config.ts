import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        target: 'es2020',
    },
    test: {
        globals: true,
        include: ['**/*.{test,spec}.{js,ts,tsx}'],
        exclude: ['node_modules/', 'dist/', '.git/', '**/@testing-library/**'],
        testTimeout: 10000,
        hookTimeout: 5000,
        teardownTimeout: 3000,
        reporters: ['verbose'],
    },
});
