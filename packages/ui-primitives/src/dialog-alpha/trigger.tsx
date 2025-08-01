import React from 'react';
import { useDialog } from './context';
import type { DialogTriggerProps } from './types';

export function DialogTrigger({ children, asChild = false }: DialogTriggerProps) {
  const context = useDialog();
  
  // Safely handle the open action
  const handleOpen = () => {
    if (context && context.open) {
      context.open();
    }
  };

  if (asChild) {
    return (
      <span onClick={handleOpen} style={{ cursor: 'pointer' }}>
        {children}
      </span>
    );
  }

  return (
    <button onClick={handleOpen} type="button">
      {children}
    </button>
  );
} 