'use client';

import dynamic from 'next/dynamic';
import { SolanaCommerceSDK } from '@solana-commerce/react-sdk';

// Create a client-only version to avoid SSR issues
const ClientOnlyCommerceSDK = dynamic(
  () => Promise.resolve(SolanaCommerceSDK),
  { 
    ssr: false,
    loading: () => null
  }
);

export function FloatingCommerceButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <ClientOnlyCommerceSDK
        config={{
          mode: 'tip',
          position: 'overlay',
          merchant: {
            name: 'Hackweek Store',
            wallet: 'BQWWFhzBdw2vKKBUX17NHeFbCoFQHfRARpdztPE2tDJ',
            description: 'Experience Solana Commerce SDK'
          },
          theme: {
            primaryColor: '#000',
            secondaryColor: '#000000',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            borderRadius: 'full',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          },
          products: [],
          allowedMints: ["USDC", "USDT", "USDC_DEVNET", "SOL_DEVNET", "USDT_DEVNET"],
          network: 'devnet',
          showQR: true,
          enableWalletConnect: true,
          showProductDetails: false,
          showMerchantInfo: true
        }}
        onPayment={(amount, currency, products) => {
          console.log('Payment:', { amount, currency, products });
        }}
        onPaymentSuccess={(signature) => {
          console.log('Payment successful:', { signature });
        }}
        onPaymentError={(error) => {
          console.error('Payment failed:', error);
        }}
        onCancel={() => {
          console.log('Modal closed');
        }}
      />
    </div>
  );
}