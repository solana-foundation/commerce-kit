import {
    createStyledQRCode,
    encodeURL,
    TransferRequestURLFields,
    createSPLToken,
    createRecipient,
} from '@solana-commerce/solana-pay';
import { toMinorUnits } from '../utils/validation';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type DotStyle = 'dots' | 'rounded' | 'square';
export type CornerStyle = 'square' | 'rounded' | 'extra-rounded' | 'full-rounded' | 'maximum-rounded';

export interface SolanaPayRequestOptions {
    size?: number;
    background?: string;
    color?: string;
    // Advanced QR customization options
    margin?: number;
    errorCorrectionLevel?: ErrorCorrectionLevel;
    logo?: string;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    dotStyle?: DotStyle;
    cornerStyle?: CornerStyle;
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
        qr,
    };
}

// Helper function to create a payment request with QR code from string inputs
export async function createQRPaymentRequest(
    recipientAddress: string,
    amount: number,
    tokenAddress?: string,
    options: SolanaPayRequestOptions & {
        label?: string;
        message?: string;
        memo?: string;
    } = {},
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
            cornerStyle: options.cornerStyle,
        });
    } catch (error) {
        console.error('Error creating payment request:', error);
        throw error;
    }
}
