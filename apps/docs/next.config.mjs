/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@solana-commerce/connector-kit',
    '@solana-commerce/ui-primitives',
    '@solana-commerce/react-sdk',
    '@solana-commerce/headless-sdk'
  ],
  experimental: {
    optimizePackageImports: ['@solana-commerce/connector-kit', '@solana-commerce/headless-sdk', '@solana-commerce/react-sdk', '@solana-commerce/ui-primitives'],
  },
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Ensure React is properly resolved
      'react': 'react',
      'react-dom': 'react-dom',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  // Disable static generation for error pages to fix SSR context issue
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
};

export default config;
