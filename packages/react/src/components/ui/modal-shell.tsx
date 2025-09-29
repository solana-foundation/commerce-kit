'use client';

import React from 'react';
import {
    Dialog,
    DialogPortal,
    DialogBackdrop,
    DialogContent,
    DialogTrigger,
} from '../../ui-primitives/react';

interface ModalShellProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
    children: React.ReactNode;
}

export function ModalShell({ open, onOpenChange, trigger, children }: ModalShellProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogPortal>
                <DialogBackdrop onClick={() => onOpenChange(false)} />
                <DialogContent>{children}</DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
