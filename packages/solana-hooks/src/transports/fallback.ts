import { type Transport, type JsonRpcRequest, type TransportRequestOptions } from './types';

export interface FallbackOptions {
    rank?: 'weight' | 'first';
}

export function fallbackTransport(transports: Transport[], _opts: FallbackOptions = {}): Transport {
    const id = `fallback:${transports.map(t => t.id).join(',')}`;
    async function request<T>(req: JsonRpcRequest, opts?: TransportRequestOptions): Promise<T> {
        let lastErr: unknown;
        for (const t of transports) {
            try {
                return await t.request<T>(req, opts);
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr;
    }
    return { id, request };
}
