import { address } from 'gill';
import { SOLANA_PROTOCOL, HTTPS_PROTOCOL, SOL_DECIMALS } from './constants';
import type { TransferRequestURLFields, TransactionRequestURLFields } from './encode-url';

/**
 * Error thrown when a URL can't be parsed as a Solana Pay URL.
 */
export class ParseURLError extends Error {
    name = 'ParseURLError';
}

/**
 * Convert a decimal string to atomic units (bigint) with proper precision handling.
 * 
 * @param amount - String representation of the decimal amount
 * @param decimals - Number of decimal places for the target unit
 * @returns Amount in atomic units as bigint
 * 
 * @throws {ParseURLError} When amount is negative or has too many decimal places
 */
function toAtomicUnits(amount: string, decimals: number): bigint {
    // Validate: empty or whitespace
    if (!amount || !amount.trim()) {
        throw new ParseURLError('amount invalid');
    }

    const trimmed = amount.trim();

    // Check for negative values
    if (trimmed.startsWith('-')) {
        throw new ParseURLError('amount invalid');
    }

    // Split into integer and decimal parts
    const [integerPart = '0', fractionalPart = ''] = trimmed.split('.');

    // Validate we have at least one digit somewhere
    if ((integerPart === '' || integerPart === '0') && fractionalPart === '') {
        throw new ParseURLError('amount invalid');
    }

    // Validate decimal places don't exceed maximum
    if (fractionalPart.length > decimals) {
        throw new ParseURLError('amount decimals invalid');
    }

    // Pad decimal part to required length
    const paddedFractional = fractionalPart.padEnd(decimals, '0');
    
    // Convert to base units: integer part * 10^decimals + fractional part
    const integerLamports = BigInt(integerPart || '0') * (10n ** BigInt(decimals));
    const fractionalLamports = BigInt(paddedFractional || '0');
    
    return integerLamports + fractionalLamports;
}

/**
 * Parse a Solana Pay URL.
 *
 * @param url - URL to parse.
 *
 * @throws {ParseURLError}
 */
export function parseURL(url: string | URL): TransferRequestURLFields | TransactionRequestURLFields {
    if (typeof url === 'string') {
        if (url.length > 2048) throw new ParseURLError('length invalid');
        url = new URL(url);
    }

    if (url.protocol !== SOLANA_PROTOCOL) throw new ParseURLError('protocol invalid');

    if (!url.pathname) throw new ParseURLError('pathname missing');

    // Handle transaction request (with link)
    if (/^https?:\/\//.test(url.pathname)) {
        return parseTransactionRequestURL(url);
    }

    // Handle transfer request
    return parseTransferRequestURL(url);
}

/**
 * Parse a Solana Pay transfer request URL.
 *
 * @param url - URL to parse.
 *
 * @throws {ParseURLError}
 */
function parseTransferRequestURL(url: URL): TransferRequestURLFields {
    const { pathname, searchParams } = url;

    let recipient;
    try {
        recipient = address(pathname);
    } catch (error) {
        throw new ParseURLError('recipient invalid');
    }

    let amount;
    const amountParam = searchParams.get('amount');
    if (amountParam != null) {
        if (!/^\d+(\.\d+)?$/.test(amountParam)) throw new ParseURLError('amount invalid');

        // Additional validation for NaN (though regex should catch most cases)
        if (isNaN(parseFloat(amountParam))) throw new ParseURLError('amount invalid');

        // Convert to atomic units (lamports) using safe integer arithmetic
        amount = toAtomicUnits(amountParam, SOL_DECIMALS);
    }

    let splToken;
    const splTokenParam = searchParams.get('spl-token');
    if (splTokenParam != null) {
        try {
            splToken = address(splTokenParam);
        } catch (error) {
            throw new ParseURLError('token invalid');
        }
    }

    const referenceParams = searchParams.getAll('reference');
    let reference;
    if (referenceParams.length) {
        try {
            reference = referenceParams.map((param) => address(param));
        } catch (error) {
            throw new ParseURLError('reference invalid');
        }
    }

    const label = searchParams.get('label') || undefined;
    const message = searchParams.get('message') || undefined;
    const memo = searchParams.get('memo') || undefined;

    return {
        recipient,
        amount,
        splToken,
        reference,
        label,
        message,
        memo,
    };
}

/**
 * Parse a Solana Pay transaction request URL.
 *
 * @param url - URL to parse.
 *
 * @throws {ParseURLError}
 */
function parseTransactionRequestURL(url: URL): TransactionRequestURLFields {
    let link;
    try {
        const linkParam = url.pathname.slice(2); // Remove leading "//"
        if (url.search) {
            link = new URL(decodeURIComponent(linkParam) + url.search);
        } else {
            link = new URL(decodeURIComponent(linkParam));
        }

        if (link.protocol !== HTTPS_PROTOCOL) throw new ParseURLError('link invalid');
    } catch (error) {
        throw new ParseURLError('link invalid');
    }

    const label = url.searchParams.get('label') || undefined;
    const message = url.searchParams.get('message') || undefined;

    return {
        link,
        label,
        message,
    };
}