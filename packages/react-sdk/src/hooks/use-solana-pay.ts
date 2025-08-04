import { createSolanaPayRequest } from "@solana-commerce/headless-sdk";
import { Recipient, Reference, References, SPLToken } from "@solana-commerce/solana-pay";
import BigNumber from "bignumber.js";
import { useState, useEffect } from "react";

export function useSolanaPay(recipient: string, amount: number, token: SPLToken) {
    const [paymentRequest, setPaymentRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function createRequest() {
            try {
                // Generate a unique reference for this payment
                const reference = `tip-${Math.floor(Math.random() * 1000000)}`.toString();
               
                const request = await createSolanaPayRequest({
                    recipient: recipient as Recipient,
                    amount: new BigNumber(amount),
                    splToken: token,
                    memo: reference,
                    label: 'commerceKit',
                }, {
                    size: 256,
                    background: 'white',
                    color: 'black',
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