import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: !options.watch, // Disable DTS in watch mode to avoid timing issues
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', '@solana-commerce/ui-primitives'],
}))