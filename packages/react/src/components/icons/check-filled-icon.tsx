import React from 'react';

interface CheckFilledIconProps {
    size?: number;
    className?: string;
    color?: string;
    'data-testid'?: string;
}

export const CheckFilledIcon: React.FC<CheckFilledIconProps> = ({
    size = 16,
    className,
    color = '#22c55e',
    'data-testid': testId,
}) => {
    return (
        <svg
            width={size}
            height={(size * 11) / 16} // Maintain aspect ratio
            viewBox="0 0 16 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Check"
            data-testid={testId || 'check-filled-icon'}
            data-size={size}
            data-color={color}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.2559 0.41107C15.5814 0.736507 15.5814 1.26414 15.2559 1.58958L6.08926 10.7562C5.76382 11.0817 5.23618 11.0817 4.91074 10.7562L0.744078 6.58958C0.418641 6.26414 0.418641 5.73651 0.744078 5.41107C1.06951 5.08563 1.59715 5.08563 1.92259 5.41107L5.5 8.98848L14.0774 0.41107C14.4028 0.0856329 14.9305 0.0856329 15.2559 0.41107Z"
                fill={color}
            />
        </svg>
    );
};
