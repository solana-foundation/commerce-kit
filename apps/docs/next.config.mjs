/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@solana-commerce/connector',
    '@solana-commerce/react',
    '@solana-commerce/headless'
  ],
  experimental: {
    optimizePackageImports: ['@solana-commerce/connector', '@solana-commerce/headless', '@solana-commerce/react'],
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
