import React from 'react';
import { useDialog } from './context';

interface DialogPortalProps {
  children: React.ReactNode;
}

export function DialogPortal({ children }: DialogPortalProps): React.ReactElement | null {
  const context = useDialog();
  
  // Safely check if dialog is open, defaulting to showing content if no context (SSR safety)
  const shouldRender = !context || context.isOpen;
  
  if (!shouldRender) {
    return null;
  }

  // Render children directly since backdrop and content have proper positioning
  // This avoids react-dom dependency issues with Turbopack
  return <>{children}</>;
} 