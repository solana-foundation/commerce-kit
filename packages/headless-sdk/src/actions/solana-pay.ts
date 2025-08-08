import { createQR, createQRCanvas, createStyledQRCode, encodeURL, TransferRequestURLFields, createSPLToken, createRecipient } from "@solana-commerce/solana-pay";
import BigNumber from "bignumber.js";

export async function createSolanaPayRequest(request: TransferRequestURLFields, options: {
    size?: number;
    background?: string;
    color?: string;
}) {
    const url = encodeURL(request);

    const qr = await createStyledQRCode(url.toString(), {
        width: options.size ?? 256,
        color: {
            dark: options.color ?? 'black',
            light: options.background ?? 'white',
        },
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
    options: {
        size?: number;
        background?: string;
        color?: string;
        label?: string;
        message?: string;
        memo?: string;
    } = {}
) {
    try {
        const request: TransferRequestURLFields = {
            recipient: createRecipient(recipientAddress),
            amount: new BigNumber(amount),
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
            color: options.color || 'black'
        });
    } catch (error) {
        console.error('Error creating payment request:', error);
        throw error;
    }
}