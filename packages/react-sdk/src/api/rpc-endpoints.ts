/**
 * Server-side API route for RPC endpoint resolution
 * 
 * This should be implemented as a Next.js API route or similar server endpoint
 */

import type { RpcEndpointConfig, RpcEndpoint } from '../utils/rpc-resolver';

/**
 * API route handler for RPC endpoint resolution
 * 
 * Usage: POST /api/rpc-endpoints
 * Body: { network: 'mainnet', priority: 'reliable' }
 * Response: { url: 'https://...', network: 'mainnet', priority: 'reliable' }
 */
export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return Response.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const config = body as RpcEndpointConfig;
        
        // Validate input
        if (!config.network || !['mainnet', 'devnet', 'testnet'].includes(config.network)) {
            return Response.json(
                { error: 'Invalid network specified' },
                { status: 400 }
            );
        }

        // Server-side environment variable resolution
        const envRpcUrl = getServerRpcUrl(config.network);
        if (envRpcUrl) {
            return Response.json({
                url: envRpcUrl,
                network: config.network,
                priority: config.priority || 'reliable',
                rateLimitTier: 'pro',
                source: 'environment'
            });
        }

        // Fallback to public endpoints
        const publicEndpoint = getPublicRpcEndpoint(config.network, config.priority || 'reliable');
        
        return Response.json({
            ...publicEndpoint,
            source: 'public'
        });

    } catch (error) {
        console.error('[API] RPC endpoint resolution failed:', error);
        return Response.json(
            { error: 'Failed to resolve RPC endpoint' },
            { status: 500 }
        );
    }
}

/**
 * Get RPC URL from server environment variables
 */
function getServerRpcUrl(network: string): string | null {
    const envKey = `SOLANA_RPC_${network.toUpperCase()}`;
    return process.env[envKey] || process.env.SOLANA_RPC_URL || null;
}

/**
 * Get public RPC endpoint based on network and priority
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
