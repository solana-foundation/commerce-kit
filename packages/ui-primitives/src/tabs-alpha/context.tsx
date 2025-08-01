import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { TabsContextType } from './types';

const TabsContext = createContext<TabsContextType | null>(null);

export function useTabs() {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  
  return context;
}

interface TabsProviderProps {
  children: ReactNode;
  value?: string | number;
  onValueChange?: (value: string | number) => void;
  defaultValue?: string | number;
  orientation?: 'horizontal' | 'vertical';
}

export function TabsProvider({ 
  children, 
  value: controlledValue, 
  onValueChange,
  defaultValue = '',
  orientation = 'horizontal'
}: TabsProviderProps) {
  // Track if this is the first client render (hydration)
  const [hasMounted, setHasMounted] = useState(false);
  
  // Use lazy initial state to prevent hydration mismatches
  const [internalValue, setInternalValue] = useState<string | number>(() => {
    // Always use the same value for both server and client
    return defaultValue;
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Set mounted flag after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Use controlled or uncontrolled state
  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = useCallback((newValue: string | number) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [controlledValue, onValueChange]);

  const setActiveTab = useCallback((tab: string | number) => {
    setIsTransitioning(true);
    handleValueChange(tab);
    // Reset transitioning after a brief delay
    setTimeout(() => setIsTransitioning(false), 100);
  }, [handleValueChange]);

  const value: TabsContextType = {
    activeTab,
    isTransitioning,
    setActiveTab,
    orientation
  };

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
} 