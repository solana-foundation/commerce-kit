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
    const { overflow, paddingRight } = document.body.style as any;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open, onOpenChange]);

  return (
    <DialogProvider open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogProvider>
  );
} 