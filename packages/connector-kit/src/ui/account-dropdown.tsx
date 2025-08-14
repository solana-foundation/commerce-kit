'use client'

import React, { memo } from 'react'
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from '@arc/ui-primitives'

export interface AccountDropdownProps {
  label: string
  onDisconnect: () => Promise<void> | void
}

export const AccountDropdown = memo<AccountDropdownProps>(({ label, onDisconnect }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownRoot open={open} onOpenChange={setOpen}>
      <DropdownTrigger asChild>
        <button className="account-dropdown-trigger">
          {label}
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem 
          onSelect={async () => {
            try {
              await onDisconnect()
            } catch (error) {
              console.error('Failed to disconnect:', error)
              // Consider showing user-facing error message
            }
          }}
          className="account-dropdown-disconnect-item"
        >
          Disconnect
        </DropdownItem>
      </DropdownContent>
    </DropdownRoot>
  )
})

AccountDropdown.displayName = 'AccountDropdown'


