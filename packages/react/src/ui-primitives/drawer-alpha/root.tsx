import React, { useState, useCallback, useMemo } from 'react';
import { DrawerContext } from './context';
import type { DrawerRootProps } from './types';

export function DrawerRoot({ open, onOpenChange, children }: DrawerRootProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const setIsOpen = useCallback(
        (newOpen: boolean) => {
            if (!isControlled) {
                setInternalOpen(newOpen);
            }
            onOpenChange?.(newOpen);
        },
        [isControlled, onOpenChange]
    );

    const contextValue = useMemo(
        () => ({
            isOpen,
            setIsOpen,
        }),
        [isOpen, setIsOpen]
    );

    return <DrawerContext.Provider value={contextValue}>{children}</DrawerContext.Provider>;
}
