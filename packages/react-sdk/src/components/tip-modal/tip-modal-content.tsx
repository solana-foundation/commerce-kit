import React, { useState, useCallback, memo, useMemo } from 'react';
import { DialogClose } from '../../../../ui-primitives/src/react';
import { 
  getBorderRadius,
  getModalBorderRadius, 
  sanitizeString,
  DEFAULT_PROFILE_SVG,
  getButtonShadow,
  getButtonBorder,
  getAccessibleTextColor
} from '../../utils';
import { QRPaymentContent } from './qr-payment-content';
import { WalletPaymentContent } from './wallet-payment-content';
import {
  type TipModalContentProps,
  type PaymentMethod,
  type Currency,
  CurrencyMap
} from '../../types';
// No direct SPLToken usage in this file; keep dependencies minimal

// Static icons and constants hoisted to avoid re-creating on each render
const WALLET_ICON = (
  <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 9.55556H13.5078M3 2.55556V13.4444C3 14.3036 3.69645 15 4.55556 15H15.4444C16.3036 15 17 14.3036 17 13.4444V5.66667C17 4.80756 16.3036 4.11111 15.4444 4.11111L4.55556 4.11111C3.69645 4.11111 3 3.41466 3 2.55556ZM3 2.55556C3 1.69645 3.69645 1 4.55556 1H13.8889M13.8889 9.55556C13.8889 9.77033 13.7148 9.94444 13.5 9.94444C13.2852 9.94444 13.1111 9.77033 13.1111 9.55556C13.1111 9.34078 13.2852 9.16667 13.5 9.16667C13.7148 9.16667 13.8889 9.34078 13.8889 9.55556Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SOLANA_PAY_ICON = (
  <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
    <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
    <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
  </svg>
);

const PRESET_AMOUNTS = [1, 5, 15, 25] as const;

const ALL_CURRENCIES = [
  { value: 'USDC', label: 'USD Coin', symbol: 'USDC' },
  { value: 'SOL', label: 'Solana', symbol: 'SOL' },
  { value: 'USDT', label: 'Tether USD', symbol: 'USDT' },
  { value: 'USDC_DEVNET', label: 'USD Coin Devnet', symbol: 'USDC_DEVNET' },
  { value: 'SOL_DEVNET', label: 'Solana Devnet', symbol: 'SOL_DEVNET' },
  { value: 'USDT_DEVNET', label: 'Tether USD Devnet', symbol: 'USDT_DEVNET' }
] as const;

export const TipModalContent = memo<TipModalContentProps>(({ 
  config, 
  theme, 
  onPayment, 
  onCancel 
}) => {
  // Inject a local slide-up animation for the inner modal container to ensure visible motion
  if (typeof document !== 'undefined' && !document.getElementById('sc-tip-modal-anim')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'sc-tip-modal-anim';
    styleEl.textContent = `
@keyframes sc-tip-modal-slide-up {\n  0% { transform: translateY(16px); opacity: 0; }\n  100% { transform: translateY(0); opacity: 1; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .sc-tip-modal-anim { animation: none !important; }\n}`;
    document.head.appendChild(styleEl);
  }
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    (config.allowedMints?.[0] as Currency) || 'USDC'
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qr');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');
  const [isActionButtonHovered, setIsActionButtonHovered] = useState(false);
  const [isActionButtonPressed, setIsActionButtonPressed] = useState(false);

  // Derived memoized data
  const currencies = useMemo(() => ALL_CURRENCIES.filter(c => config.allowedMints?.includes(c.value as any)), [config.allowedMints]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsProcessing(true);
      // Move to payment step
      setCurrentStep('payment');
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep('form');
    setIsProcessing(false);
  }, []);

  const handlePaymentComplete = useCallback(async () => {
    try {
      const finalAmount = showCustomInput ? parseFloat(customAmount) : selectedAmount;
      const lamports = selectedCurrency === 'USDC' 
        ? Math.round(finalAmount * 1000000) // USDC has 6 decimals
        : Math.round(finalAmount * 1000000000); // SOL has 9 decimals
      
      onPayment(lamports, selectedCurrency, selectedPaymentMethod);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  }, [selectedAmount, selectedCurrency, selectedPaymentMethod, showCustomInput, customAmount, onPayment]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }, []);

  

  const paymentMethods: Array<{ value: PaymentMethod; label: string; description: string; icon: React.ReactNode }> = [
    { value: 'qr', label: 'Pay', description: 'QR code', icon: SOLANA_PAY_ICON },
    { value: 'wallet', label: 'Wallet', description: 'Browser wallet', icon: WALLET_ICON }
  ];

  // Action button styles - matching trigger button pattern
  const actionButtonStyles: React.CSSProperties = useMemo(() => {
    const isDisabled = isProcessing || (showCustomInput && !customAmount);
    const borderStyle = (() => {
      const b = getButtonBorder(theme);
      return b === 'none' ? '1.5px solid transparent' : b;
    })();
    
    return {
      width: '100%',
      padding: '1rem',
      backgroundColor: isDisabled 
        ? '#9ca3af' 
        : isActionButtonHovered 
          ? theme.secondaryColor 
          : theme.primaryColor,
      color: isDisabled 
        ? 'white' 
        : getAccessibleTextColor(isActionButtonHovered ? theme.secondaryColor : theme.primaryColor),
      border: isDisabled ? '1.5px solid transparent' : borderStyle,
      borderRadius: getBorderRadius(theme.borderRadius),
      fontSize: '1rem',
      fontWeight: '600',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease',
      fontFamily: theme.fontFamily,
      boxShadow: isDisabled 
        ? 'none'
        : isActionButtonHovered
          ? `${getButtonShadow(theme.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)`
          : getButtonShadow(theme.buttonShadow),
      transform: isDisabled 
        ? 'scale(1)' 
        : isActionButtonPressed 
          ? 'scale(0.97)' 
          : isActionButtonHovered 
            ? 'scale(1)' 
            : 'scale(1)',
      outlineOffset: 2,
    };
  }, [theme, isActionButtonHovered, isActionButtonPressed, isProcessing, showCustomInput, customAmount]);

  return (
    <div className="sc-tip-modal-anim" style={{
      fontFamily: theme.fontFamily,
      backgroundColor: theme.backgroundColor,
      padding: '0',
      height: 'auto',
      maxWidth: '420px',
      width: '100%',
      border: '1px solid #00000060',
      borderRadius: getModalBorderRadius(theme.borderRadius),
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      animation: 'sc-tip-modal-slide-up 125ms ease-in'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: `1px solid ${theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`}`,
        position: 'relative'
      }}>
        {/* Left side - Back button or help button */}
        <div style={{ width: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
          {currentStep === 'payment' ? (
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: `${theme.textColor}70`,
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              type="button"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.primaryColor}10`;
                e.currentTarget.style.color = theme.primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = `${theme.textColor}70`;
              }}
            >
              ←
            </button>
          ) : (
            <button
              onClick={() => {}} // Does nothing for now
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: `${theme.textColor}70`,
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              type="button"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.primaryColor}10`;
                e.currentTarget.style.color = theme.primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = `${theme.textColor}70`;
              }}
            >
              ?
            </button>
          )}
        </div>
        
        {/* Center - Title */}
        <h2 style={{
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: '600',
          color: theme.textColor,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          {currentStep === 'form' 
            ? `Support ${sanitizeString(config.merchant.name)}`
            : selectedPaymentMethod === 'qr' 
              ? `Scan to Pay`
              : `Connect your wallet`
          }
        </h2>
        
        {/* Right side - Close button */}
        <DialogClose asChild>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: `${theme.textColor}60`,
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            type="button"
            onClick={onCancel}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.primaryColor}10`;
              e.currentTarget.style.color = theme.primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = `${theme.textColor}60`;
            }}
          >
            ×
          </button>
        </DialogClose>
      </div>

      {/* Main Content */}
      {currentStep === 'form' ? (
        <div style={{ padding: '1.5rem' }}>
          {/* Profile Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <img
              src={config.merchant.logo || DEFAULT_PROFILE_SVG}
              alt={sanitizeString(config.merchant.name)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                background: config.merchant.logo ? 'transparent' : `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, maxWidth: '100%', textAlign: 'left', minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: '600',
                color: theme.textColor,
                marginBottom: '-5px'
              }}>
                {sanitizeString(config.merchant.name)}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: `${theme.textColor}70`
                }}>
                  {config.merchant.wallet.slice(0, 4)}...{config.merchant.wallet.slice(-4)}
                </span>
                <button
                  onClick={() => copyToClipboard(config.merchant.wallet)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    color: theme.primaryColor,
                    fontSize: '0.875rem',
                    borderRadius: getBorderRadius('sm'),
                    transition: 'all 0.2s'
                  }}
                  type="button"
                  title="Copy address"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.primaryColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          {/* Currency Selector */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '400',
              color: `${theme.textColor}70`,
              marginBottom: '0.5rem'
            }}>
              Select stablecoin
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
              style={{
                width: '100%',
                height: '2.25rem',
                padding: '0.25rem 0.75rem',
                border: '1px solid #EBEBEB',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                color: theme.textColor,
                fontSize: '0.875rem',
                fontWeight: '400',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem center',
                backgroundSize: '0.65rem auto',
                transition: 'all 200ms ease-in-out',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D8D8D8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#EBEBEB';
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#585858';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 3px #DBDADA';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#EBEBEB';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            >
              {currencies.map(currency => (
                <option key={currency.value} value={currency.value}>
                  {currency.symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Selection */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '400',
              color: `${theme.textColor}70`,
              marginBottom: '0.75rem'
            }}>
              Select amount
            </label>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {PRESET_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setShowCustomInput(false);
                  }}
                  style={{
                    width: '60px',
                    height: '44px',
                    border: selectedAmount === amount && !showCustomInput ? `3px solid #ffffff` : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: selectedAmount === amount && !showCustomInput ? '#F5F5F5' : '#ffffff',
                    color: selectedAmount === amount && !showCustomInput ? theme.primaryColor : theme.textColor,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: selectedAmount === amount && !showCustomInput ? 'scale(1)' : 'scale(1)',
                    boxShadow: selectedAmount === amount && !showCustomInput 
                      ? '0 0 0 2px rgba(143, 143, 143, 1)' 
                      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!(selectedAmount === amount && !showCustomInput)) {
                      e.currentTarget.style.borderColor = '#9ca3af';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(selectedAmount === amount && !showCustomInput)) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  ${amount}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                style={{
                  width: '60px',
                  height: '44px',
                  border: showCustomInput ? `3px solid #ffffff` : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  backgroundColor: showCustomInput ? '#F5F5F5' : '#ffffff',
                  color: showCustomInput ? theme.primaryColor : theme.textColor,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: showCustomInput ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: showCustomInput 
                    ? '0 0 0 2px rgba(143, 143, 143, 1)' 
                    : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!showCustomInput) {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showCustomInput) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                Custom
              </button>
            </div>
            <div
              className={showCustomInput ? 'sc-collapsible-expanded' : 'sc-collapsible-collapsed'}
              style={{
                display: 'grid',
                gridTemplateRows: showCustomInput ? '1fr' : '0fr',
                transition: 'grid-template-rows 200ms ease-in',
                marginTop: '0.75rem'
              }}
              aria-hidden={!showCustomInput}
            >
              <div style={{ overflow: 'hidden' }}>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{
                    width: '100%',
                    height: '2.75rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid #EBEBEB',
                    borderRadius: '12px',
                    backgroundColor: '#F5F5F5',
                    color: theme.textColor,
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    outline: 'none',
                    transition: 'border-color 200ms ease-in, box-shadow 200ms ease-in',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  disabled={!showCustomInput}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#D8D8D8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#EBEBEB';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#585858';
                    e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 3px #DBDADA';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#EBEBEB';
                    e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '400',
              color: `${theme.textColor}70`,
              marginBottom: '0.75rem'
            }}>
              Payment method
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(method.value)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: `3px solid ${selectedPaymentMethod === method.value ? '#ffffff' : '#e5e7eb'}`,
                    borderRadius: getBorderRadius('lg'),
                    backgroundColor: selectedPaymentMethod === method.value ? '#F5F5F5' : theme.backgroundColor,
                    cursor: 'pointer',
                    boxShadow: selectedPaymentMethod === method.value ? '0 0 0 2px rgba(143, 143, 143, 1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: selectedPaymentMethod === method.value ? theme.primaryColor : theme.textColor
                    }}>
                      {method.icon}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: selectedPaymentMethod === method.value ? theme.primaryColor : theme.textColor
                    }}>
                      {method.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: `${theme.textColor}60`
                  }}>
                    {method.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (showCustomInput && !customAmount)}
            style={actionButtonStyles}
            type="button"
            onMouseEnter={() => {
              if (!isProcessing && !(showCustomInput && !customAmount)) {
                setIsActionButtonHovered(true);
              }
            }}
            onMouseLeave={() => {
              setIsActionButtonHovered(false);
              setIsActionButtonPressed(false);
            }}
            onMouseDown={() => {
              if (!isProcessing && !(showCustomInput && !customAmount)) {
                setIsActionButtonPressed(true);
              }
            }}
            onMouseUp={() => setIsActionButtonPressed(false)}
            onFocus={(e) => {
              if (!isProcessing && !(showCustomInput && !customAmount)) {
                setIsActionButtonHovered(true);
                e.currentTarget.style.boxShadow = `${getButtonShadow(theme.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)`;
              }
            }}
            onBlur={(e) => {
              setIsActionButtonHovered(false);
              if (!isProcessing && !(showCustomInput && !customAmount)) {
                e.currentTarget.style.boxShadow = getButtonShadow(theme.buttonShadow);
              }
            }}
          >
            {isProcessing ? 'Processing...' : `Pay $${showCustomInput ? customAmount || '0' : selectedAmount}`}
          </button>
        </div>
      ) : (
        // Payment Step - Render QR or Wallet component based on selected method
        selectedPaymentMethod === 'qr' ? (
          <QRPaymentContent 
            theme={theme}
            config={config}
            selectedAmount={selectedAmount}
            selectedCurrency={selectedCurrency}
            customAmount={customAmount}
            showCustomInput={showCustomInput}
            onPaymentComplete={handlePaymentComplete}
            onPaymentError={(error) => {
              console.error('Payment error:', error);
              // Could add additional error handling here
            }}
          />
        ) : (
          <WalletPaymentContent 
            theme={theme}
            config={config}
            selectedAmount={selectedAmount}
            selectedCurrency={selectedCurrency}
            customAmount={customAmount}
            showCustomInput={showCustomInput}
            onPaymentComplete={handlePaymentComplete}
            walletIcon={WALLET_ICON}
          />
        )
      )}
    </div>
  );
});

TipModalContent.displayName = 'TipModalContent';