import React, { memo } from 'react';
import { sanitizeString, DEFAULT_PROFILE_SVG } from '../../utils';
import { useCopyToClipboard } from '../../hooks/use-copy-to-clipboard';
import { CopyIcon, CheckFilledIcon } from '../icons';
import type { ThemeConfig, MerchantConfig } from '../../types';

/**
 * Validates and sanitizes a color value to prevent CSS injection attacks.
 * Accepts only safe hex formats (#RGB, #RRGGBB) or known CSS color names.
 * @param color - The color value to validate
 * @returns The sanitized color value or null if invalid
 */
function validateColor(color: string | undefined): string | null {
    if (!color || typeof color !== 'string') {
        return null;
    }

    const trimmedColor = color.trim().toLowerCase();

    // Validate hex colors (#RGB or #RRGGBB)
    const hexColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
    if (hexColorRegex.test(trimmedColor)) {
        return trimmedColor;
    }

    // Known safe CSS color names
    const safeColorNames = new Set([
        'transparent',
        'black',
        'white',
        'red',
        'green',
        'blue',
        'yellow',
        'orange',
        'purple',
        'pink',
        'brown',
        'gray',
        'grey',
        'cyan',
        'magenta',
        'lime',
        'indigo',
        'violet',
        'navy',
        'maroon',
        'olive',
        'teal',
        'silver',
        'gold',
    ]);

    if (safeColorNames.has(trimmedColor)) {
        return trimmedColor;
    }

    return null;
}

/**
 * Creates a safe linear gradient background or returns a fallback value.
 * @param primaryColor - Primary color for the gradient
 * @param secondaryColor - Secondary color for the gradient
 * @returns Safe CSS background value
 */
function createSafeGradient(primaryColor: string | undefined, secondaryColor: string | undefined): string {
    const validPrimary = validateColor(primaryColor);
    const validSecondary = validateColor(secondaryColor);

    // Only create gradient if both colors are valid
    if (validPrimary && validSecondary) {
        return `linear-gradient(135deg, ${validPrimary} 0%, ${validSecondary} 100%)`;
    }

    // Fallback to a safe default gradient
    return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
}

interface MerchantAddressPillProps {
    theme: Required<ThemeConfig>;
    config: { merchant: MerchantConfig };
    copiedText?: string;
}

export const MerchantAddressPill = memo<MerchantAddressPillProps>(
    ({ theme, config, copiedText = 'Address Copied!' }) => {
        const { copied, isHovered, setIsHovered, copyToClipboard } = useCopyToClipboard();

        return (
            <div className="ck-merchant-container">
                <div
                    onClick={() => copyToClipboard(config.merchant.wallet)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`ck-merchant-pill ${copied ? 'copied' : ''}`}
                >
                    <img
                        src={config.merchant.logo || DEFAULT_PROFILE_SVG}
                        alt={sanitizeString(config.merchant.name)}
                        className={`ck-merchant-avatar ${copied ? 'copied' : ''}`}
                        style={{
                            background: config.merchant.logo
                                ? 'transparent'
                                : createSafeGradient(theme.primaryColor, theme.secondaryColor),
                        }}
                    />

                    {/* Content Container with CSS Grid for Dynamic Width */}
                    <div className="ck-merchant-content">
                        {/* Default Text - Merchant Name */}
                        <span
                            className={`ck-merchant-name ${!isHovered && !copied ? '' : 'hidden'}`}
                            style={{ color: validateColor(theme.textColor) || '#374151' }}
                        >
                            {sanitizeString(config.merchant.name)}
                        </span>

                        {/* Hover Text - Wallet Address */}
                        <div className={`ck-merchant-address ${isHovered && !copied ? 'show' : ''}`}>
                            {config.merchant.wallet.slice(0, 4)}...{config.merchant.wallet.slice(-4)}
                        </div>

                        {/* Copied Text */}
                        <span className={`ck-merchant-copied ${copied ? 'show' : ''}`}>{copiedText}</span>
                    </div>

                    {/* Icon Container */}
                    <div className="ck-merchant-icon-container">
                        {/* Copy Icon */}
                        <CopyIcon size={16} className={`ck-merchant-copy-icon ${copied ? 'hidden' : ''}`} />

                        {/* Check Icon */}
                        <CheckFilledIcon
                            size={16}
                            className={`ck-merchant-check-icon ${copied ? 'show' : ''}`}
                            color="#22c55e"
                        />
                    </div>
                </div>
            </div>
        );
    },
);

MerchantAddressPill.displayName = 'MerchantAddressPill';
