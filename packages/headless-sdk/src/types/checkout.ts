import { Customer } from './customer';
import { PaymentMethod } from './tokens';

export type CheckoutStepId = 'details' | 'payment' | 'confirmation';
export type Mode = 'buyNow' | 'cart';

export interface CheckoutState {
    currentStep: CheckoutStepId;
    steps: CheckoutStep[];
    isProcessing: boolean;
    isLoading: boolean;
    paymentMethod: PaymentMethod;
    customerInfo: Customer;
    securityContext: {
        sessionId: string;
        reference: string;
        timestamp: number;
        csrfToken: string;
    } | null;
    errors: Record<string, string>;
    globalError: string | null;
    paymentSignature: string | null;
    orderId: string | null;
}

export interface CheckoutStep {
    id: CheckoutStepId;
    name: string;
    completed: boolean;
    active: boolean;
}

export interface SecureCheckoutConfig {
    csrfToken?: string;
    maxAttempts?: number;
    attemptWindow?: number;
    sessionId?: string;
    merchantSignature?: string;
    timestamp?: number;
    nonce?: string;
}

