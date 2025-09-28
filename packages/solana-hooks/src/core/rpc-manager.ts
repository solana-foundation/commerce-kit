/**
 * Simple RPC utilities for wallet flow
 * 
 * Simplified from over-engineered pooling system to basic RPC client creation
 */

import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

// Type aliases for RPC clients
type SolanaRpc = ReturnType<typeof createSolanaRpc>;
type SolanaRpcSubscriptions = ReturnType<typeof createSolanaRpcSubscriptions>;

/**
 * Create RPC connection for wallet operations
 * 
 * @param rpcUrl - RPC endpoint URL
 * @param commitment - Transaction confirmation level
 * @returns RPC client
 */
export function createRpc(rpcUrl: string, commitment?: 'processed' | 'confirmed' | 'finalized'): SolanaRpc {
    return createSolanaRpc(rpcUrl);
}

/**
 * Create WebSocket connection for wallet operations
 * 
 * @param rpcUrl - RPC endpoint URL (will be converted to WebSocket URL)
 * @param commitment - Transaction confirmation level
 * @returns WebSocket client
 */
export function createWebSocket(
    rpcUrl: string,
    commitment?: 'processed' | 'confirmed' | 'finalized',
): SolanaRpcSubscriptions {
    const wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    return createSolanaRpcSubscriptions(wsUrl);
}

// Backward compatibility aliases (to avoid breaking changes during migration)
export const getSharedRpc = createRpc;
export const getSharedWebSocket = createWebSocket;

/**
 * No-op for backward compatibility - connection cleanup not needed with simple approach
 */
export function releaseRpcConnection(rpcUrl: string, commitment?: 'processed' | 'confirmed' | 'finalized'): void {
    // No-op - simple RPC creation doesn't require cleanup
}
