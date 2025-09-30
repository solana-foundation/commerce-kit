/**
 * useHover Hook
 * Simple hook for managing hover and press states
 */

import { useState, useCallback } from 'react';

interface UseHoverReturn {
    isHovered: boolean;
    isPressed: boolean;
    hoverHandlers: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
        onMouseDown: () => void;
        onMouseUp: () => void;
        onTouchStart: () => void;
        onTouchEnd: () => void;
    };
    setIsHovered: (hovered: boolean) => void;
    setIsPressed: (pressed: boolean) => void;
}

export function useHover(): UseHoverReturn {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setIsPressed(false);
    }, []);

    const handleMouseDown = useCallback(() => {
        setIsPressed(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsPressed(false);
    }, []);

    const handleTouchStart = useCallback(() => {
        setIsPressed(true);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsPressed(false);
    }, []);

    return {
        isHovered,
        isPressed,
        hoverHandlers: {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onMouseDown: handleMouseDown,
            onMouseUp: handleMouseUp,
            onTouchStart: handleTouchStart,
            onTouchEnd: handleTouchEnd,
        },
        setIsHovered,
        setIsPressed,
    };
}
