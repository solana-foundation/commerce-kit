import React from 'react';

interface CheckIconProps extends React.SVGAttributes<SVGSVGElement> {
    size?: number;
    className?: string;
    'data-testid'?: string;
}

export const CheckIcon: React.FC<CheckIconProps> = ({ 
    size = 16, 
    className, 
    'data-testid': testId,
    ...rest
}) => {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            data-size={size}
            {...rest}
            width={size}
            height={size}
            className={className}
            data-testid={testId || 'check-icon'}
        >
            <path
                d="M13.5 4.5L6 12L2.5 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
