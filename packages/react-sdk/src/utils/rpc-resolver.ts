/**
 * Server-side RPC URL resolution utilities
 * 
 * Handles RPC endpoint selection server-side for security and performance
 */

export interface RpcEndpointConfig {
    network: 'mainnet' | 'devnet' | 'testnet';
    endpoint?: string;
    priority?: 'fast' | 'reliable' | 'cost-effective';
}

export interface RpcEndpoint {
    url: string;
    network: string;
    priority: string;
    rateLimitTier?: 'free' | 'pro' | 'enterprise';
}

/**
 * Server-side RPC URL resolver
 * 
 * @param config - Network and priority configuration
 * @returns Resolved RPC endpoint information
 */
export async function resolveRpcEndpoint(config: RpcEndpointConfig): Promise<RpcEndpoint> {
    const { network, endpoint, priority = 'reliable' } = config;

    // If explicit endpoint provided, use it (for custom RPC URLs)
    if (endpoint) {
        return {
            url: endpoint,
            network,
            priority,
            rateLimitTier: 'enterprise', // Assume custom endpoints are unlimited
        };
    }

    // Server-side environment variable resolution
    const envRpcUrl = getServerRpcUrl(network);
    if (envRpcUrl) {
        return {
            url: envRpcUrl,
            network,
            priority,
            rateLimitTier: 'pro', // Assume env vars are premium endpoints
        };
    }

    // Fallback to public endpoints with rate limiting considerations
    return getPublicRpcEndpoint(network, priority);
}

/**
 * Get RPC URL from server environment variables
 */
function getServerRpcUrl(network: string): string | null {
    if (typeof process === 'undefined') return null;

    const envKey = `SOLANA_RPC_${network.toUpperCase()}`;
    return process.env[envKey] || process.env.SOLANA_RPC_URL || null;
}

/**
 * Get public RPC endpoint with priority selection
 */
function getPublicRpcEndpoint(network: string, priority: string): RpcEndpoint {
    const endpoints = {
        mainnet: {
            fast: 'https://api.mainnet-beta.solana.com',
            reliable: 'https://api.mainnet-beta.solana.com',
            'cost-effective': 'https://api.mainnet-beta.solana.com',
        },
        devnet: {
            fast: 'https://api.devnet.solana.com',
            reliable: 'https://api.devnet.solana.com', 
            'cost-effective': 'https://api.devnet.solana.com',
        },
        testnet: {
            fast: 'https://api.testnet.solana.com',
            reliable: 'https://api.testnet.solana.com',
            'cost-effective': 'https://api.testnet.solana.com',
        },
    };

    const networkEndpoints = endpoints[network as keyof typeof endpoints];
    const url = networkEndpoints?.[priority as keyof typeof networkEndpoints] || networkEndpoints?.reliable;

    return {
        url: url || `https://api.${network}.solana.com`,
        network,
        priority,
        rateLimitTier: 'free',
    };
}

/**
 * Client-side function to request RPC URL from server
 * 
 * For iframe use: Parent fetches RPC URL server-side and passes to iframe
 */
export async function fetchRpcUrl(config: RpcEndpointConfig): Promise<string> {
    try {
        // Try server API first (if available)
        if (typeof window !== 'undefined') {
            try {
                const response = await fetch('/api/rpc-endpoints', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config),
                });
                
                if (response.ok) {
                    const result = await response.json();
                    return result.url;
                }
            } catch (apiError) {
                console.warn('[RPC Resolver] Server API failed, falling back to client resolution:', apiError);
            }
        }

        // Fallback to client-side resolution with server-like logic
        const endpoint = await resolveRpcEndpoint(config);
        return endpoint.url;
    } catch (error) {
        console.warn('[RPC Resolver] Failed to resolve RPC URL, using fallback:', error);
        return `https://api.${config.network}.solana.com`;
    }
}
