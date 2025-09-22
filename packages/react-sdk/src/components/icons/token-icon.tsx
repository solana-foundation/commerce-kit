import React from 'react';
import { SolanaIcon } from './solana-icon';
import { USDCIcon } from './usdc-icon';
import { USDTIcon } from './usdt-icon';

interface TokenIconProps {
    symbol: string;
    size?: number;
    className?: string;
    customIconUrl?: string; // For custom tokens with their own icon URLs
    'data-testid'?: string; // Allow override of test ID to avoid duplicates
}

// Generic fallback icon for unknown tokens
const GenericTokenIcon: React.FC<{ size: number; symbol: string; className?: string; 'data-testid'?: string }> = ({
    size,
    symbol,
    className,
    'data-testid': testId,
}) => {
    // Generate a consistent color based on the symbol
    const generateColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        // Convert to HSL for better color distribution
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    const bgColor = generateColor(symbol);
    const initials = symbol.slice(0, 2).toUpperCase();

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 90 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            data-testid={testId}
        >
            <circle cx="45" cy="45" r="45" fill={bgColor} />
            <text
                x="45"
                y="55"
                textAnchor="middle"
                fill="white"
                fontSize={size > 40 ? '24' : size > 20 ? '16' : '12'}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
            >
                {initials}
            </text>
        </svg>
    );
};

export const TokenIcon: React.FC<TokenIconProps> = ({
    symbol,
    size = 24,
    className,
    customIconUrl,
    'data-testid': testId,
}) => {
    const [imgError, setImgError] = React.useState(false);

    // If a custom icon URL is provided and hasn't failed, use it
    if (customIconUrl && !imgError) {
        return (
            <img
                src={customIconUrl}
                alt={`${symbol} token`}
                width={size}
                height={size}
                className={className}
                style={{ borderRadius: '50%' }}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => {
                    // Fallback to generic icon if custom image fails to load
                    setImgError(true);
                }}
            />
        );
    }

    // Map known tokens to their specific icons
    const finalTestId = testId || `token-icon-${symbol}`;

    switch (symbol.toUpperCase()) {
        case 'SOL':
        case 'SOL_DEVNET':
            return <SolanaIcon size={size} className={className} data-testid={finalTestId} />;

        case 'USDC':
        case 'USDC_DEVNET':
            return <USDCIcon size={size} className={className} data-testid={finalTestId} />;

        case 'USDT':
        case 'USDT_DEVNET':
            return <USDTIcon size={size} className={className} data-testid={finalTestId} />;

        default:
            return <GenericTokenIcon size={size} symbol={symbol} className={className} data-testid={finalTestId} />;
    }
};
