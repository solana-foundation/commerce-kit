import React, { memo } from 'react';
import { sanitizeString, DEFAULT_PROFILE_SVG } from '../../utils';
import { useCopyToClipboard } from '../../hooks/use-copy-to-clipboard';
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
    'transparent', 'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange',
    'purple', 'pink', 'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'indigo',
    'violet', 'navy', 'maroon', 'olive', 'teal', 'silver', 'gold'
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

export const MerchantAddressPill = memo<MerchantAddressPillProps>(({
  theme,
  config,
  copiedText = "Address Copied!"
}) => {
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
            background: config.merchant.logo ? 'transparent' : createSafeGradient(theme.primaryColor, theme.secondaryColor)
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
          <span className={`ck-merchant-copied ${copied ? 'show' : ''}`}>
            {copiedText}
          </span>
        </div>
        
        {/* Icon Container */}
        <div className="ck-merchant-icon-container">
          {/* Copy Icon */}
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`ck-merchant-copy-icon ${copied ? 'hidden' : ''}`}
          >
            <path d="M5.3335 10.6673V12.534C5.3335 13.2807 5.3335 13.6541 5.47882 13.9393C5.60665 14.1902 5.81063 14.3942 6.06151 14.522C6.34672 14.6673 6.72009 14.6673 7.46683 14.6673H12.5335C13.2802 14.6673 13.6536 14.6673 13.9388 14.522C14.1897 14.3942 14.3937 14.1902 14.5215 13.9393C14.6668 13.6541 14.6668 13.2807 14.6668 12.534V7.46732C14.6668 6.72058 14.6668 6.34721 14.5215 6.062C14.3937 5.81111 14.1897 5.60714 13.9388 5.47931C13.6536 5.33398 13.2802 5.33398 12.5335 5.33398H10.6668M3.46683 10.6673H8.5335C9.28023 10.6673 9.6536 10.6673 9.93882 10.522C10.1897 10.3942 10.3937 10.1902 10.5215 9.93931C10.6668 9.65409 10.6668 9.28072 10.6668 8.53398V3.46732C10.6668 2.72058 10.6668 2.34721 10.5215 2.062C10.3937 1.81111 10.1897 1.60714 9.93882 1.47931C9.6536 1.33398 9.28023 1.33398 8.5335 1.33398H3.46683C2.72009 1.33398 2.34672 1.33398 2.06151 1.47931C1.81063 1.60714 1.60665 1.81111 1.47882 2.062C1.3335 2.34721 1.3335 2.72058 1.3335 3.46732V8.53398C1.3335 9.28072 1.3335 9.65409 1.47882 9.93931C1.60665 10.1902 1.81063 10.3942 2.06151 10.522C2.34672 10.6673 2.72009 10.6673 3.46683 10.6673Z" stroke="currentColor" strokeOpacity="0.72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Check Icon */}
          <svg 
            width="16" 
            height="11" 
            viewBox="0 0 16 11" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`ck-merchant-check-icon ${copied ? 'show' : ''}`}
          >
            <path fillRule="evenodd" clipRule="evenodd" d="M15.2559 0.41107C15.5814 0.736507 15.5814 1.26414 15.2559 1.58958L6.08926 10.7562C5.76382 11.0817 5.23618 11.0817 4.91074 10.7562L0.744078 6.58958C0.418641 6.26414 0.418641 5.73651 0.744078 5.41107C1.06951 5.08563 1.59715 5.08563 1.92259 5.41107L5.5 8.98848L14.0774 0.41107C14.4028 0.0856329 14.9305 0.0856329 15.2559 0.41107Z" fill="#22c55e"/>
          </svg>
        </div>
      </div>
    </div>
  );
});

MerchantAddressPill.displayName = 'MerchantAddressPill';
