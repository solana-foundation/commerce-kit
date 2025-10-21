import React, { cloneElement, isValidElement } from 'react';
import { useDrawer } from './context';

interface DrawerCloseProps {
    asChild?: boolean;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function DrawerClose({ asChild, children, className, style }: DrawerCloseProps) {
    const { setIsOpen } = useDrawer();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(false);
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
