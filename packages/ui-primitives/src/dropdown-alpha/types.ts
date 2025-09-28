import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

export interface DropdownRootProps {
    children: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
}

export interface DropdownItemProps {
    children: ReactNode;
    className?: string;
    onSelect?: (e?: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
}
