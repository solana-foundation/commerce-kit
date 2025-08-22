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
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
          : (isHovered || isFocused)
            ? `${getButtonShadow(theme.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)`
            : getButtonShadow(theme.buttonShadow),
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
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
      transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      boxShadow: isSelected 
        ? `0 0 0 2px ${theme.primaryColor}60` 
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    } as React.CSSProperties;
  }, [theme, isDisabled, isHovered, isFocused, variant, isSelected, isPressed]);

  // Event handlers
  const handlers = {
    onMouseEnter: useCallback(() => {
      if (!isDisabled) setIsHovered(true);
    }, [isDisabled]),

    onMouseLeave: useCallback(() => {
      setIsHovered(false);
      setIsPressed(false);
    }, [setIsPressed]),

    onMouseDown: useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        setIsPressed(true);
      }
    }, [isDisabled, setIsPressed, variant]),

    onMouseUp: useCallback(() => {
      setIsPressed(false);
    }, [setIsPressed]),

    onTouchEnd: useCallback(() => {
      setIsPressed(false);
    }, [setIsPressed]),

    onFocus: useCallback(() => {
      if (!isDisabled && variant === 'action') {
        setIsFocused(true);
      }
    }, [isDisabled, variant]),

    onBlur: useCallback(() => {
      if (variant === 'action') {
        setIsFocused(false);
      }
    }, [variant]),
  };

  return {
    styles,
    handlers,
    isHovered,
    isFocused,
  };
}
