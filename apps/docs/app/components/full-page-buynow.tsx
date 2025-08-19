'use client';

import { SolanaCommerceSDK } from '@solana-commerce/react-sdk';

interface FullPageBuyNowProps {
  rpcUrl?: string;
}

export function FullPageBuyNow({ rpcUrl }: FullPageBuyNowProps = {}) {
  return (
    <SolanaCommerceSDK
    config={{
      rpcUrl,
      mode: 'buyNow',
      position: 'inline',
      merchant: {
        name: 'Demo Store',
        wallet: 'BQWWFhzBdw2vKKBUX17NHeFbCoFQHfRARpdztPE2tDJ',
        description: 'Experience Solana Commerce SDK'
      },
      theme: {
        primaryColor: '#9945FF',
        secondaryColor: '#14F195',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: 'lg',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      },
      products: [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          currency: 'SOL'
        }
      ],
      allowedMints: ["SOL","USDC","USDT","USDC_DEVNET","SOL_DEVNET","USDT_DEVNET"],
      network: 'mainnet-beta',
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
    );
}

export function FullPageBuyNow2() {
  return (
    <SolanaCommerceSDK
    config={{
      mode: 'cart',
      position: 'overlay',
      merchant: {
        name: 'Demo Store',
        wallet: 'BQWWFhzBdw2vKKBUX17NHeFbCoFQHfRARpdztPE2tDJ',
        description: 'Experience Solana Commerce SDK'
      },
      theme: {
        primaryColor: '#9945FF',
        secondaryColor: '#14F195',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: 'lg',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      },
      products: [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          currency: 'SOL'
        }
      ],
      allowedMints: ["SOL","USDC","USDT","USDC_DEVNET","SOL_DEVNET","USDT_DEVNET"],
      network: 'mainnet-beta',
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
    );
}