import React from 'react';
import { useDialog } from './context';
import type { DialogBackdropProps } from './types';

export function DialogBackdrop({ className, style, onClick }: DialogBackdropProps) {
  const context = useDialog();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (context && context.close) {
      context.close();
    }
  };

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 40,
        cursor: 'pointer',
        ...style,
      }}
      onClick={handleClick}
    />
  );
} 