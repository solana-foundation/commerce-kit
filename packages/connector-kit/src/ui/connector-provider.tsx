'use client'

import React, { createContext, useContext, useMemo, useRef, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { ConnectorClient, type ConnectorConfig } from '../lib/connector-client'

export type ConnectorSnapshot = ReturnType<ConnectorClient['getSnapshot']> & {
	select: (walletName: string) => Promise<void>
	disconnect: () => Promise<void>
	selectAccount: (address: string) => Promise<void>
}

export const ConnectorContext = createContext<ConnectorClient | null>(null)
ConnectorContext.displayName = 'ConnectorContext'

export interface MobileWalletAdapterConfig {
	appIdentity: {
		name: string
		uri?: string
		icon?: string
	}
	remoteHostAuthority?: string
	chains?: readonly string[]
	authorizationCache?: any
	chainSelector?: any
	onWalletNotFound?: (wallet: any) => Promise<void>
}

// Global singleton to persist across component mount/unmount cycles
let globalConnectorClient: ConnectorClient | null = null;
let providerRefCount = 0;
let cleanupTimeoutId: NodeJS.Timeout | null = null;

function getOrCreateConnectorClient(config?: ConnectorConfig): ConnectorClient {
	// Cancel any pending cleanup
	if (cleanupTimeoutId) {
		clearTimeout(cleanupTimeoutId);
		cleanupTimeoutId = null;
	}

	if (!globalConnectorClient) {
		console.log('[ConnectorProvider] Creating singleton ConnectorClient');
		globalConnectorClient = new ConnectorClient(config);
	}
	
	providerRefCount++;
	console.log('[ConnectorProvider] Provider mounted, ref count:', providerRefCount);
	
	return globalConnectorClient;
}

function releaseConnectorClient(): void {
	providerRefCount--;
	console.log('[ConnectorProvider] Provider unmounted, ref count:', providerRefCount);
	
	if (providerRefCount <= 0) {
		// Delay cleanup to handle rapid mount/unmount cycles
		cleanupTimeoutId = setTimeout(() => {
			if (providerRefCount <= 0 && globalConnectorClient) {
				console.log('[ConnectorProvider] Cleaning up singleton ConnectorClient');
				// Disconnect wallet before cleanup
				globalConnectorClient.disconnect().catch(console.warn);
				// If the client has a destroy method, call it
				if (typeof (globalConnectorClient as any).destroy === 'function') {
					(globalConnectorClient as any).destroy();
				}
				globalConnectorClient = null;
			}
			cleanupTimeoutId = null;
		}, 5000); // 5 second delay to handle rapid remounts
	}
}

export function ConnectorProvider({ children, config, mobile }: { children: ReactNode; config?: ConnectorConfig; mobile?: MobileWalletAdapterConfig }) {
	const client = getOrCreateConnectorClient(config);
	
	if (process.env.NODE_ENV !== 'production') {
		console.log('[ConnectorProvider] Using singleton ConnectorClient:', {
			hasClient: !!client,
			connected: client?.getSnapshot?.()?.connected
		});
	}

	// Cleanup on unmount with reference counting
	React.useEffect(() => {
		return () => {
			releaseConnectorClient();
		}
	}, [])

	// Optionally register Mobile Wallet Adapter on the client
	React.useEffect(() => {
		if (!mobile) return
		let cancelled = false
		;(async () => {
			try {
				const mod = await import('@solana-mobile/wallet-standard-mobile')
				if (cancelled) return
				const {
					registerMwa,
					createDefaultAuthorizationCache,
					createDefaultChainSelector,
					createDefaultWalletNotFoundHandler,
					MWA_SOLANA_CHAINS,
				} = mod as any
				registerMwa({
					appIdentity: mobile.appIdentity,
					authorizationCache: mobile.authorizationCache ?? createDefaultAuthorizationCache(),
					chains: (mobile.chains ?? MWA_SOLANA_CHAINS) as any,
					chainSelector: mobile.chainSelector ?? createDefaultChainSelector(),
					remoteHostAuthority: mobile.remoteHostAuthority,
					onWalletNotFound: mobile.onWalletNotFound ?? createDefaultWalletNotFoundHandler(),
				})
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					console.warn('[ConnectorKit] Failed to register Mobile Wallet Adapter', e)
				}
			}
		})()
		return () => {
			cancelled = true
		}
	}, [mobile])

	return <ConnectorContext.Provider value={client}>{children}</ConnectorContext.Provider>
}

export function useConnector(): ConnectorSnapshot {
	const client = useContext(ConnectorContext)
	if (!client) throw new Error('useConnector must be used within ConnectorProvider')
	const state = useSyncExternalStore(cb => client.subscribe(cb), () => client.getSnapshot(), () => client.getSnapshot())
	return useMemo(() => ({ ...state, select: client.select.bind(client), disconnect: client.disconnect.bind(client), selectAccount: client.selectAccount.bind(client) }), [state, client])
}

export function useConnectorClient(): ConnectorClient | null {
    return useContext(ConnectorContext)
}

/**
 * Force cleanup of the global connector client.
 * Useful for testing scenarios or when you need to reset the connector state.
 * @internal
 */
export function forceCleanupConnectorClient(): void {
	if (cleanupTimeoutId) {
		clearTimeout(cleanupTimeoutId);
		cleanupTimeoutId = null;
	}
	
	if (globalConnectorClient) {
		console.log('[ConnectorProvider] Force cleaning up singleton ConnectorClient');
		globalConnectorClient.disconnect().catch(console.warn);
		if (typeof (globalConnectorClient as any).destroy === 'function') {
			(globalConnectorClient as any).destroy();
		}
		globalConnectorClient = null;
	}
	
	providerRefCount = 0;
}


