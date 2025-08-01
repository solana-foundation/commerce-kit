import React from 'react';
import { TabsRoot } from './root';
import { TabsList } from './list';
import { TabsTab } from './tab';
import { TabsPanel } from './panel';
import type { TabsRootProps, TabsListProps, TabsTabProps, TabsPanelProps } from './types';

interface TabsProps extends Omit<TabsRootProps, 'children'> {
  tabs: Array<{
    value: string | number;
    label: React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  listProps?: Omit<TabsListProps, 'children'>;
  tabProps?: Omit<TabsTabProps, 'children' | 'value'>;
  panelProps?: Omit<TabsPanelProps, 'children' | 'value'>;
}

export function Tabs({ 
  tabs, 
  listProps, 
  tabProps, 
  panelProps, 
  ...rootProps 
}: TabsProps) {
  return (
    <TabsRoot {...rootProps}>
      <TabsList {...listProps}>
        {tabs.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            {...tabProps}
          >
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsPanel key={tab.value} value={tab.value} {...panelProps}>
          {tab.content}
        </TabsPanel>
      ))}
    </TabsRoot>
  );
} 