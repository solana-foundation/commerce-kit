import React from 'react';

interface SuccessIconProps {
    size?: number;
    className?: string;
    color?: string;
}

export const SuccessIcon: React.FC<SuccessIconProps> = ({ size = 24, className, color = '#10b981' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Success"
            data-testid="success-icon"
            data-size={size}
            data-color={color}
        >
            <path
                opacity="0.12"
                d="M15.9998 29.3332C23.3636 29.3332 29.3332 23.3636 29.3332 15.9998C29.3332 8.63604 23.3636 2.6665 15.9998 2.6665C8.63604 2.6665 2.6665 8.63604 2.6665 15.9998C2.6665 23.3636 8.63604 29.3332 15.9998 29.3332Z"
                fill={color}
            />
            <path
                d="M9.99984 15.9998L13.9998 19.9998L21.9998 11.9998M29.3332 15.9998C29.3332 23.3636 23.3636 29.3332 15.9998 29.3332C8.63604 29.3332 2.6665 23.3636 2.6665 15.9998C2.6665 8.63604 8.63604 2.6665 15.9998 2.6665C23.3636 2.6665 29.3332 8.63604 29.3332 15.9998Z"
                stroke={color}
                strokeWidth="2.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
