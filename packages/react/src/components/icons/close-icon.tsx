import React from 'react';

interface CloseIconProps {
    size?: number;
    className?: string;
    'data-testid'?: string;
}

export const CloseIcon: React.FC<CloseIconProps> = ({ size = 14, className, 'data-testid': testId }) => {
    return (
        <svg
            width={size}
            height={(size * 15) / 14} // Maintain aspect ratio
            viewBox="0 0 14 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Close"
            data-testid={testId || 'close-icon'}
            data-size={size}
        >
            <path
                d="M13.7071 2.20711C14.0976 1.81658 14.0976 1.18342 13.7071 0.792893C13.3166 0.402369 12.6834 0.402369 12.2929 0.792893L7 6.08579L1.70711 0.792893C1.31658 0.402369 0.683417 0.402369 0.292893 0.792893C-0.0976311 1.18342 -0.0976311 1.81658 0.292893 2.20711L5.58579 7.5L0.292893 12.7929C-0.0976311 13.1834 -0.0976311 13.8166 0.292893 14.2071C0.683417 14.5976 1.31658 14.5976 1.70711 14.2071L7 8.91421L12.2929 14.2071C12.6834 14.5976 13.3166 14.5976 13.7071 14.2071C14.0976 13.8166 14.0976 13.1834 13.7071 12.7929L8.41421 7.5L13.7071 2.20711Z"
                fill="currentColor"
                fillOpacity="0.72"
            />
        </svg>
    );
};
