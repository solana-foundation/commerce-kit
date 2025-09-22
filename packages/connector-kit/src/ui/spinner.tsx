import type { CSSProperties } from 'react';
import { injectArcConnectorGlobalStyles } from './global-styles';

// Ensure keyframes are registered once globally
injectArcConnectorGlobalStyles();

interface SpinnerProps {
    size?: number;
    className?: string;
    color?: string;
    speedMs?: number;
}

export const Spinner = ({ size = 24, className, color = '#d1d5db', speedMs = 800 }: SpinnerProps) => {
    const containerStyle: CSSProperties = {
        display: 'inline-flex',
        width: size,
        height: size,
        color,
        opacity: 1,
        transform: 'scale(1)',
        animation: 'arc-spinner-enter 240ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
    };
    const svgStyle: CSSProperties = {
        transformOrigin: 'center',
        animation: `arc-spinner-rotate ${speedMs}ms linear infinite`,
    };
    return (
        <span className={className} style={containerStyle} aria-hidden>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                width={size}
                height={size}
                style={svgStyle}
                role="progressbar"
            >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
                <path
                    fill="currentColor"
                    opacity={0.75}
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </span>
    );
};
