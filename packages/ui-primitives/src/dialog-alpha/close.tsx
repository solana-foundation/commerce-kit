import React from 'react';
import { useDialog } from './context';
import type { DialogCloseProps } from './types';

export function DialogClose({ children, asChild = false }: DialogCloseProps) {
    const context = useDialog();

    // Safely handle the close action
    const handleClose = () => {
        if (context && context.close) {
            context.close();
        }
    };

    if (asChild) {
        return (
            <span onClick={handleClose} style={{ cursor: 'pointer' }}>
                {children}
            </span>
        );
    }

    return (
        <button onClick={handleClose} type="button">
            {children}
        </button>
    );
}
