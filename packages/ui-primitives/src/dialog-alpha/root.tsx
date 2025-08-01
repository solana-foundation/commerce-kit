import React, { useEffect } from 'react';
import { DialogProvider } from './context';
import type { DialogRootProps } from './types';

export function DialogRoot({ children, open, onOpenChange }: DialogRootProps) {
  // Handle escape key and body scroll at the root level
  useEffect(() => {
    if (typeof window === 'undefined' || !open) return;

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
      }
    };

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onOpenChange]);

  return (
    <DialogProvider open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogProvider>
  );
} 