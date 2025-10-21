'use client';

import React from 'react';
import { Drawer, DrawerPortal, DrawerBackdrop, DrawerContent, DrawerTrigger } from '../../ui-primitives/drawer-alpha';

interface DrawerShellProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
    children: React.ReactNode;
}

export function DrawerShell({ open, onOpenChange, trigger, children }: DrawerShellProps) {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
            <DrawerPortal>
                <DrawerBackdrop onClick={() => onOpenChange(false)} />
                <DrawerContent>{children}</DrawerContent>
            </DrawerPortal>
        </Drawer>
    );
}
