export interface PaymentState {
    isProcessing: boolean;
    isVerifying: boolean;
    paymentUrl: string | null;
    qrCodeData: string | null;
    signature: string | null;
    verificationResult: PaymentVerificationResult | null;
    error: string | null;
    retryCount: number;
}

export interface PaymentVerificationResult {
    verified: boolean;
    error?: string;
    signature?: string;
    amount?: number;
    recipient?: string;
}

export interface PaymentOptions {
    onPaymentInitiated?: (paymentUrl: string) => void;
    onPaymentSigned?: (signature: string) => void;
    onPaymentVerified?: (result: PaymentVerificationResult) => void;
    onPaymentError?: (error: Error) => void;
}
