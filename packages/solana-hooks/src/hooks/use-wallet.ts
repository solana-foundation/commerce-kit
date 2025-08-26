'use client'

import { useState, useCallback } from 'react'
import { 
  generateKeyPairSigner,
  type Address,
  type TransactionSigner
} from '@solana/kit'
import { useWalletAdapters, type UseWalletAdaptersOptions } from './use-wallet-adapters'
// Legacy type - deprecated, use useStandardWallets instead  
type WalletAdapter = any

export interface UseWalletOptions {
  /** Pre-existing signer to use - for direct signer injection */
  signer?: TransactionSigner
  /** Callback when wallet connects */
  onConnect?: (signer: TransactionSigner) => void
  /** Callback when wallet disconnects */
  onDisconnect?: () => void
  /** Auto-generate demo signer (development only) */
  developmentMode?: boolean
  
  // New wallet adapter options
  /** Array of wallet adapters to use */
  adapters?: WalletAdapter[]
  /** Auto-connect to previously connected wallet */
  autoConnect?: boolean
  /** Preferred wallet adapter name for auto-connect */
  preferredAdapter?: string
}

export interface WalletState {
  connected: boolean
  connecting: boolean
  publicKey: string | null
  address: Address | null
  signer: TransactionSigner | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  setSigner: (signer: TransactionSigner | null) => void
  
  // New wallet adapter state
  /** Available wallet adapters */
  wallets?: Array<{
    name: string
    icon: string
    installed: boolean
    adapter: WalletAdapter
  }>
  /** Select a specific wallet adapter */
  select?: (walletName: string) => Promise<void>
  /** Currently selected wallet adapter name */
  selectedWallet?: string | null
}

/**
 * Clean, production-ready wallet hook following Kit 2.0 patterns.
 * Now supports both wallet adapters and direct signer injection.
 */
export function useWallet(options: UseWalletOptions = {}): WalletState {
  const { 
    signer: initialSigner, 
    onConnect, 
    onDisconnect, 
    developmentMode = false,
    adapters = [],
    autoConnect = false,
    preferredAdapter
  } = options
  
  // Pure React state for direct signer mode
  const [directSigner, setDirectSigner] = useState<TransactionSigner | null>(initialSigner || null)
  const [directConnecting, setDirectConnecting] = useState(false)
  
  // Wallet adapters management (only if adapters provided)
  const walletAdapters = adapters.length > 0 ? useWalletAdapters({
    adapters,
    autoConnect,
    preferredAdapter
  }) : null
  
  // Optionally log adapter mismatch situations in development only
  // Silenced by default for production ergonomics

  // Determine the current signer source
  const adapterSigner = walletAdapters?.connectedAdapter?.getSigner() || null
  const currentSigner = adapterSigner || directSigner
  
  // Avoid noisy logs in production
  
  
  
  const connected = !!currentSigner
  const connecting = directConnecting || (walletAdapters?.connecting ?? false)
  const publicKey = currentSigner?.address || null
  const address = currentSigner?.address || null
  
  const handleAdapterSignerChange = useCallback((newSigner: TransactionSigner | null) => {
    if (newSigner) {
      onConnect?.(newSigner)
    } else {
      onDisconnect?.()
    }
  }, [onConnect, onDisconnect])
  
  // Watch for adapter signer changes
  const [prevAdapterSigner, setPrevAdapterSigner] = useState<TransactionSigner | null>(null)
  if (adapterSigner !== prevAdapterSigner) {
    setPrevAdapterSigner(adapterSigner)
    handleAdapterSignerChange(adapterSigner)
  }

  const connect = useCallback(async () => {
    if (connecting) return
    
    // If we have adapters but none selected, throw helpful error
    if (walletAdapters && !walletAdapters.connectedAdapter) {
      throw new Error('No wallet selected. Use select() to choose a wallet, or provide adapters with autoConnect.')
    }
    
    // If we have adapters, use the adapter system
    if (walletAdapters && walletAdapters.connectedAdapter) {
      // Already connected through adapter
      return
    }
    
    // Fallback to direct signer mode
    setDirectConnecting(true)
    
    try {
      let newSigner: TransactionSigner

      if (developmentMode) {
        newSigner = await generateKeyPairSigner()
      } else {
        throw new Error('Production mode requires wallet adapter. Use developmentMode: true for demo, or provide adapters array.')
      }

      setDirectSigner(newSigner)
      
      onConnect?.(newSigner)
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      throw error
    } finally {
      setDirectConnecting(false)
    }
  }, [connecting, developmentMode, onConnect, walletAdapters])

  const disconnect = useCallback(async () => {
    try {
      if (walletAdapters?.connectedAdapter) {
        await walletAdapters.disconnect()
      }
      
      setDirectSigner(null)
      
      onDisconnect?.()
      
      
    } catch (error) {
      
      throw error
    }
  }, [onDisconnect, walletAdapters])

  const handleSetSigner = useCallback((newSigner: TransactionSigner | null) => {
    setDirectSigner(newSigner)
    
    if (newSigner) {
      onConnect?.(newSigner)
    } else {
      onDisconnect?.()
    }
  }, [onConnect, onDisconnect])

  const wallets = walletAdapters ? walletAdapters.adapters.map(info => ({
    name: info.name,
    icon: info.icon,
    installed: info.installed,
    adapter: info.adapter
  })) : undefined

  return {
    connected,
    connecting,
    publicKey,
    address,
    signer: currentSigner,
    connect,
    disconnect,
    setSigner: handleSetSigner,
    wallets,
    select: walletAdapters?.select,
    selectedWallet: walletAdapters?.selectedAdapterName
  }
}