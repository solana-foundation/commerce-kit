import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDropdownContext } from './context'

export function DropdownContent({ children, className, align = 'end' }: { children: React.ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) {
  const { open, onOpenChange, modal, triggerEl } = useDropdownContext()
  const ref = useRef<HTMLDivElement | null>(null)
  const [styles, setStyles] = useState<React.CSSProperties>({ position: 'fixed', top: 0, left: 0 })

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

  // Positioning relative to viewport (fixed) to avoid offset parent issues
  useLayoutEffect(() => {
    if (!open || !triggerEl || !ref.current) return
    const update = () => {
      if (!triggerEl || !ref.current) return
      const triggerRect = triggerEl.getBoundingClientRect()
      const menu = ref.current
      const menuRect = menu.getBoundingClientRect()
      let left = triggerRect.left
      if (align === 'center') left = triggerRect.left + (triggerRect.width / 2) - (menuRect.width / 2)
      if (align === 'end') left = triggerRect.right - menuRect.width
      const top = triggerRect.bottom + 8
      const maxLeft = Math.max(8, Math.min(left, (window.innerWidth - menuRect.width - 8)))
      const maxTop = Math.max(8, Math.min(top, (window.innerHeight - menuRect.height - 8)))
      setStyles({ position: 'fixed', top: Math.round(maxTop), left: Math.round(maxLeft), zIndex: 50 })
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
  }, [open, triggerEl, align])

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


