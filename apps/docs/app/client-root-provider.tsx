'use client'

import React, { type ReactNode, useMemo, useState } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { AppProvider } from '@solana-commerce/connector-kit'
import { ArcProvider } from '@solana-commerce/solana-hooks/react'
// Removed unused createProvider import
import { FloatingCommerceButton } from './components/floating-commerce-button'

export function ClientRootProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { 
      queries: { 
        staleTime: 5 * 60 * 1000, 
        retry: 3 
      } 
    }
  }))

  const arcConfig = useMemo(() => ({
    network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'mainnet' | 'devnet' | 'testnet' | undefined) || 'devnet',
    rpcUrl:
      (process.env.NEXT_PUBLIC_SOLANA_RPC_URL && process.env.NEXT_PUBLIC_SOLANA_RPC_URL.trim()) ||
      ((process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet')
        ? 'https://api.devnet.solana.com'
        : (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'testnet')
          ? 'https://api.testnet.solana.com'
          : 'https://api.mainnet-beta.solana.com'),
    autoConnect: true,
    // Removed unused providers array - ArcWebClientConfig doesn't support it
  }), [])


  return (
    <AppProvider 
      connectorConfig={{ 
        autoConnect: false, 
        debug: process.env.NODE_ENV !== 'production' 
      }} 
    >
      <ArcProvider config={arcConfig} queryClient={queryClient}>
        <>
          {children}
          <FloatingCommerceButton />
        </>
      </ArcProvider>
    </AppProvider>
  )
}