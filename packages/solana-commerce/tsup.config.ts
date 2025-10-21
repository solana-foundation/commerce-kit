import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    // External all workspace packages to avoid bundling duplicates
    external: [
        '@solana-commerce/connector',
        '@solana-commerce/headless',
        '@solana-commerce/react',
        '@solana-commerce/sdk',
        '@solana-commerce/solana-pay',
        'react',
        'react-dom',
    ],
});
