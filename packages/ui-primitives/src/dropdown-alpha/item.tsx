import React from 'react'
import { useDropdownContext } from './context'
import type { DropdownItemProps } from './types'

export function DropdownItem({ children, onSelect, className }: DropdownItemProps) {
  const { onOpenChange } = useDropdownContext()
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={className}
      style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}
      onClick={(e) => {
        onSelect?.(e)
        onOpenChange?.(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(e)
          onOpenChange?.(false)
        }
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.backgroundColor = '#f3f4f6'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.backgroundColor = 'transparent'
      }}
    >
      {children}
    </div>
  )
}


