import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDropdownContext } from './context'
import { Z_INDEX } from '../constants'

export function DropdownContent({ children, className, align = 'end' }: { children: React.ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) {
  const { open, onOpenChange, modal, triggerEl } = useDropdownContext()
  const ref = useRef<HTMLDivElement | null>(null)
  
  // Detect if we're in an iframe context
  const isInIframe = typeof window !== 'undefined' && window !== window.parent
  
  // Auto-detect iframe context for positioning
  
  const [styles, setStyles] = useState<React.CSSProperties>(() => 
    isInIframe 
      ? { position: 'absolute', top: '100%', left: 0, marginTop: '4px' }
      : { position: 'fixed', top: 0, left: 0 }
  )

  // Click outside to close. Ignore clicks on trigger.
  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      const clickedMenu = ref.current?.contains(target)
      const clickedTrigger = (triggerEl && triggerEl.contains(target)) || false
      if (!clickedMenu && !clickedTrigger) onOpenChange?.(false)
    }
    document.addEventListener('mousedown', onDocMouseDown, true)
    return () => document.removeEventListener('mousedown', onDocMouseDown, true)
  }, [open, onOpenChange, triggerEl])

  // Positioning strategy based on context
  useLayoutEffect(() => {
    if (!open || !triggerEl || !ref.current) return
    
    if (isInIframe) {
      // Use simple static positioning that we know works in iframes
      const iframeStyles: React.CSSProperties = {
        position: 'absolute', // This worked before!
        display: 'block',
        marginTop: '4px',
        zIndex: Z_INDEX.OVERLAY_CONTENT,
      }
      
      setStyles(iframeStyles)
      return
    }
    
    // Normal viewport positioning for non-iframe context
    const update = () => {
      if (!triggerEl || !ref.current) return
      const triggerRect = triggerEl.getBoundingClientRect()
      const menu = ref.current
      const menuRect = menu.getBoundingClientRect()
      let left = triggerRect.left
      if (align === 'center') left = triggerRect.left + (triggerRect.width / 2) - (menuRect.width / 2)
      if (align === 'end') left = triggerRect.right - menuRect.width
      const top = triggerRect.bottom + 8
      // Use document.documentElement dimensions for better iframe compatibility
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      const viewportHeight = document.documentElement.clientHeight || window.innerHeight
      const maxLeft = Math.max(8, Math.min(left, (viewportWidth - menuRect.width - 8)))
      const maxTop = Math.max(8, Math.min(top, (viewportHeight - menuRect.height - 8)))
      setStyles({ position: 'fixed', top: Math.round(maxTop), left: Math.round(maxLeft), zIndex: Z_INDEX.OVERLAY_CONTENT })
    }
    // Initial position
    update()
    // Reposition on resize/scroll
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, triggerEl, align, isInIframe])

  if (!open) return null
  
  return (
    <div
      role={modal ? 'dialog' : 'menu'}
      ref={ref}
      className={className}
      style={styles}
      aria-modal={modal || undefined}
    >
      {children}
    </div>
  )
}


