import React, { useEffect, useMemo, useState } from 'react'
import { DropdownProvider } from './context'
import type { DropdownRootProps } from './types'

export function DropdownRoot({ children, open, onOpenChange, modal = false }: DropdownRootProps) {
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null)
  // Close on Escape
  useEffect(() => {
    if (typeof window === 'undefined' || open == null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  return (
    <DropdownProvider open={open} onOpenChange={onOpenChange} modal={modal} value={{ triggerEl, setTriggerEl }}>
      {children}
    </DropdownProvider>
  )
}


