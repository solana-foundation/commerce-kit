import React from 'react';

interface BackArrowIconProps {
    size?: number;
    className?: string;
    'data-testid'?: string;
}

export const BackArrowIcon: React.FC<BackArrowIconProps> = ({ 
    size = 16, 
    className, 
    'data-testid': testId 
}) => {
    return (
        <svg
            width={size}
            height={(size * 17) / 16} // Maintain aspect ratio
            viewBox="0 0 16 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Back"
            data-testid={testId || 'back-arrow-icon'}
            data-size={size}
        >
            <path
                d="M15 8.5H1M1 8.5L8 15.5M1 8.5L8 1.5"
                stroke="currentColor"
                strokeOpacity="0.72"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
