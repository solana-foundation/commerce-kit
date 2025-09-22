/**
 * Headless Checkout - Core checkout logic without React hooks or state
 */

import { STABLECOINS } from './types';
import { address as parseAddress } from 'gill';

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

export function calculateTotal(products: any[], mode: string) {
    if (!products?.length) return 0;

    if (mode === 'cart') {
        return products.reduce((sum: number, product: any) => sum + product.price, 0);
    }

    return products[0]?.price || 0;
}

export function createPaymentReference() {
    return `commerce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateWalletAddress(addressStr: string): boolean {
    try {
        // Use gill's address parser for robust base58 validation
        parseAddress(addressStr);
        return true;
    } catch {
        return false;
    }
}

export function createPaymentUrl(recipient: string, amount: number, merchantName: string, mode: string = 'payment') {
    if (!validateWalletAddress(recipient) || amount <= 0) return '';

    const params = new URLSearchParams({
        amount: amount.toString(),
        reference: createPaymentReference(),
        label: merchantName,
        message: mode === 'tip' ? 'Thank you for your support!' : `Purchase from ${merchantName}`,
    });

    // Per Solana Pay spec, recipient must be in the path, not a query param
    return `solana:${recipient}?${params.toString()}`;
}

export function validatePaymentRequest(request: any) {
    const errors: string[] = [];

    if (!request.recipient || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(request.recipient)) {
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
    return (lamports / 1000000000).toFixed(decimals);
}

export function parseSolAmount(solAmount: string): number {
    const parsed = parseFloat(solAmount);
    return isNaN(parsed) ? 0 : Math.round(parsed * 1000000000);
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
    // Backward compatibility helper; delegate to validateWalletAddress
    return validateWalletAddress(address);
}

/**
 * Convert lamports to display amount
 */
export function lamportsToDisplay(lamports: number, currency?: string): string {
    if (currency && STABLECOINS[currency]) {
        const stablecoin = STABLECOINS[currency];
        return (lamports / Math.pow(10, stablecoin.decimals)).toFixed(stablecoin.decimals);
    }
    return (lamports / 1000000000).toFixed(9);
}

/**
 * Convert display amount to lamports
 */
export function displayToLamports(amount: number, currency?: string): number {
    if (currency && STABLECOINS[currency]) {
        const stablecoin = STABLECOINS[currency];
        return Math.round(amount * Math.pow(10, stablecoin.decimals));
    }
    return Math.round(amount * 1000000000);
}
