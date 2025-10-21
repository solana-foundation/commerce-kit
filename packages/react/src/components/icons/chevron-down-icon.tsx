import React from 'react';

interface ChevronDownIconProps {
    size?: number;
    className?: string;
    'data-testid'?: string;
}

export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({ size = 12, className, 'data-testid': testId }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Chevron Down"
            data-testid={testId || 'chevron-down-icon'}
            data-size={size}
        >
            <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeOpacity="0.72"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
