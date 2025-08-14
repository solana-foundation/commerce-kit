import React from 'react'
import { useDropdownContext } from './context'

interface DropdownTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function DropdownTrigger({ children, asChild = false }: DropdownTriggerProps) {
  const { open, onOpenChange, setTriggerEl } = useDropdownContext()

  const handleMouseDown = (e: React.MouseEvent) => {
    // Toggle on mouse down to avoid outside-click mousedown closing first
    e.preventDefault()
    e.stopPropagation()
    onOpenChange?.(!open)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpenChange?.(!open)
    }
  }
  
  if (asChild) {
    return (
      <span
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        ref={(el) => {
          setTriggerEl?.(el instanceof HTMLElement ? el : null)
        }}
      >
        {children}
      </span>
    )
  }

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      aria-haspopup="menu"
      ref={(el) => setTriggerEl?.(el)}
    >
      {children}
    </button>
  )
}


