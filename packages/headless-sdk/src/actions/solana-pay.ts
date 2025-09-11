import { createStyledQRCode, encodeURL, TransferRequestURLFields, createSPLToken, createRecipient } from "@solana-commerce/solana-pay";

// Converts a decimal `amount` to minor units as bigint using string math.
function toMinorUnits(amt: number, decimals: number): bigint {
  if (!Number.isFinite(amt) || decimals < 0) throw new Error('Invalid amount/decimals');
  const s = amt.toFixed(decimals); // stable string with exactly `decimals` fraction digits
  const parts = s.split('.');
  const i = parts[0] || '0';
  const f = parts[1] || '';
  return BigInt(i) * (10n ** BigInt(decimals)) + BigInt(f.padEnd(decimals, '0'));
}

export interface SolanaPayRequestOptions {
    size?: number;
    background?: string;
    color?: string;
    // Advanced QR customization options
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    logo?: string;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    dotStyle?: 'dots' | 'rounded' | 'square';
    cornerStyle?: 'square' | 'rounded' | 'extra-rounded' | 'full-rounded' | 'maximum-rounded';
}

export async function createSolanaPayRequest(request: TransferRequestURLFields, options: SolanaPayRequestOptions) {
    const url = encodeURL(request);

    const qr = await createStyledQRCode(url.toString(), {
        width: options.size ?? 256,
        margin: options.margin,
        color: {
            dark: options.color ?? 'black',
            light: options.background ?? 'white',
        },
        errorCorrectionLevel: options.errorCorrectionLevel,
        logo: options.logo,
        logoSize: options.logoSize,
        logoBackgroundColor: options.logoBackgroundColor,
        logoMargin: options.logoMargin,
        dotStyle: options.dotStyle,
        cornerStyle: options.cornerStyle,
    });

    return {
        url,
        qr
    };
}

// Helper function to create a payment request from string inputs
export async function createPaymentRequest(
    recipientAddress: string,
    amount: number,
    tokenAddress?: string,
    options: SolanaPayRequestOptions & {
        label?: string;
        message?: string;
        memo?: string;
    } = {}
) {
    try {
        const request: TransferRequestURLFields = {
            recipient: createRecipient(recipientAddress),
            amount: toMinorUnits(amount, 9), // Default to 9 decimals (SOL standard)
        };

        // Only add SPL token if provided and not SOL
        if (tokenAddress && tokenAddress !== 'SOL') {
            request.splToken = createSPLToken(tokenAddress);
        }

        if (options.label) request.label = options.label;
        if (options.message) request.message = options.message;
        if (options.memo) request.memo = options.memo;

        return await createSolanaPayRequest(request, {
            size: options.size || 256,
            background: options.background || 'white',
            color: options.color || 'black',
            margin: options.margin,
            errorCorrectionLevel: options.errorCorrectionLevel,
            logo: options.logo,
            logoSize: options.logoSize,
            logoBackgroundColor: options.logoBackgroundColor,
            logoMargin: options.logoMargin,
            dotStyle: options.dotStyle,
            cornerStyle: options.cornerStyle
        });
    } catch (error) {
        console.error('Error creating payment request:', error);
        throw error;
    }
}