import React from 'react';
import { useTabs } from './context';
import type { TabsTabProps } from './types';

export function TabsTab({ 
  children, 
  value, 
  className, 
  style, 
  disabled = false,
  asChild = false 
}: TabsTabProps) {
  const { activeTab, setActiveTab, isTransitioning } = useTabs();
  const isSelected = activeTab === value;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        setActiveTab(value);
      }
    }
  };

  if (asChild && React.isValidElement(children)) {
    const existingProps = children.props as Record<string, any>;
    return React.cloneElement(children as React.ReactElement<any>, {
      role: 'tab',
      'aria-selected': isSelected,
      'aria-controls': `panel-${value}`,
      'data-state': isSelected ? 'active' : 'inactive',
      'data-disabled': disabled ? 'true' : undefined,
      'data-transitioning': isTransitioning ? 'true' : undefined,
      tabIndex: isSelected ? 0 : -1,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      disabled,
      className,
      style,
      suppressHydrationWarning: true,
      ...existingProps
    });
  }

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      data-state={isSelected ? 'active' : 'inactive'}
      data-disabled={disabled ? 'true' : undefined}
      data-transitioning={isTransitioning ? 'true' : undefined}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={className}
      style={style}
      suppressHydrationWarning={true}
    >
      {children}
    </button>
  );
} 