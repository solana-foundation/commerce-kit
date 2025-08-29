import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    target: 'es2020'
  },
  define: {
    'import.meta.vitest': undefined,
  },
  test: {
    // Environment configuration
    environment: 'node', // Use Node environment for server-side testing
    
    // Setup files for React
    setupFiles: [],
    
    // Test timeout configuration
    testTimeout: 10000, // 10 seconds for read operations
    hookTimeout: 5000,  // 5 seconds for setup/teardown
    
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
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },
    
    // File patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/', 'dist/', '.git/'],
    
    // Reporter configuration
    reporters: ['verbose', 'json'],
    
    // Retry configuration for flaky network tests
    retry: 1,
  }
})