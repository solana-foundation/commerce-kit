/**
 * Cluster utilities using gill's built-in functions
 */

import { getPublicSolanaRpcUrl, type SolanaClusterMoniker } from 'gill';

export type ClusterInfo = {
    name: string;
    rpcUrl: string;
    wsUrl?: string;
    isMainnet: boolean;
    isDevnet: boolean;
    isTestnet: boolean;
};

/**
 * Convert RPC URL to WebSocket URL
 * Handles both http:// and https:// schemes, plus URLs without explicit schemes
 */
function deriveWebSocketUrl(rpcUrl: string): string {
    // Handle URLs with explicit schemes
    if (rpcUrl.startsWith('https://')) {
        return rpcUrl.replace('https://', 'wss://');
    }
    if (rpcUrl.startsWith('http://')) {
        return rpcUrl.replace('http://', 'ws://');
    }

    // Handle URLs without explicit schemes - check prefix to determine protocol
    if (rpcUrl.startsWith('https')) {
        return `wss://${rpcUrl}`;
    }
    if (rpcUrl.startsWith('http')) {
        return `ws://${rpcUrl}`;
    }

    // Default to ws:// for other cases (localhost, domains without protocol, etc.)
    return `ws://${rpcUrl}`;
}

/**
 * Get cluster information from a network identifier
 * Leverages gill's getPublicSolanaRpcUrl for standard networks
 */
export function getClusterInfo(network: string): ClusterInfo {
    // Handle standard Solana cluster monikers
    if (isStandardCluster(network)) {
        const rpcUrl = getPublicSolanaRpcUrl(network);
        const wsUrl = deriveWebSocketUrl(rpcUrl);

        return {
            name: network === 'mainnet-beta' ? 'mainnet' : network,
            rpcUrl,
            wsUrl,
            isMainnet: network === 'mainnet' || network === 'mainnet-beta',
            isDevnet: network === 'devnet',
            isTestnet: network === 'testnet',
        };
    }

    // Handle custom RPC URLs (treat as mainnet by default)
    const wsUrl = deriveWebSocketUrl(network);
    return {
        name: 'custom',
        rpcUrl: network,
        wsUrl,
        isMainnet: true,
        isDevnet: false,
        isTestnet: false,
    };
}

/**
 * Type guard to check if network is a standard Solana cluster
 */
function isStandardCluster(network: string): network is SolanaClusterMoniker | 'mainnet-beta' | 'localhost' {
    return ['mainnet', 'mainnet-beta', 'devnet', 'testnet', 'localnet', 'localhost'].includes(network);
}
