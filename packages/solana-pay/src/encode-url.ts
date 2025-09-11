import { SOLANA_PROTOCOL, HTTPS_PROTOCOL, SOL_DECIMALS } from './constants';
import type { Amount, Label, Link, Memo, Message, Recipient, References, SPLToken } from './types';

/**
 * Fields of a Solana Pay transfer request URL.
 */
export interface TransferRequestURLFields {
    /** `recipient` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#recipient). */
    recipient: Recipient;
    /** `amount` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#amount). */
    amount?: Amount;
    /** `spl-token` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#spl-token). */
    splToken?: SPLToken;
    /** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference). */
    reference?: References;
    /** `label` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#label). */
    label?: Label;
    /** `message` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#message). */
    message?: Message;
    /** `memo` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#memo). */
    memo?: Memo;
}

/**
 * Convert bigint lamports to decimal string without floating-point precision issues.
 *
 * @param amount - Amount in lamports as bigint
 * @param decimals - Number of decimal places (defaults to SOL_DECIMALS)
 */
function lamportsToDecimal(amount: bigint, decimals = SOL_DECIMALS): string {
    const neg = amount < 0n;
    const abs = neg ? -amount : amount;
    const base = 10n ** BigInt(decimals);
    const int = abs / base;
    const frac = abs % base;
    if (frac === 0n) return `${neg ? '-' : ''}${int}`;
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${neg ? '-' : ''}${int}.${fracStr}`;
}

/**
 * Encode a Solana Pay transfer request URL.
 *
 * @param fields - Fields to encode in the URL.
 */
export function encodeURL(fields: TransferRequestURLFields | TransactionRequestURLFields): URL {
    if ('link' in fields) {
        return encodeTransactionRequestURL(fields);
    } else {
        return encodeTransferRequestURL(fields);
    }
}

/**
 * Encode a Solana Pay transfer request URL.
 *
 * @param fields - Fields to encode in the URL.
 */
export function encodeTransferRequestURL({ 
    recipient, 
    amount, 
    splToken, 
    reference, 
    label, 
    message, 
    memo 
}: TransferRequestURLFields): URL {
    const pathname = recipient.toString();
    const url = new URL(SOLANA_PROTOCOL + pathname);

    if (amount !== undefined) {
        // Convert bigint lamports to decimal without floating-point
        const amountStr = lamportsToDecimal(amount, SOL_DECIMALS);
        url.searchParams.append('amount', amountStr);
    }

    
    if (splToken) {
        try {
            // Ensure splToken is properly converted to string
            const tokenAddress = splToken.toString();
            url.searchParams.append('spl-token', tokenAddress);
        } catch (error) {
            throw new Error(`Invalid SPL token address: ${splToken}`);
        }
    }

    if (reference) {
        const references = Array.isArray(reference) ? reference : [reference];
        for (const ref of references) {
            url.searchParams.append('reference', ref.toString());
        }
    }

    if (label) {
        url.searchParams.append('label', label);
    }

    if (message) {
        url.searchParams.append('message', message);
    }

    if (memo) {
        url.searchParams.append('memo', memo);
    }

    return url;
}

/**
 * Fields of a Solana Pay transaction request URL.
 */
export interface TransactionRequestURLFields {
    /** `link` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#link). */
    link: Link;
    /** `label` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#label-1). */
    label?: Label;
    /** `message` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#message-1). */
    message?: Message;
}

/**
 * Encode a Solana Pay transaction request URL.
 *
 * @param fields - Fields to encode in the URL.
 */
export function encodeTransactionRequestURL({ link, label, message }: TransactionRequestURLFields): URL {
    // Remove trailing slashes
    const pathname = String(link).replace(/\/\?/, '?').replace(/\/$/, '');
    
    // Handle absolute and relative URLs
    const url = pathname.startsWith('http') ? new URL(pathname) : new URL(SOLANA_PROTOCOL + pathname);

    // Validate the protocol
    if (url.protocol !== SOLANA_PROTOCOL && url.protocol !== HTTPS_PROTOCOL) {
        throw new Error('invalid link');
    }

    // Add label and message as query parameters
    if (label) {
        url.searchParams.append('label', label);
    }

    if (message) {
        url.searchParams.append('message', message);
    }

    return url;
}