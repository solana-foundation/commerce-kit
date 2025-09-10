import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    target: 'es2020'
  },
  test: {
    environment: 'happy-dom', // For React components
    globals: true,
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules/', 'dist/', '.git/'],
    testTimeout: 10000,
    hookTimeout: 5000,
    teardownTimeout: 3000,
    reporters: ['verbose'],
  }
})
