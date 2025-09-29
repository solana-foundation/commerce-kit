import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock navigator.clipboard for copy-to-clipboard tests
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn(() => Promise.resolve()),
    },
    writable: true,
    configurable: true,
});

// Mock window.parent for iframe tests
Object.defineProperty(window, 'parent', {
    value: {
        postMessage: vi.fn(),
        location: {
            origin: 'http://localhost:3000',
        },
    },
    writable: true,
});

// Mock document.execCommand for fallback clipboard functionality
document.execCommand = vi.fn(() => true);
