'use client';

import { PaymentButton } from '@solana-commerce/react-sdk';
// Note: OrderItem removed for tip flow MVP

export function FloatingCommerceButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <PaymentButton
        config={{
          rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
          mode: 'tip',
          position: 'overlay',
          merchant: {
            name: 'Hackweek Store',
            wallet: 'A7Xmq3qqt4uvw3GELHw9HHNFbwZzHDJNtmk6fe2p5b5s',
            description: 'Experience the Solana Commerce SDK'
          },
          theme: {
            primaryColor: '#6366F1',
            secondaryColor: '#2c5ae6',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            borderRadius: 'full',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          },

          allowedMints: ["USDC", "USDT", "SOL"],
          network: 'mainnet-beta',
          showQR: true,
          enableWalletConnect: true,

          showMerchantInfo: true,
        }}
        // variant="icon-only"
        onPayment={(amount: number, currency: string) => {
          console.log('Payment:', { amount, currency });
        }}
        onPaymentSuccess={(signature: string) => {
          console.log('Payment successful:', { signature });
        }}
        onPaymentError={(error: Error) => {
          console.error('Payment failed:', error);
        }}
        onCancel={() => {
          console.log('Modal closed');
        }}
      />
    </div>
  );
}