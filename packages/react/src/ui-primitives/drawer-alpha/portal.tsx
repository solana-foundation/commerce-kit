import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DrawerPortalProps } from './types';

export function DrawerPortal({ children }: DrawerPortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || typeof window === 'undefined') {
        return null;
    }

    return createPortal(children, document.body);
}

