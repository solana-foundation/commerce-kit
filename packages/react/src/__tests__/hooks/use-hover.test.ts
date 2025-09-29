import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHover } from '../../hooks/use-hover';

describe('useHover', () => {
    beforeEach(() => {
        // Reset any global state if needed
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => useHover());

            expect(result.current.isHovered).toBe(false);
            expect(result.current.isPressed).toBe(false);
            expect(result.current.hoverHandlers).toEqual({
                onMouseEnter: expect.any(Function),
                onMouseLeave: expect.any(Function),
                onMouseDown: expect.any(Function),
                onMouseUp: expect.any(Function),
                onTouchStart: expect.any(Function),
                onTouchEnd: expect.any(Function),
            });
        });
    });

    describe('Mouse interactions', () => {
        it('should handle mouse enter correctly', () => {
            const { result } = renderHook(() => useHover());

            act(() => {
                result.current.hoverHandlers.onMouseEnter();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(false);
        });

        it('should handle mouse leave correctly', () => {
            const { result } = renderHook(() => useHover());

            // First set both states to true
            act(() => {
                result.current.setIsHovered(true);
                result.current.setIsPressed(true);
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(true);

            // Then trigger mouse leave
            act(() => {
                result.current.hoverHandlers.onMouseLeave();
            });

            expect(result.current.isHovered).toBe(false);
            expect(result.current.isPressed).toBe(false); // Should reset pressed state too
        });

        it('should handle mouse down correctly', () => {
            const { result } = renderHook(() => useHover());

            act(() => {
                result.current.hoverHandlers.onMouseDown();
            });

            expect(result.current.isPressed).toBe(true);
            expect(result.current.isHovered).toBe(false); // Should not affect hover state
        });

        it('should handle mouse up correctly', () => {
            const { result } = renderHook(() => useHover());

            // First set pressed state
            act(() => {
                result.current.hoverHandlers.onMouseDown();
            });

            expect(result.current.isPressed).toBe(true);

            // Then handle mouse up
            act(() => {
                result.current.hoverHandlers.onMouseUp();
            });

            expect(result.current.isPressed).toBe(false);
        });
    });

    describe('Touch interactions', () => {
        it('should handle touch start correctly', () => {
            const { result } = renderHook(() => useHover());

            act(() => {
                result.current.hoverHandlers.onTouchStart();
            });

            expect(result.current.isPressed).toBe(true);
            expect(result.current.isHovered).toBe(false); // Should not affect hover state
        });

        it('should handle touch end correctly', () => {
            const { result } = renderHook(() => useHover());

            // First set pressed state
            act(() => {
                result.current.hoverHandlers.onTouchStart();
            });

            expect(result.current.isPressed).toBe(true);

            // Then handle touch end
            act(() => {
                result.current.hoverHandlers.onTouchEnd();
            });

            expect(result.current.isPressed).toBe(false);
        });
    });

    describe('Manual state setters', () => {
        it('should allow manual hover state setting', () => {
            const { result } = renderHook(() => useHover());

            act(() => {
                result.current.setIsHovered(true);
            });

            expect(result.current.isHovered).toBe(true);

            act(() => {
                result.current.setIsHovered(false);
            });

            expect(result.current.isHovered).toBe(false);
        });

        it('should allow manual pressed state setting', () => {
            const { result } = renderHook(() => useHover());

            act(() => {
                result.current.setIsPressed(true);
            });

            expect(result.current.isPressed).toBe(true);

            act(() => {
                result.current.setIsPressed(false);
            });

            expect(result.current.isPressed).toBe(false);
        });
    });

    describe('Complex interaction scenarios', () => {
        it('should handle hover and press combination correctly', () => {
            const { result } = renderHook(() => useHover());

            // Mouse enter to start hover
            act(() => {
                result.current.hoverHandlers.onMouseEnter();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(false);

            // Mouse down while hovering
            act(() => {
                result.current.hoverHandlers.onMouseDown();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(true);

            // Mouse up while still hovering
            act(() => {
                result.current.hoverHandlers.onMouseUp();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(false);

            // Mouse leave to end hover
            act(() => {
                result.current.hoverHandlers.onMouseLeave();
            });

            expect(result.current.isHovered).toBe(false);
            expect(result.current.isPressed).toBe(false);
        });

        it('should handle press during hover followed by mouse leave', () => {
            const { result } = renderHook(() => useHover());

            // Start hover and press
            act(() => {
                result.current.hoverHandlers.onMouseEnter();
                result.current.hoverHandlers.onMouseDown();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(true);

            // Mouse leave should reset both states
            act(() => {
                result.current.hoverHandlers.onMouseLeave();
            });

            expect(result.current.isHovered).toBe(false);
            expect(result.current.isPressed).toBe(false);
        });

        it('should handle touch interactions independently of mouse', () => {
            const { result } = renderHook(() => useHover());

            // Set hover state via mouse
            act(() => {
                result.current.hoverHandlers.onMouseEnter();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(false);

            // Touch start should set pressed but not affect hover
            act(() => {
                result.current.hoverHandlers.onTouchStart();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(true);

            // Touch end should only affect pressed
            act(() => {
                result.current.hoverHandlers.onTouchEnd();
            });

            expect(result.current.isHovered).toBe(true);
            expect(result.current.isPressed).toBe(false);
        });
    });

    describe('Handler stability', () => {
        it('should provide stable handler references', () => {
            const { result, rerender } = renderHook(() => useHover());

            const initialHandlers = result.current.hoverHandlers;

            // Force re-render
            rerender();

            expect(result.current.hoverHandlers).toStrictEqual(initialHandlers);
            expect(result.current.hoverHandlers.onMouseEnter).toBe(initialHandlers.onMouseEnter);
            expect(result.current.hoverHandlers.onMouseLeave).toBe(initialHandlers.onMouseLeave);
            expect(result.current.hoverHandlers.onMouseDown).toBe(initialHandlers.onMouseDown);
            expect(result.current.hoverHandlers.onMouseUp).toBe(initialHandlers.onMouseUp);
            expect(result.current.hoverHandlers.onTouchStart).toBe(initialHandlers.onTouchStart);
            expect(result.current.hoverHandlers.onTouchEnd).toBe(initialHandlers.onTouchEnd);
        });
    });

    describe('State independence', () => {
        it('should maintain independent hover and pressed states', () => {
            const { result } = renderHook(() => useHover());

            // Set pressed without hover
            act(() => {
                result.current.setIsPressed(true);
            });

            expect(result.current.isPressed).toBe(true);
            expect(result.current.isHovered).toBe(false);

            // Set hover without affecting pressed
            act(() => {
                result.current.setIsHovered(true);
            });

            expect(result.current.isPressed).toBe(true);
            expect(result.current.isHovered).toBe(true);

            // Clear pressed without affecting hover
            act(() => {
                result.current.setIsPressed(false);
            });

            expect(result.current.isPressed).toBe(false);
            expect(result.current.isHovered).toBe(true);
        });
    });

    describe('Multiple instances', () => {
        it('should maintain separate state for multiple hook instances', () => {
            const { result: result1 } = renderHook(() => useHover());
            const { result: result2 } = renderHook(() => useHover());

            // Set state on first instance
            act(() => {
                result1.current.setIsHovered(true);
                result1.current.setIsPressed(true);
            });

            // Second instance should remain unaffected
            expect(result1.current.isHovered).toBe(true);
            expect(result1.current.isPressed).toBe(true);
            expect(result2.current.isHovered).toBe(false);
            expect(result2.current.isPressed).toBe(false);

            // Set state on second instance
            act(() => {
                result2.current.setIsHovered(true);
            });

            // First instance should remain unchanged
            expect(result1.current.isHovered).toBe(true);
            expect(result1.current.isPressed).toBe(true);
            expect(result2.current.isHovered).toBe(true);
            expect(result2.current.isPressed).toBe(false);
        });
    });
});
