import React, { createContext, useContext } from 'react';

interface DropdownContextValue {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal: boolean;
    triggerEl: HTMLElement | null;
    setTriggerEl?: (el: HTMLElement | null) => void;
}

const DropdownContext = createContext<DropdownContextValue>({ modal: false, triggerEl: null });

export function DropdownProvider({
    children,
    open,
    onOpenChange,
    modal,
    value,
}: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (o: boolean) => void;
    modal: boolean;
    value: Omit<DropdownContextValue, 'open' | 'onOpenChange' | 'modal'>;
}) {
    return (
        <DropdownContext.Provider
            value={{ open, onOpenChange, modal, triggerEl: value.triggerEl, setTriggerEl: value.setTriggerEl }}
        >
            {children}
        </DropdownContext.Provider>
    );
}

export function useDropdownContext() {
    return useContext(DropdownContext);
}
