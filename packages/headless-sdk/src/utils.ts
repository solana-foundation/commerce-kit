/**
 * Headless Checkout - Core checkout logic without React hooks or state
 */

import { STABLECOINS } from './types';
import { isAddress, LAMPORTS_PER_SOL } from 'gill';

export function validateCustomerInfo(email?: string, name?: string, mode?: string) {
    const errors: Record<string, string> = {};

    if (!email) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Please enter a valid email';
    }

    if (mode === 'cart' && !name) {
        errors.name = 'Name is required for cart checkout';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

export function validatePaymentMethod(method: string, allowedMints: string[] = ['SOL']) {
    if (!allowedMints.includes(method)) {
        return {
            valid: false,
            error: `${method} is not allowed`,
        };
    }

    return { valid: true };
}

interface Product {
    price: number;
    [key: string]: unknown;
}

export function calculateTotal(products: Product[], mode: string): number {
    if (!products?.length) return 0;

    if (mode === 'cart') {
        return products.reduce((sum: number, product: Product) => sum + product.price, 0);
    }

    return products[0]?.price || 0;
}

export function createPaymentReference() {
    return `commerce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Re-export isAddress from gill for convenience
export { isAddress as validateWalletAddress } from 'gill';

export function createPaymentUrl(recipient: string, amount: number, merchantName: string, mode: string = 'payment') {
    if (!isAddress(recipient) || amount <= 0) return '';

    const params = new URLSearchParams({
        amount: amount.toString(),
        reference: createPaymentReference(),
        label: merchantName,
        message: mode === 'tip' ? 'Thank you for your support!' : `Purchase from ${merchantName}`,
    });

    // Per Solana Pay spec, recipient must be in the path, not a query param
    return `solana:${recipient}?${params.toString()}`;
}

interface PaymentRequest {
    recipient: string;
    amount: number;
    [key: string]: unknown;
}

export function validatePaymentRequest(request: PaymentRequest) {
    const errors: string[] = [];

    if (!request.recipient || !isAddress(request.recipient)) {
        errors.push('Invalid recipient wallet address');
    }

    if (!request.amount || request.amount <= 0) {
        errors.push('Amount must be greater than 0');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function formatSolAmount(lamports: number, decimals: number = 3): string {
    return (lamports / LAMPORTS_PER_SOL).toFixed(decimals);
}

export function parseSolAmount(solAmount: string): number {
    const parsed = parseFloat(solAmount);
    return isNaN(parsed) ? 0 : Math.round(parsed * LAMPORTS_PER_SOL);
}

/**
 * Validate Solana address (alias for validateWalletAddress)
 */
export { isAddress as isValidSolanaAddress } from 'gill';

/**
 * Convert lamports to display amount
 */
export function lamportsToDisplay(lamports: number, currency?: string): string {
    if (currency && STABLECOINS[currency]) {
        const stablecoin = STABLECOINS[currency];
        return (lamports / Math.pow(10, stablecoin.decimals)).toFixed(stablecoin.decimals);
    }
    return (lamports / LAMPORTS_PER_SOL).toFixed(9);
}

/**
 * Convert display amount to lamports
 */
export function displayToLamports(amount: number, currency?: string): number {
    if (currency && STABLECOINS[currency]) {
        const stablecoin = STABLECOINS[currency];
        return Math.round(amount * Math.pow(10, stablecoin.decimals));
    }
    return Math.round(amount * LAMPORTS_PER_SOL);
}
