/**
 * Tip Modal Header Component
 * Handles navigation, title, and close functionality
 */

import React, { memo } from 'react';
import { sanitizeString } from '../../utils';
import { useHover } from '../../hooks/use-hover';
import { BackArrowIcon, CloseIcon } from '../icons';
import type { ThemeConfig, SolanaCommerceConfig, PaymentMethod, TransactionState, TipModalStep } from '../../types';

interface TipModalHeaderProps {
    theme: Required<ThemeConfig>;
    config: SolanaCommerceConfig;
    currentStep: TipModalStep;
    selectedPaymentMethod: PaymentMethod;
    transactionState?: TransactionState;
    onBack: () => void;
    onClose: () => void;
}

export const TipModalHeader = memo<TipModalHeaderProps>(
    ({ theme, config, currentStep, selectedPaymentMethod, transactionState = 'idle', onBack, onClose }) => {
        const backButtonHover = useHover();
        const closeButtonHover = useHover();
        return (
            <div
                className="ck-header"
                style={
                    {
                        '--header-border-color':
                            theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`,
                    } as React.CSSProperties
                }
            >
                {/* Left side - Back (in payment) + Avatar + Title */}
                <div className="ck-header-left">
                    {currentStep === 'payment' && (
                        <button
                            onClick={onBack}
                            {...backButtonHover.hoverHandlers}
                            className={`ck-header-back-button ${backButtonHover.isHovered ? 'hovered' : ''} ${backButtonHover.isPressed ? 'pressed' : ''}`}
                            type="button"
                        >
                            <BackArrowIcon />
                        </button>
                    )}
                    {currentStep === 'form' &&
                        (config.merchant.logo ? (
                            <img
                                className="ck-header-avatar"
                                src={config.merchant.logo}
                                alt={`${sanitizeString(config.merchant.name)} logo`}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div
                                className="ck-header-avatar"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                                }}
                            />
                        ))}
                    {currentStep === 'form' && (
                        <h2 className="ck-header-title">Support {sanitizeString(config.merchant.name)}</h2>
                    )}
                </div>

                {currentStep === 'payment' && (
                    <h2 className="ck-header-payment-title">
                        {selectedPaymentMethod === 'qr'
                            ? 'Scan to pay'
                            : transactionState === 'success'
                              ? 'Successful Payment'
                              : transactionState === 'error'
                                ? 'Unsuccessful Payment'
                                : 'Connect Wallet'}
                    </h2>
                )}

                {/* Right side - Close button */}
                <button
                    {...closeButtonHover.hoverHandlers}
                    className={`ck-header-close-button ${closeButtonHover.isHovered ? 'hovered' : ''} ${closeButtonHover.isPressed ? 'pressed' : ''}`}
                    type="button"
                    onClick={onClose}
                >
                    <CloseIcon />
                </button>
            </div>
        );
    },
);

TipModalHeader.displayName = 'TipModalHeader';
