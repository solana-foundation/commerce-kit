export interface Order {
    type: 'digital' | 'physical';
    mode: 'buyNow' | 'cart' | 'subscription' | 'tip';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    items: OrderItem[];
    total: number;
    currency: string;
    createdAt: number;
    updatedAt: number;
}

export interface OrderItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency?: string; // mint address or 'SOL'
    image?: string;
    metadata?: Record<string, any>;
}

export interface OrderRequest {
    recipient: string;
    amount: number;
    currency?: string;
    memo?: string;
    reference?: string;
    items?: OrderItem[];
    label?: string;
    message?: string;
}

export interface SecureOrderConfig {
    csrfToken?: string;
    maxAttempts?: number;
    attemptWindow?: number;
    sessionId?: string;
    merchantSignature?: string;
    timestamp?: number;
    nonce?: string;
}
