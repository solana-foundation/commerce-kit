/**
 * Tabs Alpha - Simplified Tabs Implementation for Solana Commerce SDK
 * Based on the modular tabs system but streamlined for our use case
 */

export { TabsRoot } from './root';
export { TabsList } from './list';
export { TabsTab } from './tab';
export { TabsPanel } from './panel';
export { TabsProvider, useTabs } from './context';

// Compound component for easier usage
export { Tabs } from './tabs';

// Types
export type { TabsContextType, TabsState, TabsRootProps, TabsListProps, TabsTabProps, TabsPanelProps } from './types';
