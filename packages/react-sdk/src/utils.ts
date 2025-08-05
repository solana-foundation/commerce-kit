/**
 * Solana Commerce SDK - Utilities
 * Production-ready utilities, validation, and hooks
 */

import { useMemo } from 'react';
import type { ThemeConfig, BorderRadius, CommerceMode, MerchantConfig } from './types';
import { OrderItem } from '@solana-commerce/headless-sdk';

// Constants
export const BORDER_RADIUS_MAP = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem', 
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px'
} as const;

export const MODAL_BORDER_RADIUS_MAP = {
  ...BORDER_RADIUS_MAP,
  full: '1rem' // Cap modal radius for UX
} as const;

export const CONTAINER_BORDER_RADIUS_MAP = {
  ...BORDER_RADIUS_MAP,
  full: '0.75rem' // Cap container radius for UX - containers shouldn't be fully rounded
} as const;

export const DEFAULT_THEME: Required<ThemeConfig> = {
  primaryColor: '#9945FF',
  secondaryColor: '#14F195', 
  backgroundColor: '#ffffff',
  textColor: '#111827',
  borderRadius: 'md',
  fontFamily: 'system-ui, -apple-system, sans-serif'
} as const;

// Utility functions
export const getBorderRadius = (radius?: BorderRadius): string => 
  BORDER_RADIUS_MAP[radius ?? 'md'];

export const getModalBorderRadius = (radius?: BorderRadius): string => 
  MODAL_BORDER_RADIUS_MAP[radius ?? 'md'];

export const getContainerBorderRadius = (radius?: BorderRadius): string => 
  CONTAINER_BORDER_RADIUS_MAP[radius ?? 'md'];

