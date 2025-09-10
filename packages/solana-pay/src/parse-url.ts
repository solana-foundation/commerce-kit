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

        const parsedAmount = parseFloat(amountParam);
        if (isNaN(parsedAmount) || parsedAmount < 0) throw new ParseURLError('amount invalid');

        // Check decimal places
        const decimalIndex = amountParam.indexOf('.');
        if (decimalIndex !== -1) {
            const decimals = amountParam.length - decimalIndex - 1;
            if (decimals > SOL_DECIMALS) throw new ParseURLError('amount decimals invalid');
        }

        // Convert to bigint in lamports (smallest unit)
        amount = BigInt(Math.floor(parsedAmount * Math.pow(10, SOL_DECIMALS)));
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