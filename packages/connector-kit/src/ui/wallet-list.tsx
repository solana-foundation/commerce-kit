'use client'

import React, { memo } from 'react'

export interface WalletListProps {
  wallets: Array<{ name: string; icon?: string; installed?: boolean }>
  onSelect: (name: string) => void
}

export const WalletList = memo<WalletListProps>(({ wallets, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {wallets?.map((w) => (
        <button
          key={w.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease, transform 0.1s ease',
          }}
          onClick={() => onSelect(w.name)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {w.icon ? <img src={w.icon} alt={`${w.name} wallet icon`} width={20} height={20} style={{ borderRadius: '50%' }} /> : null}
            <span style={{ fontSize: 14, color: '#111827' }}>{w.name}</span>
          </span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{w.installed ? 'Installed' : 'Not installed'}</span>
        </button>
      ))}
      
    </div>
  )
})

WalletList.displayName = 'WalletList'


