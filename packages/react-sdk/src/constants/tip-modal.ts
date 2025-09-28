/**
 * Tip Modal Constants
 * Static data and configuration for the tip modal component
 */

import React from 'react';
import type { PaymentMethod } from '../types';
import { WalletIcon, SolanaPayIcon } from '../components/icons';

// Currency Decimal Constants
export const CURRENCY_DECIMALS = {
    USDC: 6,
    USDC_DEVNET: 6,
    USDT: 6,
    USDT_DEVNET: 6,
    SOL: 9,
    SOL_DEVNET: 9,
} as const;

// Static Data
export const PRESET_AMOUNTS = [5, 10, 20, 50] as const;

export const ALL_CURRENCIES = [
    { value: 'USDC', label: 'USD Coin', symbol: 'USDC' },
    { value: 'SOL', label: 'Solana', symbol: 'SOL' },
    { value: 'USDT', label: 'Tether USD', symbol: 'USDT' },
    { value: 'USDC_DEVNET', label: 'USD Coin Devnet', symbol: 'USDC_DEVNET' },
    { value: 'SOL_DEVNET', label: 'Solana Devnet', symbol: 'SOL_DEVNET' },
    { value: 'USDT_DEVNET', label: 'Tether USD Devnet', symbol: 'USDT_DEVNET' },
] as const;

// Payment method configuration
export const PAYMENT_METHODS: Array<{
    value: PaymentMethod;
    label: string;
    description: string;
    icon: React.ReactNode;
}> = [
    { value: 'qr', label: 'Pay', description: 'Scan a QR code', icon: React.createElement(SolanaPayIcon) },
    { value: 'wallet', label: 'Wallet', description: 'Connect your wallet', icon: React.createElement(WalletIcon) },
];

// Animation styles
export const ANIMATION_STYLES = `s
@keyframes sc-tip-modal-slide-up {
  0% { transform: translateY(16px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.sc-tip-modal-anim {
  transition: height 500ms cubic-bezier(0.4, 0, 0.2, 1) !important;
}

@media (prefers-reduced-motion: reduce) {
  .sc-tip-modal-anim { 
    animation: none !important;
    transition: none !important;
  }
}
`;
