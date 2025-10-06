'use client';

import React from 'react';
import { useMobileDetection } from '../../hooks/use-mobile-detection';
import { ModalShell } from './modal-shell';
import { DrawerShell } from './drawer-shell';

interface ResponsiveShellProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Responsive shell that automatically renders a drawer on mobile
 * and a modal on desktop for optimal UX on all devices
 */
export function ResponsiveShell({ open, onOpenChange, trigger, children }: ResponsiveShellProps) {
    const isMobile = useMobileDetection();

    // Use drawer on mobile, modal on desktop
    if (isMobile) {
        return (
            <DrawerShell open={open} onOpenChange={onOpenChange} trigger={trigger}>
                {children}
            </DrawerShell>
        );
    }

    return (
        <ModalShell open={open} onOpenChange={onOpenChange} trigger={trigger}>
            {children}
        </ModalShell>
    );
}

