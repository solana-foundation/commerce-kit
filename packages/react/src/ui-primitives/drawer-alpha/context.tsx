import { createContext, useContext } from 'react';
import type { DrawerContextValue } from './types';

export const DrawerContext = createContext<DrawerContextValue | null>(null);

export function useDrawer(): DrawerContextValue {
    const context = useContext(DrawerContext);
    if (!context) {
        throw new Error('Drawer components must be used within DrawerRoot');
    }
    return context;
}

