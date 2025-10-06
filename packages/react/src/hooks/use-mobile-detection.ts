import { useState, useEffect } from 'react';

/**
 * Breakpoint for mobile detection (matches Tailwind 'md' breakpoint)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Detects if device has touch capability
 */
function hasTouchSupport(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy API
        navigator.msMaxTouchPoints > 0
    );
}

/**
 * Hook to detect if the user is on a mobile device
 * 
 * Considers both viewport width and touch capability for accurate detection
 * 
 * @returns boolean indicating if the device is mobile
 * 
 * @example
 * ```tsx
 * const isMobile = useMobileDetection();
 * return isMobile ? <MobileView /> : <DesktopView />;
 * ```
 */
export function useMobileDetection(): boolean {
    // SSR-safe default (assume desktop)
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Initial check
        const checkMobile = () => {
            const width = window.innerWidth;
            const hasTouch = hasTouchSupport();
            
            // Mobile if viewport is narrow OR has touch (tablets can be touch + wide)
            // But prioritize narrow viewport as the primary indicator
            setIsMobile(width < MOBILE_BREAKPOINT);
        };

        // Check immediately on mount
        checkMobile();

        // Listen for resize events
        window.addEventListener('resize', checkMobile);
        
        // Also listen for orientation change on mobile devices
        window.addEventListener('orientationchange', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, []);

    return isMobile;
}

/**
 * Hook variant that also returns viewport width for more granular control
 * 
 * @returns { isMobile: boolean, width: number, hasTouch: boolean }
 */
export function useMobileDetectionDetailed() {
    const [state, setState] = useState({
        isMobile: false,
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        hasTouch: false,
    });

    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const hasTouch = hasTouchSupport();
            
            setState({
                isMobile: width < MOBILE_BREAKPOINT,
                width,
                hasTouch,
            });
        };

        checkMobile();

        window.addEventListener('resize', checkMobile);
        window.addEventListener('orientationchange', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, []);

    return state;
}

