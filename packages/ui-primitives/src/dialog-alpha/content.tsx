import React from 'react';
import { useDialog } from './context';
import type { DialogContentProps } from './types';

export function DialogContent({ children, className, style }: DialogContentProps) {
  const context = useDialog();
  
  // Only render if dialog is open or if we don't have context (for SSR safety)
  if (context && !context.isOpen) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '0px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 50,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        pointerEvents: 'auto',
        ...style,
      }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
} 