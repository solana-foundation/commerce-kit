import { createSolanaPayRequest } from "@solana-commerce/headless-sdk";
import { Recipient, SPLToken } from "@solana-commerce/solana-pay";
import { useState, useEffect } from "react";

// Converts a decimal `amount` to minor units as bigint using string math.
export function toMinorUnits(amt: number, decimals: number): bigint {
  if (!Number.isFinite(amt) || decimals < 0) throw new Error('Invalid amount/decimals');
  const s = amt.toFixed(decimals); // stable string with exactly `decimals` fraction digits
  const parts = s.split('.');
  const i = parts[0] || '0';
  const f = parts[1] || '';
  return BigInt(i) * (10n ** BigInt(decimals)) + BigInt(f.padEnd(decimals, '0'));
}

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
                    amount: toMinorUnits(amount, ('decimals' in token ? (token as any).decimals : 9)), // to minor units
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