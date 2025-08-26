'use client'

import { useState, useEffect, useCallback } from 'react'
// Legacy types - deprecated, use useStandardWallets instead
type WalletAdapter = any
type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UseWalletAdaptersOptions {
  /** Array of wallet adapters to manage */
  adapters: WalletAdapter[]
  /** Auto-connect to previously connected wallet on mount */
  autoConnect?: boolean
  /** Preferred wallet adapter name for auto-connect */
  preferredAdapter?: string
}

export interface WalletAdapterInfo {
  adapter: WalletAdapter
  name: string
  icon: string
  installed: boolean
  connected: boolean
  connecting: boolean
  status: WalletConnectionStatus
}

export interface UseWalletAdaptersReturn {
  /** All available wallet adapters with their info */
  adapters: WalletAdapterInfo[]
  /** Currently connected adapter */
  connectedAdapter: WalletAdapter | null
  /** Select and connect to a specific wallet adapter */
  select: (adapterName: string) => Promise<void>
  /** Disconnect from current adapter */
  disconnect: () => Promise<void>
  /** Currently selected adapter name */
  selectedAdapterName: string | null
  /** Whether any adapter is currently connecting */
  connecting: boolean
  /** Whether any adapter is connected */
  connected: boolean
}

const STORAGE_KEY = 'arc-selected-wallet'

/**
 * Hook to manage multiple wallet adapters - detection, selection, and connection
 */
export function useWalletAdapters(options: UseWalletAdaptersOptions): UseWalletAdaptersReturn {
  const { adapters, autoConnect = false, preferredAdapter } = options
  
  const [selectedAdapterName, setSelectedAdapterName] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [connectedAdapterName, setConnectedAdapterName] = useState<string | null>(null)
  
  // SSR-safe client detection
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // SSR-safe wallet detection
  const adapterInfos: WalletAdapterInfo[] = adapters.map(adapter => ({
    adapter,
    name: adapter.name,
    icon: adapter.icon,
    installed: isClient ? adapter.detect() : false, // Always false during SSR
    connected: adapter.connected,
    connecting: adapter.connecting,
    status: adapter.status
  }))
  
  const [, setForceUpdate] = useState({})
  const triggerUpdate = () => setForceUpdate({})
  
  useEffect(() => {
    const handleAdapterStateChange = () => {
      triggerUpdate()
    }
    
    // Listen to each adapter's events
    adapters.forEach(adapter => {
      adapter.on('connect', handleAdapterStateChange)
      adapter.on('disconnect', handleAdapterStateChange)
    })
    
    return () => {
      adapters.forEach(adapter => {
        adapter.off('connect', handleAdapterStateChange)
        adapter.off('disconnect', handleAdapterStateChange)
      })
    }
  }, [adapters])
  
  // Find currently connected adapter - try both reactive and explicit tracking
  const reactiveConnectedAdapter = adapters.find(adapter => adapter.connected) || null
  const explicitConnectedAdapter = connectedAdapterName ? (adapters.find(a => a.name === connectedAdapterName) || null) : null
  const connectedAdapter = reactiveConnectedAdapter || explicitConnectedAdapter
  const connected = !!connectedAdapter
  
  // Debug connection state (minimal logging)
  if (connected && connectedAdapter?.name && !reactiveConnectedAdapter) {
    console.log('🔄 [WalletAdapters] Using explicit adapter tracking for:', connectedAdapter.name)
  }
  
  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedName = JSON.parse(saved)
        // Only set if the adapter is available
        if (adapters.some(adapter => adapter.name === savedName)) {
          setSelectedAdapterName(savedName)
        } else {
          // Clean up invalid saved adapter
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.warn('Failed to load saved wallet preference:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [adapters])
  
  useEffect(() => {
    if (!autoConnect || connecting || connected) return
    
    const targetAdapterName = preferredAdapter || selectedAdapterName
    if (!targetAdapterName) return
    
    const targetAdapter = adapters.find(adapter => adapter.name === targetAdapterName)
    if (!targetAdapter?.detect()) return
    
    console.log(`🔄 [WalletAdapters] Auto-connecting to ${targetAdapterName}...`)
    
    // Use a small delay to ensure components are ready
    const timeoutId = setTimeout(() => {
      select(targetAdapterName).catch(error => {
        console.warn(`Failed to auto-connect to ${targetAdapterName}:`, error)
      })
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [autoConnect, preferredAdapter, selectedAdapterName, adapters, connecting, connected])
  
  // Save wallet preference to localStorage
  const saveWalletPreference = useCallback((adapterName: string) => {
    if (typeof localStorage === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adapterName))
    } catch (error) {
      console.warn('Failed to save wallet preference:', error)
    }
  }, [])
  
  const select = useCallback(async (adapterName: string) => {
    if (connecting) {
      console.log('⏳ [WalletAdapters] Connection already in progress, skipping...')
      return
    }
    
    const targetAdapter = adapters.find(adapter => adapter.name === adapterName)
    if (!targetAdapter) {
      throw new Error(`Wallet adapter "${adapterName}" not found`)
    }
    
    if (!targetAdapter.detect()) {
      throw new Error(`Wallet "${adapterName}" is not installed`)
    }
    
    if (targetAdapter.connected) {
      console.log(`✅ [WalletAdapters] ${adapterName} is already connected`)
      setSelectedAdapterName(adapterName)
      saveWalletPreference(adapterName)
      return
    }
    
    try {
      setConnecting(true)
      
      // Disconnect any currently connected adapter
      if (connectedAdapter && connectedAdapter !== targetAdapter) {
        console.log(`🔌 [WalletAdapters] Disconnecting from ${connectedAdapter.name}...`)
        await connectedAdapter.disconnect()
      }
      
      console.log(`🔗 [WalletAdapters] Connecting to ${adapterName}...`)
      await targetAdapter.connect()
      
      // Force a re-render immediately after connection to pick up the state change
      triggerUpdate()
      
      setSelectedAdapterName(adapterName)
      setConnectedAdapterName(adapterName)  // Explicitly track connected adapter
      saveWalletPreference(adapterName)
      
      console.log('✅ [WalletAdapters] Successfully connected to', adapterName)
      
    } catch (error) {
      console.error(`❌ [WalletAdapters] Failed to connect to ${adapterName}:`, error)
      throw error
    } finally {
      setConnecting(false)
    }
  }, [adapters, connecting, connectedAdapter, saveWalletPreference])
  
  const disconnect = useCallback(async () => {
    if (!connectedAdapter) {
      console.log('⚠️ [WalletAdapters] No adapter connected to disconnect from')
      return
    }
    
    try {
      console.log(`🔌 [WalletAdapters] Disconnecting from ${connectedAdapter.name}...`)
      await connectedAdapter.disconnect()
      
      // Clear saved preference
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      setSelectedAdapterName(null)
      setConnectedAdapterName(null)  // Clear explicit tracking
      
      console.log('✅ [WalletAdapters] Successfully disconnected')
      
    } catch (error) {
      console.error('❌ [WalletAdapters] Failed to disconnect:', error)
      throw error
    }
  }, [connectedAdapter])
  
  useEffect(() => {
    return () => {
      adapters.forEach(adapter => {
        try {
          adapter.destroy()
        } catch (error) {
          console.warn(`Warning: Failed to destroy adapter ${adapter.name}:`, error)
        }
      })
    }
  }, [adapters])
  
  return {
    adapters: adapterInfos,
    connectedAdapter,
    select,
    disconnect,
    selectedAdapterName,
    connecting,
    connected
  }
}