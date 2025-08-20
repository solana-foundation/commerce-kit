/**
 * Action Button Component
 * Primary action button for forms
 */

import React, { memo } from 'react';
import { useButtonStyles } from '../../hooks/use-button-styles';
import type { ThemeConfig } from '../../types';

interface ActionButtonProps {
  theme: Required<ThemeConfig>;
  isDisabled?: boolean;
  isProcessing?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const ActionButton = memo<ActionButtonProps>(({
  theme,
  isDisabled = false,
  isProcessing = false,
  onClick,
  children
}) => {
  const disabled = isDisabled || isProcessing;
  const { styles, handlers } = useButtonStyles({ 
    theme, 
    isDisabled: disabled,
    variant: 'action' 
  });

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={styles}
      type="button"
      {...handlers}
    >
      <span style={{ fontSize: '19px', fontWeight: '600' }}>
        {children}
      </span>
    </button>
  );
});

ActionButton.displayName = 'ActionButton';
