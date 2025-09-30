'use client';

import dynamic from 'next/dynamic';
import { PaymentButton, type SolanaCommerceConfig } from '@solana-commerce/react';
import { OrderItem } from '@solana-commerce/headless';

// Create a client-only version to avoid SSR issues
const ClientOnlyCommerceSDK = dynamic(
  () => Promise.resolve(PaymentButton),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

interface SolanaCommerceClientProps {
  config: SolanaCommerceConfig;
  variant?: 'default' | 'icon-only';
  onPayment?: (amount: number, currency: string, products?: readonly OrderItem[]) => void;
  onPaymentStart?: () => void;
  onPaymentSuccess?: (signature: string) => void;
  onPaymentError?: (error: Error) => void;
}

export function SolanaCommerceClient(props: SolanaCommerceClientProps) {
  return <ClientOnlyCommerceSDK {...props} />;
} 