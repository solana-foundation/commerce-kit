'use client'

import React from 'react'
import { RootProvider } from 'fumadocs-ui/provider'
import { AppProvider, type MobileWalletAdapterConfig } from '@solana-commerce/connector-kit'
import { FloatingCommerceButton } from './components/floating-commerce-button'

export function ClientRootProvider({ children }: { children: React.ReactNode }) {
  const mobile: MobileWalletAdapterConfig = {
    appIdentity: {
      name: 'Commerce Docs',
      uri: process.env.NEXT_PUBLIC_SITE_URL,
    },
    remoteHostAuthority: process.env.NEXT_PUBLIC_MWA_REMOTE_HOST,
  }

  return (
    <AppProvider connectorConfig={{ autoConnect: false, debug: process.env.NODE_ENV !== 'production' }} mobile={mobile}>
      <RootProvider
        theme={{
          enabled: false,
          defaultTheme: 'light',
        }}
      >
        {children}
        <FloatingCommerceButton />
      </RootProvider>
    </AppProvider>
  )
}