/**
 * Action Button Component
 * Primary action button for forms
 */

import React, { memo } from 'react';
import { getBorderRadius, getButtonShadow, getButtonBorder, getAccessibleTextColor } from '../../utils';
import type { ThemeConfig } from '../../types';

interface ActionButtonProps {
  theme: Required<ThemeConfig>;
  isDisabled?: boolean;
  isProcessing?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  solEquivalent?: string; // Optional SOL amount to display (e.g., "0.026 SOL")
}

export const ActionButton = memo<ActionButtonProps>(({
  theme,
  isDisabled = false,
  isProcessing = false,
  onClick,
  children,
  solEquivalent
}) => {
  const disabled = isDisabled || isProcessing;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="ck-action-button"
      style={{
        // Set CSS custom properties for dynamic theming
        '--primary-color': theme.primaryColor,
        '--secondary-color': theme.secondaryColor,
        '--button-border': getButtonBorder(theme),
        '--border-radius': getBorderRadius(theme.borderRadius),
        '--font-family': theme.fontFamily,
        '--button-shadow': getButtonShadow(theme.buttonShadow)
      } as React.CSSProperties}
      type="button"
    >
      <span className="ck-action-button-text">
        {children}
        {solEquivalent && (
          <span 
            className="ck-action-button-sol-equivalent"
            style={{
              marginLeft: '0.5rem',
              opacity: 0.6,
              fontSize: '0.875em',
              fontWeight: 400
            }}
          >
            ({solEquivalent})
          </span>
        )}
      </span>
    </button>
  );
});

ActionButton.displayName = 'ActionButton';
