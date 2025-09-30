import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { DialogContextType } from './types';

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
    // Handle SSR and edge cases
    if (typeof window === 'undefined' || typeof useContext === 'undefined') {
        // Return a safe default context for SSR or when React is not available
        return {
            isOpen: false,
            isTransitioning: false,
            open: () => {},
            close: () => {},
            toggle: () => {},
        } as DialogContextType;
    }

    const context = useContext(DialogContext);

    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }

    return context;
}

interface DialogProviderProps {
    children: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function DialogProvider({ children, open: controlledOpen, onOpenChange }: DialogProviderProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Use controlled or uncontrolled state
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = useCallback(
        (newOpen: boolean) => {
            if (controlledOpen === undefined) {
                setInternalOpen(newOpen);
            }
            onOpenChange?.(newOpen);
        },
        [controlledOpen, onOpenChange],
    );

    const open = useCallback(() => {
        setIsTransitioning(true);
        handleOpenChange(true);
        // Reset transitioning after a brief delay
        setTimeout(() => setIsTransitioning(false), 100);
    }, [handleOpenChange]);

    const close = useCallback(() => {
        setIsTransitioning(true);
        handleOpenChange(false);
        setTimeout(() => setIsTransitioning(false), 100);
    }, [handleOpenChange]);

    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }, [isOpen, open, close]);

    const value: DialogContextType = {
        isOpen,
        isTransitioning,
        open,
        close,
        toggle,
    };

    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}
