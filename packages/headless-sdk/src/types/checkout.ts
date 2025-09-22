import { Customer } from './customer';

export interface CheckoutState {
    currentStep: 'details' | 'payment' | 'confirmation';
    steps: CheckoutStep[];
    isProcessing: boolean;
    isLoading: boolean;
    paymentMethod: 'SOL' | 'USDC' | 'USDT';
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
    id: string;
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

export function getCheckoutSteps(mode: 'buyNow' | 'cart'): CheckoutStep[] {
    return [
        { id: 'details', name: 'Details', completed: false, active: true },
        { id: 'payment', name: 'Payment', completed: false, active: false },
        { id: 'confirmation', name: 'Confirmation', completed: false, active: false },
    ];
}
