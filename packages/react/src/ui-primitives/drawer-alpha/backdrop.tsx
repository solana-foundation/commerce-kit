import React, { useEffect } from 'react';
import { useDrawer } from './context';
import type { DrawerBackdropProps } from './types';
import { Z_INDEX } from '../constants';

export function DrawerBackdrop({ className, style, onClick }: DrawerBackdropProps) {
    const { isOpen } = useDrawer();

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className={className}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: Z_INDEX.BACKDROP,
                animation: 'drawer-backdrop-enter 200ms ease-out',
                ...style,
            }}
            onClick={onClick}
            aria-hidden="true"
        />
    );
}
