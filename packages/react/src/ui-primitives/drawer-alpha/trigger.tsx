import React, { cloneElement, isValidElement } from 'react';
import { useDrawer } from './context';
import type { DrawerTriggerProps } from './types';

export function DrawerTrigger({ asChild, children, className, style }: DrawerTriggerProps) {
    const { setIsOpen } = useDrawer();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(true);
    };

    if (asChild && isValidElement(children)) {
        return cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                handleClick(e);
                // Call original onClick if it exists
                (children as any).props?.onClick?.(e);
            },
        });
    }

    return (
        <button type="button" onClick={handleClick} className={className} style={style}>
            {children}
        </button>
    );
}

