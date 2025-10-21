import React, { useEffect, useRef, useState } from 'react';
import { useDrawer } from './context';
import type { DrawerContentProps } from './types';
import { Z_INDEX } from '../constants';

// Inject drawer animations
if (typeof document !== 'undefined') {
    const STYLE_ID = 'sc-drawer-alpha-animations';
    if (!document.getElementById(STYLE_ID)) {
        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
@keyframes drawer-slide-up {
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes drawer-slide-down {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}

@keyframes drawer-backdrop-enter {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .sc-drawer-content {
    animation: none !important;
  }
}`;
        document.head.appendChild(styleEl);
    }
}

export function DrawerContent({
    children,
    className,
    style,
    labelledById,
    describedById,
    autoFocus = true,
}: DrawerContentProps) {
    const { isOpen, setIsOpen } = useDrawer();
    const ref = useRef<HTMLDivElement | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    // Touch gesture tracking
    const touchStartY = useRef<number | null>(null);
    const touchCurrentY = useRef<number | null>(null);
    const isDragging = useRef(false);

    // Manage initial focus for accessibility
    useEffect(() => {
        if (!autoFocus) return;
        if (isOpen && ref.current) {
            ref.current.focus();
        }
    }, [isOpen, autoFocus]);

    // Handle ESC key
    useEffect(() => {
        if (!isOpen) return;

        function handleEsc(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        }

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, setIsOpen]);

    // Touch gesture handlers for swipe-to-dismiss
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) return;
        touchStartY.current = touch.clientY;
        isDragging.current = true;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || touchStartY.current === null) return;

        const touch = e.touches[0];
        if (!touch) return;

        touchCurrentY.current = touch.clientY;
        const deltaY = touchCurrentY.current - touchStartY.current;

        // Only allow downward swipes
        if (deltaY > 0 && ref.current) {
            ref.current.style.transform = `translateY(${Math.max(0, deltaY)}px)`;
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging.current || touchStartY.current === null || touchCurrentY.current === null) {
            isDragging.current = false;
            touchStartY.current = null;
            touchCurrentY.current = null;
            return;
        }

        const deltaY = touchCurrentY.current - touchStartY.current;
        const threshold = 100; // pixels to trigger dismiss

        if (ref.current && touchStartY.current !== null && touchCurrentY.current !== null) {
            if (deltaY > threshold) {
                // Trigger close animation
                setIsClosing(true);
                ref.current.style.animation = 'drawer-slide-down 200ms ease-out';
                setTimeout(() => {
                    setIsOpen(false);
                    setIsClosing(false);
                }, 200);
            } else {
                // Snap back
                ref.current.style.transform = '';
            }
        }

        isDragging.current = false;
        touchStartY.current = null;
        touchCurrentY.current = null;
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div
            ref={ref}
            className={className ? `${className} sc-drawer-content` : 'sc-drawer-content'}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '90vh',
                backgroundColor: 'var(--color-background, #ffffff)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
                zIndex: Z_INDEX.OVERLAY_CONTENT,
                animation: 'drawer-slide-up 300ms cubic-bezier(0.32, 0.72, 0, 1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                // Safe area insets for notched devices
                paddingBottom: 'env(safe-area-inset-bottom)',
                ...style,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledById}
            aria-describedby={describedById}
            tabIndex={-1}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {children}
        </div>
    );
}
