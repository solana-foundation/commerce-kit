import { createSolanaPayRequest } from "@solana-commerce/headless-sdk";
import { Recipient, SPLToken } from "@solana-commerce/solana-pay";
import BigNumber from "bignumber.js";
import { useState, useEffect } from "react";

export function useSolanaPay(recipient: string, amount: number, token: SPLToken) {
    const [paymentRequest, setPaymentRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function createRequest() {
            try {
                const request = await createSolanaPayRequest({
                    recipient: recipient as Recipient,
                    amount: new BigNumber(amount),
                    splToken: token,
                }, {
                    size: 256,
                    background: 'white',
                    color: 'black',
                });
                setPaymentRequest(request);
            } catch (error) {
                console.error('Error creating Solana Pay request:', error);
            } finally {
                setLoading(false);
            }
        }

        createRequest();
    }, [recipient, amount]);

    return {
        paymentRequest,
        loading
    }
}