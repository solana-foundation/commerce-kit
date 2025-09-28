import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnimationStyles } from '../../hooks/use-animation-styles';

// Mock the constants
vi.mock('../../constants/tip-modal', () => ({
    ANIMATION_STYLES: `
@keyframes sc-tip-modal-slide-up {
  0% { transform: translateY(16px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.sc-tip-modal-anim {
  transition: height 500ms cubic-bezier(0.4, 0, 0.2, 1) !important;
}
@media (prefers-reduced-motion: reduce) {
  .sc-tip-modal-anim { 
    animation: none !important;
    transition: none !important;
  }
}`.trim(),
}));

describe('useAnimationStyles', () => {
    const STYLE_ID = 'sc-tip-modal-anim';

    beforeEach(() => {
        // Clean up any existing style elements
        const existingStyle = document.getElementById(STYLE_ID);
        if (existingStyle) {
            existingStyle.remove();
        }
    });

    afterEach(() => {
        // Clean up after each test
        const styleEl = document.getElementById(STYLE_ID);
        if (styleEl) {
            styleEl.remove();
        }
    });

    it('should inject animation styles into document head', () => {
        // Initially no style element should exist
        expect(document.getElementById(STYLE_ID)).toBe(null);

        // Render the hook
        renderHook(() => useAnimationStyles());

        // Style element should now be present
        const styleEl = document.getElementById(STYLE_ID);
        expect(styleEl).toBeTruthy();
        expect(styleEl?.tagName).toBe('STYLE');
        expect(styleEl?.textContent).toContain('@keyframes sc-tip-modal-slide-up');
        expect(styleEl?.textContent).toContain('sc-tip-modal-anim');
        expect(styleEl?.textContent).toContain('prefers-reduced-motion');
    });

    it('should not duplicate style element if already exists', () => {
        // Pre-create a style element
        const existingStyle = document.createElement('style');
        existingStyle.id = STYLE_ID;
        existingStyle.textContent = 'existing styles';
        document.head.appendChild(existingStyle);

        // Render the hook
        renderHook(() => useAnimationStyles());

        // Should still only be one style element
        const styleElements = document.querySelectorAll(`#${STYLE_ID}`);
        expect(styleElements.length).toBe(1);

        // Should preserve the existing content (not overwrite)
        expect(styleElements[0]?.textContent).toBe('existing styles');
    });

    it('should handle multiple hook instances gracefully', () => {
        // Render the hook multiple times
        const { unmount: unmount1 } = renderHook(() => useAnimationStyles());
        const { unmount: unmount2 } = renderHook(() => useAnimationStyles());
        const { unmount: unmount3 } = renderHook(() => useAnimationStyles());

        // Should still only be one style element
        const styleElements = document.querySelectorAll(`#${STYLE_ID}`);
        expect(styleElements.length).toBe(1);
        expect(styleElements[0]?.textContent).toContain('@keyframes');

        // Clean up
        unmount1();
        unmount2();
        unmount3();
    });

    it('should work in browser environment with document', () => {
        // Verify document is available (should be with happy-dom)
        expect(typeof document).toBe('object');
        expect(document.getElementById).toBeDefined();
        expect(document.createElement).toBeDefined();
        expect(document.head).toBeDefined();

        renderHook(() => useAnimationStyles());

        const styleEl = document.getElementById(STYLE_ID);
        expect(styleEl).toBeTruthy();
        expect(document.head.contains(styleEl)).toBe(true);
    });

    it('should inject complete animation styles with proper formatting', () => {
        renderHook(() => useAnimationStyles());

        const styleEl = document.getElementById(STYLE_ID);
        expect(styleEl?.textContent).toMatchSnapshot();

        // Verify specific animation properties
        expect(styleEl?.textContent).toContain('transform: translateY(16px)');
        expect(styleEl?.textContent).toContain('opacity: 0');
        expect(styleEl?.textContent).toContain('transform: translateY(0)');
        expect(styleEl?.textContent).toContain('opacity: 1');
        expect(styleEl?.textContent).toContain('transition: height 500ms cubic-bezier(0.4, 0, 0.2, 1)');
        expect(styleEl?.textContent).toContain('animation: none !important');
        expect(styleEl?.textContent).toContain('transition: none !important');
    });

    it('should not interfere with existing head content', () => {
        // Add some existing content to head
        const existingMeta = document.createElement('meta');
        existingMeta.name = 'test';
        existingMeta.content = 'existing';
        document.head.appendChild(existingMeta);

        const initialHeadChildCount = document.head.children.length;

        renderHook(() => useAnimationStyles());

        // Should have added exactly one more element
        expect(document.head.children.length).toBe(initialHeadChildCount + 1);

        // Existing content should still be there
        expect(document.head.querySelector('meta[name="test"]')).toBeTruthy();

        // New style should be there too
        expect(document.getElementById(STYLE_ID)).toBeTruthy();
    });

    it('should handle hook unmount without removing styles', () => {
        const { unmount } = renderHook(() => useAnimationStyles());

        // Style should be added
        expect(document.getElementById(STYLE_ID)).toBeTruthy();

        // Unmount the hook
        unmount();

        // Style should still be present (no cleanup on unmount)
        expect(document.getElementById(STYLE_ID)).toBeTruthy();
    });

    it('should be idempotent across re-renders', () => {
        const { rerender } = renderHook(() => useAnimationStyles());

        const initialStyleEl = document.getElementById(STYLE_ID);
        expect(initialStyleEl).toBeTruthy();
        const initialContent = initialStyleEl?.textContent;

        // Re-render multiple times
        rerender();
        rerender();
        rerender();

        // Should still be the same element with same content
        const finalStyleEl = document.getElementById(STYLE_ID);
        expect(finalStyleEl).toBe(initialStyleEl); // Same element reference
        expect(finalStyleEl?.textContent).toBe(initialContent); // Same content

        // Should still only be one style element
        expect(document.querySelectorAll(`#${STYLE_ID}`).length).toBe(1);
    });
});
