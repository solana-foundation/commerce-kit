import type { Wallet, WalletAccount } from '@wallet-standard/base'

declare module '@solana-commerce/connector-kit' {
	export interface WalletInfo {
		wallet: Wallet
		name: string
		icon?: string
		installed: boolean
	}

	export interface AccountInfo {
		address: string
		icon?: string
		raw: WalletAccount
	}

	export interface ConnectorState {
		wallets: WalletInfo[]
		selectedWallet: Wallet | null
		connected: boolean
		connecting: boolean
		accounts: AccountInfo[]
		selectedAccount: string | null
	}

	export interface ConnectorConfig {
		autoConnect?: boolean
		debug?: boolean
		storage?: {
			getItem: (k: string) => string | null
			setItem: (k: string, v: string) => void
			removeItem: (k: string) => void
		}
	}

	export class ConnectorClient {
		constructor(config?: ConnectorConfig)
		subscribe(listener: (s: ConnectorState) => void): () => void
		getSnapshot(): ConnectorState
		select(walletName: string): Promise<void>
		disconnect(): Promise<void>
		selectAccount(address: string): Promise<void>
		destroy(): void
	}

	// React helper exposed by connector-kit; declared for type usage here
	export function useConnectorClient(): ConnectorClient
}
