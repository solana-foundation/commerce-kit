/**
 * Solana Commerce SDK - Type Definitions
 * Production-ready type system for commerce components
 */

import { SPLToken } from '@solana-commerce/solana-pay';
import { address } from 'gill';
import type React from 'react';

// Core enums and types
export type CommerceMode = 'cart' | 'tip' | 'buyNow';
export type Position = 'inline' | 'overlay';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type Network = 'mainnet-beta' | 'devnet' | 'localnet';

// Merchant configuration
export interface MerchantConfig {
    readonly name: string;
    readonly wallet: string; // recipient wallet address
    readonly logo?: string;
    readonly description?: string;
}

// Theme configuration
export interface ThemeConfig {
    readonly primaryColor?: string;
    readonly secondaryColor?: string;
    readonly backgroundColor?: string;
    readonly textColor?: string;
    readonly borderRadius?: BorderRadius;
    readonly fontFamily?: string;
    readonly buttonShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    readonly buttonBorder?: 'none' | 'black-10';
}

// Main SDK configuration
export interface SolanaCommerceConfig {
    readonly rpcUrl?: string;
    readonly mode: CommerceMode;
    readonly position?: Position;
    readonly merchant: MerchantConfig;
    readonly theme?: ThemeConfig;
    readonly allowedMints?: readonly string[];
    readonly network?: Network;
    readonly showQR?: boolean;
    readonly enableWalletConnect?: boolean;
    readonly showMerchantInfo?: boolean;
}

// Payment callbacks
export interface PaymentCallbacks {
    readonly onPayment?: (amount: number, currency: string) => void;
    readonly onPaymentStart?: () => void;
    readonly onPaymentSuccess?: (signature: string) => void;
    readonly onPaymentError?: (error: Error) => void;
    readonly onCancel?: () => void;
}

// Main SDK props
export interface PaymentButtonProps {
    readonly config: SolanaCommerceConfig;
    readonly children?: React.ReactNode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly variant?: 'default' | 'icon-only';
    readonly onPayment?: PaymentCallbacks['onPayment'];
    readonly onPaymentStart?: PaymentCallbacks['onPaymentStart'];
    readonly onPaymentSuccess?: PaymentCallbacks['onPaymentSuccess'];
    readonly onPaymentError?: PaymentCallbacks['onPaymentError'];
    readonly onCancel?: PaymentCallbacks['onCancel'];
    /** Optional payment configuration for price and decimal overrides */
    readonly paymentConfig?: import('./components/ui/secure-iframe-shell').PaymentConfig;
}

// Internal component props
export interface TriggerButtonProps {
    readonly theme: Required<ThemeConfig>;
    readonly mode: CommerceMode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly onClick: () => void;
    readonly variant?: 'default' | 'icon-only';
}

// Internal component props for iframe components
export interface PaymentModalContentProps {
    readonly config: SolanaCommerceConfig;
    readonly theme: Required<ThemeConfig>;
    readonly totalAmount: number;
    readonly paymentUrl: string;
    readonly onPayment: () => void;
    readonly onCancel: () => void;
}

export interface TipModalContentProps {
    readonly config: SolanaCommerceConfig;
    readonly theme: Required<ThemeConfig>;
    readonly onPayment: (amount: number, currency: string, paymentMethod: PaymentMethod) => void;
    readonly onCancel: () => void;
}

export type PaymentMethod = 'wallet' | 'qr';
export type Currency = 'USDC' | 'SOL' | 'USDT' | 'USDC_DEVNET' | 'SOL_DEVNET' | 'USDT_DEVNET';
export const CurrencyMap: Record<Currency, SPLToken> = {
    // Mainnet addresses
    USDC: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mainnet
    SOL: address('So11111111111111111111111111111111111111112'), // Native SOL
    USDT: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT mainnet

    // Devnet addresses
    USDC_DEVNET: address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC devnet
    SOL_DEVNET: address('So11111111111111111111111111111111111111112'), // Native SOL (same on all networks)
    USDT_DEVNET: address('E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF'), // USDT devnet
};

export interface TipFormData {
    readonly amount: string;
    readonly currency: Currency;
    readonly paymentMethod: PaymentMethod;
}
