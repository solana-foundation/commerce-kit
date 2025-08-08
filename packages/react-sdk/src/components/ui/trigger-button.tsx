import React, { useState, useMemo, memo } from 'react';
import { getBorderRadius, getButtonText, getButtonShadow, getButtonBorder, getAccessibleTextColor } from '../../utils';
import type { TriggerButtonProps } from '../../types';

export const TriggerButton = memo<TriggerButtonProps>(({ theme, mode, className, style, onClick, variant = 'default' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const buttonText = useMemo(() => getButtonText(mode), [mode]);
  const isIconOnly = variant === 'icon-only';

  // Solana Pay icon
  const solanaPayIcon = (
    <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
      <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
      <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
    </svg>
  );

  const buttonStyles: React.CSSProperties = useMemo(() => ({
    padding: isIconOnly ? '0.75rem' : '0.75rem 1.5rem',
    backgroundColor: isHovered ? theme.secondaryColor : theme.primaryColor,
    color: getAccessibleTextColor(isHovered ? theme.secondaryColor : theme.primaryColor),
    border: getButtonBorder(theme),
    borderRadius: getBorderRadius(theme.borderRadius),
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease',
    fontFamily: theme.fontFamily,
    minWidth: isIconOnly ? '44px' : 'auto',
    aspectRatio: isIconOnly ? '1' : 'auto',
    boxShadow: isHovered 
      ? `${getButtonShadow(theme.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)` 
      : getButtonShadow(theme.buttonShadow),
    transform: isPressed ? 'scale(0.97)' : isHovered ? 'scale(1)' : 'scale(1)',
    outlineOffset: 2,
    ...style
  }), [theme, isHovered, isPressed, style, isIconOnly]);

  return (
    <button
      className={className}
      style={buttonStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onFocus={(e) => { 
        setIsHovered(true);
        e.currentTarget.style.boxShadow = `${getButtonShadow(theme.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)`; 
      }}
      onBlur={(e) => { 
        setIsHovered(false);
        e.currentTarget.style.boxShadow = getButtonShadow(theme.buttonShadow); 
      }}
      type="button"
      aria-label={isIconOnly ? buttonText : undefined}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: isIconOnly ? '0' : '0.5rem' 
      }}>
        {solanaPayIcon}
        {!isIconOnly && buttonText}
      </div>
    </button>
  );
});

TriggerButton.displayName = 'TriggerButton';