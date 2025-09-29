import React, { useEffect } from 'react';
import { TabsProvider } from './context';
import type { TabsRootProps } from './types';

export function TabsRoot({ children, value, onValueChange, defaultValue, orientation = 'horizontal' }: TabsRootProps) {
    // Handle keyboard navigation at the root level
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle keyboard navigation if we're in a tabs context
            if (!event.target || !(event.target as Element).closest('[role="tablist"]')) {
                return;
            }

            const isHorizontal = orientation === 'horizontal';
            const previousKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
            const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

            if (event.key === previousKey || event.key === nextKey) {
                event.preventDefault();

                const tablist = (event.target as Element).closest('[role="tablist"]');
                if (!tablist) return;

                const tabs = Array.from(tablist.querySelectorAll('[role="tab"]:not([disabled])'));
                const currentIndex = tabs.indexOf(event.target as Element);

                let newIndex;
                if (event.key === nextKey) {
                    newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
                } else {
                    newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
                }

                const newTab = tabs[newIndex] as HTMLElement;
                if (newTab) {
                    newTab.focus();
                    newTab.click();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [orientation]);

    return (
        <TabsProvider value={value} onValueChange={onValueChange} defaultValue={defaultValue} orientation={orientation}>
            {children}
        </TabsProvider>
    );
}
