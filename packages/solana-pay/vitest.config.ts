import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        target: 'es2020',
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['**/*.{test,spec}.{js,ts}'],
        exclude: ['node_modules/', 'dist/', '.git/'],
        testTimeout: 10000,
        hookTimeout: 5000,
        teardownTimeout: 3000,
        reporters: ['verbose'],
    },
});
