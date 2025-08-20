/**
 * Button Styles Hook
 * Provides optimized styling for interactive buttons
 */

import { useMemo, useState, useCallback } from 'react';
import { getButtonShadow, getButtonBorder, getAccessibleTextColor, getRadius } from '../utils';
import type { ThemeConfig } from '../types';

interface ButtonStyleHookOptions {
  theme: Required<ThemeConfig>;
  isDisabled?: boolean;
  variant?: 'action' | 'selection';
  isSelected?: boolean;
}

export function useButtonStyles({ 
  theme, 
  isDisabled = false, 
  variant = 'action',
  isSelected = false 
}: ButtonStyleHookOptions) {
  const [isHovered, setIsHovered] = useState(false);

  // Base styles computation
  const styles = useMemo(() => {
    const borderStyle = (() => {
      const b = getButtonBorder(theme);
      return b === 'none' ? '1.5px solid transparent' : b;
    })();

    if (variant === 'action') {
      return {
        width: '100%',
        padding: '1rem',
        backgroundColor: isDisabled 
          ? '#9ca3af' 
          : isHovered 
            ? theme.secondaryColor 
            : theme.primaryColor,
        color: isDisabled 
          ? 'white' 
          : getAccessibleTextColor(isHovered ? theme.secondaryColor : theme.primaryColor),
        border: isDisabled ? '1.5px solid transparent' : borderStyle,
        borderRadius: getRadius('button', theme.borderRadius),
        fontSize: '1rem',
        fontWeight: '600',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease',
        fontFamily: theme.fontFamily,
        boxShadow: isDisabled 
          ? 'none'
          : isHovered
            ? `${getButtonShadow(theme.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)`
            : getButtonShadow(theme.buttonShadow),
        transform: 'scale(1)',
        outlineOffset: 2,
      } as React.CSSProperties;
    }

    // Selection variant (for preset amounts, payment methods, etc.)
    return {
      border: isSelected ? `3px solid #ffffff` : '1px solid #e5e7eb',
      borderRadius: getRadius('preset', theme.borderRadius),
      backgroundColor: isSelected ? `${theme.primaryColor}10` : '#ffffff',
      color: isSelected ? 'rgba(0, 0, 0, 0.8)' : theme.textColor,
      fontSize: '19px',
      fontWeight: '400',
      cursor: 'pointer',
      transition: 'all 0.2s, transform 0.1s ease',
      transform: 'scale(1)',
      boxShadow: isSelected 
        ? `0 0 0 2px ${theme.primaryColor}60` 
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    } as React.CSSProperties;
  }, [theme, isDisabled, isHovered, variant, isSelected]);

  // Event handlers
  const handlers = {
    onMouseEnter: useCallback(() => {
      if (!isDisabled) setIsHovered(true);
    }, [isDisabled]),

    onMouseLeave: useCallback(() => {
      setIsHovered(false);
    }, []),

    onMouseDown: useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        e.currentTarget.style.transform = variant === 'action' ? 'scale(0.97)' : 'scale(0.98)';
      }
    }, [isDisabled, variant]),

    onMouseUp: useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'scale(1)';
    }, []),

    onFocus: useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
      if (!isDisabled && variant === 'action') {
        setIsHovered(true);
        e.currentTarget.style.boxShadow = `${getButtonShadow(theme.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)`;
      }
    }, [isDisabled, variant, theme]),

    onBlur: useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
      if (variant === 'action') {
        setIsHovered(false);
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = getButtonShadow(theme.buttonShadow);
        }
      }
    }, [isDisabled, variant, theme]),
  };

  return {
    styles,
    handlers,
    isHovered,
  };
}
