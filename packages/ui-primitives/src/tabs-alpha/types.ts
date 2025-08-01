import { ReactNode } from 'react';

export interface TabsState {
  activeTab: string | number;
  isTransitioning: boolean;
}

export interface TabsContextType {
  activeTab: string | number;
  isTransitioning: boolean;
  setActiveTab: (tab: string | number) => void;
  orientation: 'horizontal' | 'vertical';
}

export interface TabsRootProps {
  children: ReactNode;
  value?: string | number;
  onValueChange?: (value: string | number) => void;
  defaultValue?: string | number;
  orientation?: 'horizontal' | 'vertical';
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface TabsTabProps {
  children: ReactNode;
  value: string | number;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  asChild?: boolean;
}

export interface TabsPanelProps {
  children: ReactNode;
  value: string | number;
  className?: string;
  style?: React.CSSProperties;
} 