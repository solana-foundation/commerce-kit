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
 * Get cluster information from a network identifier
 * Leverages gill's getPublicSolanaRpcUrl for standard networks
 */
export function getClusterInfo(network: string): ClusterInfo {
    // Handle standard Solana cluster monikers
    if (isStandardCluster(network)) {
        const rpcUrl = getPublicSolanaRpcUrl(network);
        const wsUrl = rpcUrl.replace('https://', 'wss://');
        
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
    return {
        name: 'custom',
        rpcUrl: network,
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
