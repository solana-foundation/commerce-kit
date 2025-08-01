import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@solana-commerce/ui-primitives',
    '@solana-commerce/react-sdk',
    '@solana-commerce/headless-sdk'
  ],
  experimental: {
    optimizePackageImports: ['@solana-commerce/headless-sdk', '@solana-commerce/react-sdk', '@solana-commerce/ui-primitives'],
  },
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Ensure React is properly resolved
      'react': 'react',
      'react-dom': 'react-dom',
    },
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  // Disable static generation for error pages to fix SSR context issue
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
};

export default withMDX(config);
