import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        target: 'es2020',
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
        exclude: [
            'node_modules/**',
            'dist/**',
            '.git/**',
            'src/iframe-app/**',
            '**/node_modules/**',
            '**/.turbo/**',
            '**/target/**',
        ],
        testTimeout: 10000,
        hookTimeout: 5000,
        teardownTimeout: 3000,
        reporters: ['verbose'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/*.spec.ts',
                '**/*.spec.tsx',
                'src/iframe-app/**',
                'src/styles/**',
                'src/types.ts',
            ],
        },
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
    },
});
