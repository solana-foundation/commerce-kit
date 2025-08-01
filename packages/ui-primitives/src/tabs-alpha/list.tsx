import React from 'react';
import { useTabs } from './context';
import type { TabsListProps } from './types';

export function TabsList({ children, className, style }: TabsListProps) {
  const { orientation } = useTabs();

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={className}
      style={style}
      data-orientation={orientation}
    >
      {children}
    </div>
  );
} 