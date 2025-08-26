'use client'

import React, { type ReactNode, useMemo, useState } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { AppProvider, type MobileWalletAdapterConfig } from '@solana-commerce/connector-kit'
import { ArcProvider } from '@solana-commerce/solana-hooks/react'
import { createProvider } from '@solana-commerce/solana-hooks'
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
    providers: [
      // Provider structure ready for future swap integrations
      // Jupiter and other swap providers can be added here when implemented
      createProvider({
        swap: [
          // TODO: Add Jupiter or other swap providers when available
          // Example: createJupiter({ ... })
        ],
      }),
    ],
  }), [])

  const mobile: MobileWalletAdapterConfig = {
    appIdentity: {
      name: 'Commerce Docs',
      uri: process.env.NEXT_PUBLIC_SITE_URL,
    },
    remoteHostAuthority: process.env.NEXT_PUBLIC_MWA_REMOTE_HOST,
  }

  return (
    <AppProvider 
      connectorConfig={{ 
        autoConnect: false, 
        debug: process.env.NODE_ENV !== 'production' 
      }} 
      mobile={mobile}
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