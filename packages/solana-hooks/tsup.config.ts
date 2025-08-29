import { defineConfig } from 'tsup'
// Dynamically externalize all deps/peers to avoid bundling duplicates
// and keep consumer bundles lean.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Node resolution for JSON assert may vary across tools
import pkg from './package.json' assert { type: 'json' }

const externals = [
  ...Object.keys((pkg as any).dependencies || {}),
  ...Object.keys((pkg as any).peerDependencies || {}),
]

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react/index.ts',
    core: 'src/core.ts',
    client: 'src/client.ts',
    experimental: 'src/experimental/index.ts',
    programs: 'src/programs.ts',
    graphql: 'src/graphql.ts',
    subscriptions: 'src/subscriptions.ts'
  },
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to Solana Web3.js v2 Address type conflicts
  splitting: false,
  sourcemap: true,
  clean: true,
  external: externals,
  treeshake: {
    preset: 'recommended',
    moduleSideEffects: false
  },
  esbuildOptions: (options) => {
    // Better tree-shaking configuration
    options.treeShaking = true
    options.ignoreAnnotations = false
    // More aggressive tree-shaking
    options.pure = ['React.createElement', 'React.Fragment']
    options.dropLabels = ['DEV']
  }
})
