import type { ReactNode } from 'react';

export interface DrawerContextValue {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export interface DrawerRootProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
}

export interface DrawerTriggerProps {
    asChild?: boolean;
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export interface DrawerContentProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    labelledById?: string;
    describedById?: string;
    autoFocus?: boolean;
}

export interface DrawerBackdropProps {
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export interface DrawerPortalProps {
    children: ReactNode;
}

export interface DrawerHandleProps {
    className?: string;
    style?: React.CSSProperties;
}
