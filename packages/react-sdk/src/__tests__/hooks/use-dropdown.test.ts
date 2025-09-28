import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDropdown } from '../../hooks/use-dropdown';

describe('useDropdown', () => {
    // Mock DOM events
    let mockElement: HTMLDivElement;

    beforeEach(() => {
        mockElement = document.createElement('div');
        document.body.appendChild(mockElement);

        // Reset any event listeners
        document.removeAllListeners?.();
    });

    afterEach(() => {
        // Clean up
        if (mockElement && document.body.contains(mockElement)) {
            document.body.removeChild(mockElement);
        }
        vi.restoreAllMocks();
    });

    describe('Initial State', () => {
        it('should initialize with default closed state', () => {
            const { result } = renderHook(() => useDropdown());

            expect(result.current.isOpen).toBe(false);
            expect(result.current.selectedValue).toBe(null);
            expect(result.current.ref.current).toBe(null);
        });

        it('should initialize with custom initial open state', () => {
            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            expect(result.current.isOpen).toBe(true);
            expect(result.current.selectedValue).toBe(null);
        });
    });

    describe('State Management', () => {
        it('should open dropdown', () => {
            const { result } = renderHook(() => useDropdown());

            act(() => {
                result.current.open();
            });

            expect(result.current.isOpen).toBe(true);
        });

        it('should close dropdown', () => {
            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            expect(result.current.isOpen).toBe(true);

            act(() => {
                result.current.close();
            });

            expect(result.current.isOpen).toBe(false);
        });

        it('should toggle dropdown state', () => {
            const { result } = renderHook(() => useDropdown());

            // Toggle open
            act(() => {
                result.current.toggle();
            });
            expect(result.current.isOpen).toBe(true);

            // Toggle closed
            act(() => {
                result.current.toggle();
            });
            expect(result.current.isOpen).toBe(false);
        });

        it('should select value and close on select by default', () => {
            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            act(() => {
                result.current.select('test-value');
            });

            expect(result.current.selectedValue).toBe('test-value');
            expect(result.current.isOpen).toBe(false);
        });

        it('should select value without closing when closeOnSelect is false', () => {
            const { result } = renderHook(() =>
                useDropdown({
                    initialOpen: true,
                    closeOnSelect: false,
                }),
            );

            act(() => {
                result.current.select('test-value');
            });

            expect(result.current.selectedValue).toBe('test-value');
            expect(result.current.isOpen).toBe(true);
        });

        it('should clear selected value', () => {
            const { result } = renderHook(() => useDropdown());

            // First select a value
            act(() => {
                result.current.select('test-value');
            });
            expect(result.current.selectedValue).toBe('test-value');

            // Then clear it
            act(() => {
                result.current.clear();
            });
            expect(result.current.selectedValue).toBe(null);
        });
    });

    describe('Type Safety', () => {
        it('should work with typed values', () => {
            interface TestItem {
                id: number;
                name: string;
            }

            const { result } = renderHook(() => useDropdown<TestItem>());

            const testItem: TestItem = { id: 1, name: 'Test Item' };

            act(() => {
                result.current.select(testItem);
            });

            expect(result.current.selectedValue).toEqual(testItem);
            expect(result.current.selectedValue?.id).toBe(1);
            expect(result.current.selectedValue?.name).toBe('Test Item');
        });

        it('should work with primitive types', () => {
            const { result } = renderHook(() => useDropdown<string>());

            act(() => {
                result.current.select('string-value');
            });

            expect(result.current.selectedValue).toBe('string-value');
        });
    });

    describe('Click Outside Behavior', () => {
        it('should close on click outside when enabled (default)', () => {
            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            // Set up ref
            act(() => {
                result.current.ref.current = mockElement;
            });

            expect(result.current.isOpen).toBe(true);

            // Click outside
            act(() => {
                const outsideElement = document.createElement('div');
                document.body.appendChild(outsideElement);

                const clickEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    target: outsideElement,
                } as any);

                document.dispatchEvent(clickEvent);
            });

            expect(result.current.isOpen).toBe(false);
        });

        it('should not close on click inside', () => {
            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            // Set up ref
            act(() => {
                result.current.ref.current = mockElement;
            });

            expect(result.current.isOpen).toBe(true);

            // Click inside - need to dispatch from the element itself
            act(() => {
                const clickEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                });

                // Define the event target as the mockElement
                Object.defineProperty(clickEvent, 'target', {
                    value: mockElement,
                    writable: false,
                });

                document.dispatchEvent(clickEvent);
            });

            expect(result.current.isOpen).toBe(true);
        });

        it('should not close on click outside when closeOnClickOutside is false', () => {
            const { result } = renderHook(() =>
                useDropdown({
                    initialOpen: true,
                    closeOnClickOutside: false,
                }),
            );

            // Set up ref
            act(() => {
                result.current.ref.current = mockElement;
            });

            expect(result.current.isOpen).toBe(true);

            // Click outside
            act(() => {
                const outsideElement = document.createElement('div');
                document.body.appendChild(outsideElement);

                const clickEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    target: outsideElement,
                } as any);

                document.dispatchEvent(clickEvent);
            });

            expect(result.current.isOpen).toBe(true);
        });
    });

    describe('Keyboard Behavior', () => {
        it('should close on Escape key', () => {
            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            expect(result.current.isOpen).toBe(true);

            // Press Escape
            act(() => {
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    bubbles: true,
                });

                document.dispatchEvent(escapeEvent);
            });

            expect(result.current.isOpen).toBe(false);
        });

        it('should not close on other keys', () => {
            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            expect(result.current.isOpen).toBe(true);

            // Press other keys
            const keys = ['Enter', 'Space', 'ArrowDown', 'ArrowUp', 'Tab'];

            keys.forEach(key => {
                act(() => {
                    const keyEvent = new KeyboardEvent('keydown', {
                        key,
                        bubbles: true,
                    });

                    document.dispatchEvent(keyEvent);
                });

                expect(result.current.isOpen).toBe(true);
            });
        });

        it('should not add escape listener when closed', () => {
            const { result } = renderHook(() => useDropdown());

            expect(result.current.isOpen).toBe(false);

            // Press Escape (should do nothing)
            act(() => {
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    bubbles: true,
                });

                document.dispatchEvent(escapeEvent);
            });

            expect(result.current.isOpen).toBe(false);
        });
    });

    describe('Event Listener Cleanup', () => {
        it('should clean up event listeners on unmount', () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

            const { unmount } = renderHook(() => useDropdown({ initialOpen: true }));

            // Should have added listeners
            expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            unmount();

            // Should have removed listeners
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        it('should clean up listeners when dropdown closes', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

            const { result } = renderHook(() => useDropdown({ initialOpen: true }));

            // Close dropdown
            act(() => {
                result.current.close();
            });

            // Should have cleaned up listeners
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });

    describe('Ref Management', () => {
        it('should provide a ref object', () => {
            const { result } = renderHook(() => useDropdown<any, HTMLDivElement>());

            expect(result.current.ref).toBeDefined();
            expect(result.current.ref.current).toBe(null);

            // Simulate setting the ref
            act(() => {
                result.current.ref.current = mockElement;
            });

            expect(result.current.ref.current).toBe(mockElement);
        });

        it('should work with different element types', () => {
            const { result } = renderHook(() => useDropdown<any, HTMLSelectElement>());

            const selectElement = document.createElement('select');

            act(() => {
                result.current.ref.current = selectElement;
            });

            expect(result.current.ref.current).toBe(selectElement);
            expect(result.current.ref.current.tagName).toBe('SELECT');
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle rapid state changes', () => {
            const { result } = renderHook(() => useDropdown());

            act(() => {
                // Rapid state changes
                result.current.open(); // isOpen = true
                result.current.close(); // isOpen = false
                result.current.toggle(); // isOpen = true
                result.current.select('value1'); // closes due to closeOnSelect=true, isOpen = false
                result.current.clear(); // selectedValue = null
                result.current.select('value2'); // closes again due to closeOnSelect=true, isOpen = false
                result.current.toggle(); // isOpen = true
            });

            expect(result.current.isOpen).toBe(true); // final state after toggle
            expect(result.current.selectedValue).toBe('value2');
        });

        it('should handle multiple selections', () => {
            const { result } = renderHook(() => useDropdown({ closeOnSelect: false }));

            const values = ['value1', 'value2', 'value3'];

            values.forEach(value => {
                act(() => {
                    result.current.select(value);
                });
                expect(result.current.selectedValue).toBe(value);
            });
        });

        it('should maintain stable function references', () => {
            const { result, rerender } = renderHook(() => useDropdown());

            const initialFunctions = {
                open: result.current.open,
                close: result.current.close,
                toggle: result.current.toggle,
                select: result.current.select,
                clear: result.current.clear,
            };

            // Re-render
            rerender();

            // Functions should remain the same
            expect(result.current.open).toBe(initialFunctions.open);
            expect(result.current.close).toBe(initialFunctions.close);
            expect(result.current.toggle).toBe(initialFunctions.toggle);
            expect(result.current.select).toBe(initialFunctions.select);
            expect(result.current.clear).toBe(initialFunctions.clear);
        });

        it('should handle null/undefined selections', () => {
            const { result } = renderHook(() => useDropdown());

            act(() => {
                result.current.select(null as any);
            });
            expect(result.current.selectedValue).toBe(null);

            act(() => {
                result.current.select(undefined as any);
            });
            expect(result.current.selectedValue).toBe(undefined);
        });
    });
});
