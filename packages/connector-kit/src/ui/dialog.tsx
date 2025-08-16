'use client'

import React, { memo } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogBackdrop, DialogClose } from '@solana-commerce/ui-primitives'

export interface ConnectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  children: React.ReactNode
  width?: number
}

export const ConnectorDialog = memo<ConnectorDialogProps>(({ open, onOpenChange, trigger, children, width = 320 }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogBackdrop />
      <DialogContent style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #00000060', overflow: 'hidden', width }}>
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <DialogClose asChild>
            <button aria-label="Close" type="button" style={{ background: 'none', border: '1px solid transparent', width: 32, height: 32, borderRadius: 16, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>×</button>
          </DialogClose>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  )
})

ConnectorDialog.displayName = 'ConnectorDialog'


