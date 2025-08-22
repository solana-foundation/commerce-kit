/**
 * Tip Modal Constants
 * Static data and configuration for the tip modal component
 */

import React from 'react';
import type { Currency, PaymentMethod } from '../types';

// Static Icons - JSX Elements
export const WALLET_ICON = React.createElement(
  'svg',
  { width: "21", height: "16", viewBox: "0 0 21 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement('path', {
    d: "M13.5 9.55556H13.5078M3 2.55556V13.4444C3 14.3036 3.69645 15 4.55556 15H15.4444C16.3036 15 17 14.3036 17 13.4444V5.66667C17 4.80756 16.3036 4.11111 15.4444 4.11111L4.55556 4.11111C3.69645 4.11111 3 3.41466 3 2.55556ZM3 2.55556C3 1.69645 3.69645 1 4.55556 1H13.8889M13.8889 9.55556C13.8889 9.77033 13.7148 9.94444 13.5 9.94444C13.2852 9.94444 13.1111 9.77033 13.1111 9.55556C13.1111 9.34078 13.2852 9.16667 13.5 9.16667C13.7148 9.16667 13.8889 9.34078 13.8889 9.55556Z",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })
);

export const SOLANA_PAY_ICON = React.createElement(
  'svg',
  { width: "21", height: "16", viewBox: "0 0 21 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement('path', {
    d: "M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z",
    fill: "currentColor"
  }),
  React.createElement('path', {
    d: "M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z",
    fill: "currentColor"
  }),
  React.createElement('path', {
    d: "M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z",
    fill: "currentColor"
  })
);

export const BACK_ARROW_ICON = React.createElement(
  'svg',
  { width: "16", height: "17", viewBox: "0 0 16 17", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement('path', {
    d: "M15 8.5H1M1 8.5L8 15.5M1 8.5L8 1.5",
    stroke: "currentColor",
    strokeOpacity: "0.72",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })
);

export const CLOSE_ICON = React.createElement(
  'svg',
  { width: "14", height: "15", viewBox: "0 0 14 15", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
  React.createElement('path', {
    d: "M13.7071 2.20711C14.0976 1.81658 14.0976 1.18342 13.7071 0.792893C13.3166 0.402369 12.6834 0.402369 12.2929 0.792893L7 6.08579L1.70711 0.792893C1.31658 0.402369 0.683417 0.402369 0.292893 0.792893C-0.0976311 1.18342 -0.0976311 1.81658 0.292893 2.20711L5.58579 7.5L0.292893 12.7929C-0.0976311 13.1834 -0.0976311 13.8166 0.292893 14.2071C0.683417 14.5976 1.31658 14.5976 1.70711 14.2071L7 8.91421L12.2929 14.2071C12.6834 14.5976 13.3166 14.5976 13.7071 14.2071C14.0976 13.8166 14.0976 13.1834 13.7071 12.7929L8.41421 7.5L13.7071 2.20711Z",
    fill: "currentColor",
    fillOpacity: "0.72"
  })
);

export const CHEVRON_DOWN_ICON = React.createElement(
  'svg',
  { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none" },
  React.createElement('path', {
    d: "M3 4.5L6 7.5L9 4.5",
    stroke: "black",
    strokeOpacity: "0.72",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })
);
export const CHECK_ICON = React.createElement(
  'svg',
  { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" },
  React.createElement('path', {
    d: "M13.5 4.5L6 12L2.5 8.5",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })
);

// Static Data
export const PRESET_AMOUNTS = [1, 5, 15, 25, 50] as const;

export const ALL_CURRENCIES = [
  { value: 'USDC', label: 'USD Coin', symbol: 'USDC' },
  { value: 'SOL', label: 'Solana', symbol: 'SOL' },
  { value: 'USDT', label: 'Tether USD', symbol: 'USDT' },
  { value: 'USDC_DEVNET', label: 'USD Coin Devnet', symbol: 'USDC_DEVNET' },
  { value: 'SOL_DEVNET', label: 'Solana Devnet', symbol: 'SOL_DEVNET' },
  { value: 'USDT_DEVNET', label: 'Tether USD Devnet', symbol: 'USDT_DEVNET' }
] as const;

// Payment method configuration
export const PAYMENT_METHODS: Array<{ 
  value: PaymentMethod; 
  label: string; 
  description: string; 
  icon: React.ReactNode 
}> = [
  { value: 'qr', label: 'Pay', description: 'Scan a QR code', icon: SOLANA_PAY_ICON },
  { value: 'wallet', label: 'Wallet', description: 'Connect your wallet', icon: WALLET_ICON }
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

// Utility function for clipboard
export const copyToClipboard = (text: string): Promise<void> => {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
