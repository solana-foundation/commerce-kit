import React from 'react';
import { useDialog } from './context';
import type { DialogBackdropProps } from './types';
import { Z_INDEX } from '../constants';

export function DialogBackdrop({ className, style, onClick }: DialogBackdropProps) {
  const context = useDialog();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent accidental interactions with content through backdrop
    e.stopPropagation();
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
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(3px)',
        zIndex: Z_INDEX.BACKDROP,
        cursor: 'pointer',
        ...style,
      }}
      onClick={handleClick}
      aria-hidden="true"
    />
  );
} 