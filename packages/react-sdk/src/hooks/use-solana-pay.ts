import { createSolanaPayRequest } from "@solana-commerce/headless-sdk";
import { Recipient, Reference, References, SPLToken } from "@solana-commerce/solana-pay";
import { useState, useEffect } from "react";

export interface SolanaPayQROptions {
  size?: number;
  background?: string;
  color?: string;
  label?: string;
  message?: string;
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

export function useSolanaPay(
  recipient: string,
  amount: number,
  token: SPLToken,
  opts?: SolanaPayQROptions
) {
    const [paymentRequest, setPaymentRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function createRequest() {
            try {
                // Generate a unique reference for this payment
                const reference = `tip-${Math.floor(Math.random() * 1000000)}`.toString();
               
                const request = await createSolanaPayRequest({
                    recipient: recipient as Recipient,
                    amount: BigInt(Math.floor(amount * 1_000_000_000)), // Convert to lamports
                    splToken: token,
                    memo: reference,
                    label: opts?.label ?? 'commerceKit',
                    message: opts?.message,
                }, {
                    size: opts?.size ?? 256,
                    background: opts?.background ?? 'white',
                    color: opts?.color ?? 'black',
                    // Pass through advanced QR options
                    margin: opts?.margin,
                    errorCorrectionLevel: opts?.errorCorrectionLevel,
                    logo: opts?.logo,
                    logoSize: opts?.logoSize,
                    logoBackgroundColor: opts?.logoBackgroundColor,
                    logoMargin: opts?.logoMargin,
                    dotStyle: opts?.dotStyle,
                    cornerStyle: opts?.cornerStyle,
                });
                
                // Add memo to the returned request
                setPaymentRequest({
                    ...request,
                    memo: reference,
                });
            } catch (error) {
                console.error('Error creating Solana Pay request:', error);
            } finally {
                setLoading(false);
            }
        }

        createRequest();
    }, [recipient, amount, token]);

    return {
        paymentRequest,
        loading
    }
}