// Security & validation
export const validateWalletAddress = (address: string): boolean => {
  // Solana address validation (32-44 chars, base58)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

export const sanitizeString = (str: string): string => {
  // XSS prevention for user inputs
  return str.replace(/[<>"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
};

// Custom hooks
export const useTheme = (theme?: ThemeConfig) => 
  useMemo(() => ({ ...DEFAULT_THEME, ...theme }), [theme]);

export const useTotalAmount = (mode: CommerceMode, products?: readonly OrderItem[]) => 
  useMemo(() => {
    if (!products?.length) return 0;
    return mode === 'cart' 
      ? products.reduce((sum, product) => sum + product.price, 0)
      : products[0]?.price ?? 0;
  }, [mode, products]);

export const usePaymentUrl = (merchant: MerchantConfig, amount: number, mode: CommerceMode) => 
  useMemo(() => {
    if (!validateWalletAddress(merchant.wallet) || amount <= 0) return '';
    
    const params = new URLSearchParams({
      recipient: merchant.wallet,
      amount: amount.toString(),
      reference: `commerce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: sanitizeString(merchant.name),
      message: mode === 'tip' 
        ? 'Thank you for your support!' 
        : `Purchase from ${sanitizeString(merchant.name)}`
    });
    
    return `solana:${merchant.wallet}?${params.toString()}`;
  }, [merchant.wallet, merchant.name, amount, mode]);



// Error handling
export const createPaymentError = (message: string, cause?: unknown): Error => {
  const error = new Error(`Payment failed: ${message}`);
  if (cause instanceof Error) {
    error.cause = cause;
  }
  return error;
};

// Amount formatting
export const formatSolAmount = (lamports: number, decimals: number = 3): string => {
  return (lamports / 1000000000).toFixed(decimals);
};

export const parseSolAmount = (solAmount: string): number => {
  const parsed = parseFloat(solAmount);
  return isNaN(parsed) ? 0 : Math.round(parsed * 1000000000);
};

// Default profile SVG for merchants without a logo
export const DEFAULT_PROFILE_SVG = 'data:image/svg+xml;utf8,<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9531 23.9062C10.3047 23.9062 8.75781 23.5938 7.3125 22.9688C5.86719 22.3516 4.59766 21.4961 3.50391 20.4023C2.41016 19.3086 1.55078 18.0391 0.925781 16.5938C0.308594 15.1484 0 13.6016 0 11.9531C0 10.3047 0.308594 8.75781 0.925781 7.3125C1.55078 5.86719 2.41016 4.59766 3.50391 3.50391C4.59766 2.40234 5.86719 1.54297 7.3125 0.925781C8.75781 0.308594 10.3047 0 11.9531 0C13.6016 0 15.1484 0.308594 16.5938 0.925781C18.0391 1.54297 19.3086 2.40234 20.4023 3.50391C21.4961 4.59766 22.3516 5.86719 22.9688 7.3125C23.5938 8.75781 23.9062 10.3047 23.9062 11.9531C23.9062 13.6016 23.5938 15.1484 22.9688 16.5938C22.3516 18.0391 21.4961 19.3086 20.4023 20.4023C19.3086 21.4961 18.0391 22.3516 16.5938 22.9688C15.1484 23.5938 13.6016 23.9062 11.9531 23.9062ZM11.9531 21.9141C13.3281 21.9141 14.6172 21.6562 15.8203 21.1406C17.0234 20.625 18.082 19.9102 18.9961 18.9961C19.9102 18.082 20.625 17.0234 21.1406 15.8203C21.6562 14.6172 21.9141 13.3281 21.9141 11.9531C21.9141 10.5781 21.6562 9.28906 21.1406 8.08594C20.625 6.875 19.9102 5.81641 18.9961 4.91016C18.082 3.99609 17.0234 3.28125 15.8203 2.76562C14.6172 2.25 13.3281 1.99219 11.9531 1.99219C10.5781 1.99219 9.28906 2.25 8.08594 2.76562C6.88281 3.28125 5.82422 3.99609 4.91016 4.91016C3.99609 5.81641 3.28125 6.875 2.76562 8.08594C2.25 9.28906 1.99219 10.5781 1.99219 11.9531C1.99219 13.3281 2.25 14.6172 2.76562 15.8203C3.28125 17.0234 3.99609 18.082 4.91016 18.9961C5.82422 19.9102 6.88281 20.625 8.08594 21.1406C9.28906 21.6562 10.5781 21.9141 11.9531 21.9141ZM19.9688 19.6758C19.2578 20.3711 18.4219 20.9648 17.4609 21.457C16.5078 21.9492 15.543 22.3242 14.5664 22.582C13.5898 22.8477 12.7188 22.9805 11.9531 22.9805C11.1953 22.9805 10.3242 22.8477 9.33984 22.582C8.36328 22.3242 7.39453 21.9492 6.43359 21.457C5.47266 20.9648 4.64062 20.3711 3.9375 19.6758L3.97266 19.5352C4.16797 18.9648 4.625 18.4023 5.34375 17.8477C6.0625 17.293 6.98438 16.8359 8.10938 16.4766C9.24219 16.1172 10.5234 15.9375 11.9531 15.9375C13.3906 15.9375 14.6719 16.1172 15.7969 16.4766C16.9297 16.8359 17.8516 17.293 18.5625 17.8477C19.2812 18.4023 19.7383 18.9688 19.9336 19.5469L19.9688 19.6758ZM11.9531 13.9453C11.2031 13.9375 10.5234 13.7422 9.91406 13.3594C9.3125 12.9688 8.83203 12.4414 8.47266 11.7773C8.12109 11.1133 7.94141 10.3633 7.93359 9.52734C7.92578 8.73828 8.10156 8.01562 8.46094 7.35938C8.82031 6.70312 9.30469 6.17969 9.91406 5.78906C10.5234 5.39062 11.2031 5.19141 11.9531 5.19141C12.7031 5.19141 13.3789 5.39062 13.9805 5.78906C14.5898 6.17969 15.0742 6.70312 15.4336 7.35938C15.793 8.01562 15.9727 8.73828 15.9727 9.52734C15.9727 10.3633 15.793 11.1172 15.4336 11.7891C15.082 12.4609 14.6016 12.9922 13.9922 13.3828C13.3828 13.7656 12.7031 13.9531 11.9531 13.9453Z" fill="%23000" fill-opacity="0.1"/></svg>';

// Get button text based on mode
export const getButtonText = (mode: CommerceMode): string => {
  switch (mode) {
    case 'tip':
      return 'Tip';
    case 'buyNow':
      return 'Buy Now';
    case 'cart':
      return 'Checkout';
    default:
      return 'Pay Now';
  }
};