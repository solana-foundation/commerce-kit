import React, { useEffect, useRef } from 'react';
import { useDialog } from './context';
import type { DialogContentProps } from './types';

// Inject keyframes for a CSS-only spring-like slide-up animation as early as possible (client only)
if (typeof document !== 'undefined') {
  const STYLE_ID = 'sc-dialog-alpha-animations';
  if (!document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
@keyframes sc-dialog-slide-up-spring {\n  0% { transform: translate(-50%, calc(-50% + 16px)); opacity: 0; }\n  100% { transform: translate(-50%, -50%); opacity: 1; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .sc-dialog-anim {\n    animation: none !important;\n  }\n}`;
    document.head.appendChild(styleEl);
  }
}

export function DialogContent({ children, className, style, labelledById, describedById, autoFocus = true }: DialogContentProps) {
  const context = useDialog();
  const ref = useRef<HTMLDivElement | null>(null);
  
  // Only render if dialog is open or if we don't have context (for SSR safety)
  if (context && !context.isOpen) {
    return null;
  }

  // Manage initial focus for accessibility
  useEffect(() => {
    if (!autoFocus) return;
    if (context?.isOpen && ref.current) {
      // Focus the container so ESC works and screen readers enter the dialog
      ref.current.focus();
    }
  }, [context?.isOpen, autoFocus]);

  return (
    <div
      ref={ref}
      className={className ? `${className} sc-dialog-anim` : 'sc-dialog-anim'}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: style?.animation ?? 'sc-dialog-slide-up-spring 250ms ease-in',
        willChange: 'transform, opacity',
        padding: '0px',
        height: 'auto',
        width: '528px',
        transition: 'height 200ms ease-in',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 50,
        // maxWidth: '90vw',
        // maxHeight: '90vh',
        overflow: 'auto',
        pointerEvents: 'auto',
        backgroundColor: 'var(--color-background)',
        ...style,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledById}
      aria-describedby={describedById}
      tabIndex={-1}
    >
      {children}
    </div>
  );
} 