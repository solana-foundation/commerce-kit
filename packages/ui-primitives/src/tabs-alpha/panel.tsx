import React from 'react';
import { useTabs } from './context';
import type { TabsPanelProps } from './types';

export function TabsPanel({ children, value, className, style }: TabsPanelProps) {
    const { activeTab, isTransitioning } = useTabs();
    const isSelected = activeTab === value;

    return (
        <div
            role="tabpanel"
            id={`panel-${value}`}
            aria-labelledby={`tab-${value}`}
            data-state={isSelected ? 'active' : 'inactive'}
            data-transitioning={isTransitioning ? 'true' : undefined}
            className={className}
            style={{
                display: isSelected ? 'block' : 'none',
                ...style,
            }}
            suppressHydrationWarning={true}
        >
            {children}
        </div>
    );
}
