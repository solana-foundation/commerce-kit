/**
 * useThemeStyles Hook
 * Generate consistent CSS custom properties from theme config
 */

import { useMemo } from 'react';
import { getBorderRadius, getButtonShadow, getButtonBorder } from '../utils';
import type { ThemeConfig } from '../types';

interface UseThemeStylesOptions {
  theme: Required<ThemeConfig>;
  variant?: 'button' | 'input' | 'modal' | 'payment-method' | 'amount' | 'dropdown';
}

export function useThemeStyles({ theme, variant = 'button' }: UseThemeStylesOptions) {
  const styles = useMemo(() => {
    const baseStyles = {
      '--primary-color': theme.primaryColor,
      '--secondary-color': theme.secondaryColor,
      '--background-color': theme.backgroundColor,
      '--text-color': theme.textColor,
      '--text-color-60': `${theme.textColor}60`,
      '--text-color-70': `${theme.textColor}70`,
      '--font-family': theme.fontFamily,
      '--border-radius': getBorderRadius(theme.borderRadius),
    };

    // Add variant-specific styles
    switch (variant) {
      case 'button':
        return {
          ...baseStyles,
          '--button-border': getButtonBorder(theme),
          '--button-shadow': getButtonShadow(theme.buttonShadow),
        };
      
      case 'payment-method':
      case 'amount':
        return {
          ...baseStyles,
          '--primary-color-10': `${theme.primaryColor}10`,
          '--primary-color-60': `${theme.primaryColor}60`,
        };
      
      case 'modal':
        return {
          ...baseStyles,
          '--modal-border-radius': getBorderRadius(theme.borderRadius),
        };
      
      case 'dropdown':
        return {
          ...baseStyles,
          '--dropdown-radius': getBorderRadius(theme.borderRadius),
        };
      
      default:
        return baseStyles;
    }
  }, [theme, variant]);

  return styles as React.CSSProperties;
}
