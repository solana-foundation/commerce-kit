'use client';

import React, { useState, useCallback } from 'react';
import type { DemoConfig, Mode } from './types';
import { cn } from '../../../lib/utils';
import { OrderItem } from '@solana-commerce/headless-sdk';
import { TokenIcon } from '../../../../../packages/react-sdk/src/components/icons';
import { getButtonBorder, getButtonShadow, getAccessibleTextColor } from '../../../../../packages/react-sdk/src/utils';
import {
  DropdownRoot,
  DropdownTrigger,
  DropdownContent,
  DropdownItem
} from '../../../../../packages/ui-primitives/src/react';

// Local border radius utilities to match the React SDK
const BORDER_RADIUS_MAP = {
  none: '0',
  sm: '0.5rem',
  md: '0.75rem', 
  lg: '1rem',
  xl: '1.2rem',
  full: '1.5rem' // Cap at reasonable radius instead of fully rounded
} as const;

const MODAL_BORDER_RADIUS_MAP = {
  ...BORDER_RADIUS_MAP,
  full: '2.2rem' // Cap modal radius for UX
} as const;

type BorderRadius = keyof typeof BORDER_RADIUS_MAP;

const getBorderRadius = (radius?: BorderRadius): string => 
  BORDER_RADIUS_MAP[radius ?? 'md'];

const getModalBorderRadius = (radius?: BorderRadius): string => 
  MODAL_BORDER_RADIUS_MAP[radius ?? 'md'];


interface ModalPreviewContentProps {
  config: DemoConfig;
  selectedMode: Mode;
  demoProducts: OrderItem[];
}

type Currency = 'USDC' | 'SOL' | 'USDT';
type PaymentMethod = 'qr' | 'wallet';

export function ModalPreviewContent({ config, selectedMode, demoProducts }: ModalPreviewContentProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(1);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    (config.allowedMints[0] as Currency) || 'USDC'
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qr');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');
  const [isActionButtonHovered, setIsActionButtonHovered] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const theme = {
    ...config.theme,
    fontFamily: config.theme.fontFamily || 'system-ui, -apple-system, sans-serif'
  };

  const presetAmounts = [1, 5, 15, 25, 50];





  const sanitizeString = (str: string) => str;

  const handleSubmit = useCallback(async () => {
    try {
      setIsProcessing(true);
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

  const allCurrencies = [
    { value: 'USDC' as Currency, label: 'USD Coin', symbol: 'USDC' },
    { value: 'SOL' as Currency, label: 'Solana', symbol: 'SOL' },
    { value: 'USDT' as Currency, label: 'Tether USD', symbol: 'USDT' }
  ];
  
  const currencies = allCurrencies.filter(currency => 
    config.allowedMints.includes(currency.value)
  );

  const walletIcon = (
    <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 9.55556H13.5078M3 2.55556V13.4444C3 14.3036 3.69645 15 4.55556 15H15.4444C16.3036 15 17 14.3036 17 13.4444V5.66667C17 4.80756 16.3036 4.11111 15.4444 4.11111L4.55556 4.11111C3.69645 4.11111 3 3.41466 3 2.55556ZM3 2.55556C3 1.69645 3.69645 1 4.55556 1H13.8889M13.8889 9.55556C13.8889 9.77033 13.7148 9.94444 13.5 9.94444C13.2852 9.94444 13.1111 9.77033 13.1111 9.55556C13.1111 9.34078 13.2852 9.16667 13.5 9.16667C13.7148 9.16667 13.8889 9.34078 13.8889 9.55556Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const solanaPayIcon = (
    <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
      <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
      <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
    </svg>
  );

  const paymentMethods: Array<{ value: PaymentMethod; label: string; description: string; icon: React.ReactNode }> = [
    { value: 'qr', label: 'Pay', description: 'Scan a QR code', icon: solanaPayIcon },
    { value: 'wallet', label: 'Wallet', description: 'Connect your wallet', icon: walletIcon }
  ];

  if (selectedMode === 'tip') {
    return (
      <div 
        style={{
          maxWidth: '560px',
          width: '100%',
          borderRadius: getModalBorderRadius(theme.borderRadius),
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: theme.fontFamily,
          backgroundColor: theme.backgroundColor
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: `1px solid ${theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`}`,
          position: 'relative'
        }}>
          {/* Left side - Back (in payment) + Avatar + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
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
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${theme.primaryColor}10`;
                  (e.currentTarget as HTMLButtonElement).style.color = theme.primaryColor;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = `${theme.textColor}70`;
                }}
              >
                <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 8.5H1M1 8.5L8 15.5M1 8.5L8 1.5" stroke="currentColor" strokeOpacity="0.72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : null}
            {currentStep === 'form' && (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                  flexShrink: 0
                }}
              />
            )}
            {currentStep === 'form' && (
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: theme.textColor,
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Support {sanitizeString(config.merchant.name)}
              </h2>
            )}
          </div>

          {currentStep === 'payment' && (
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: theme.textColor,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center'
            }}>
              {selectedPaymentMethod === 'qr' ? 'Scan to pay' : 'Connect Wallet'}
            </h2>
          )}

          {/* Right side - Close button */}
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
            onClick={() => console.log('Preview close')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.primaryColor}10`;
              e.currentTarget.style.color = theme.primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = `${theme.textColor}60`;
            }}
          >
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.7071 2.20711C14.0976 1.81658 14.0976 1.18342 13.7071 0.792893C13.3166 0.402369 12.6834 0.402369 12.2929 0.792893L7 6.08579L1.70711 0.792893C1.31658 0.402369 0.683417 0.402369 0.292893 0.792893C-0.0976311 1.18342 -0.0976311 1.81658 0.292893 2.20711L5.58579 7.5L0.292893 12.7929C-0.0976311 13.1834 -0.0976311 13.8166 0.292893 14.2071C0.683417 14.5976 1.31658 14.5976 1.70711 14.2071L7 8.91421L12.2929 14.2071C12.6834 14.5976 13.3166 14.5976 13.7071 14.2071C14.0976 13.8166 14.0976 13.1834 13.7071 12.7929L8.41421 7.5L13.7071 2.20711Z" fill="currentColor" fillOpacity="0.72"/>
            </svg>
          </button>
        </div>

        {/* Main Content */}
        {currentStep === 'form' ? (
          <div style={{
            padding: '1.5rem',
            borderBottomLeftRadius: getModalBorderRadius(theme.borderRadius),
            borderBottomRightRadius: getModalBorderRadius(theme.borderRadius)
          }}>
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
              
              <DropdownRoot 
                open={currencyDropdownOpen} 
                onOpenChange={setCurrencyDropdownOpen}
              >
                <DropdownTrigger asChild>
                  <div
                    style={{
                      width: 'fit-content',
                      minWidth: '120px',
                      height: '2.25rem',
                      padding: '0.25rem 0.45rem',
                      border: '1px solid #EBEBEB',
                      borderRadius: getBorderRadius(theme.borderRadius),
                      backgroundColor: '#FFFFFF',
                      color: theme.textColor,
                      fontWeight: '400',
                      cursor: 'pointer',
                      outline: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 200ms ease-in-out',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TokenIcon symbol={selectedCurrency} size={24} />
                      <span style={{ marginRight: '4px', fontWeight: '600', fontSize: '16px' }}>
                        {currencies.find(c => c.value === selectedCurrency)?.symbol || selectedCurrency}
                      </span>
                    </div>  
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 25" 
                      fill="none"
                      style={{ 
                        transform: currencyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease-in-out'
                      }}
                    >
                      <path 
                        d="M6 9.5L12 15.5L18 9.5" 
                        stroke="black" 
                        strokeOpacity="0.72" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </DropdownTrigger>
                
                <DropdownContent align="start">
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EBEBEB',
                    borderRadius: getBorderRadius(theme.borderRadius),
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px',
                    minWidth: '200px'
                  }}>
                  {currencies.map(currency => (
                    <DropdownItem
                      key={currency.value}
                      onSelect={() => setSelectedCurrency(currency.value as Currency)}
                    >
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '400',
                        color: theme.textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'transparent',
                        width: '100%'
                      }}>
                        <TokenIcon symbol={currency.value} size={16} />
                        <span>{currency.symbol}</span>
                        {selectedCurrency === currency.value && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 'auto' }}>
                            <path 
                              d="M13.5 4.5L6 12L2.5 8.5" 
                              stroke={theme.primaryColor} 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </DropdownItem>
                  ))}
                  </div>
                </DropdownContent>
              </DropdownRoot>
            </div>

            {/* Amount Selection */}
            <div className="mb-6 text-left">
              <label 
                className="block text-xs font-normal mb-3"
                style={{ color: `${theme.textColor}70` }}
              >
                Select amount
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '1rem'
              }}>
                {presetAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setShowCustomInput(false);
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    style={{
                      width: '100%',
                      height: '68px',
                      border: selectedAmount === amount && !showCustomInput ? `3px solid #ffffff` : '1px solid #e5e7eb',
                      borderRadius: getBorderRadius(theme.borderRadius),
                      backgroundColor: selectedAmount === amount && !showCustomInput ? `${theme.primaryColor}10` : '#ffffff',
                      color: selectedAmount === amount && !showCustomInput ? 'rgba(0, 0, 0, 0.7)' : theme.textColor,
                      fontSize: '19px',
                      fontWeight: '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s, transform 0.1s ease',
                      transform: 'scale(1)',
                      boxShadow: selectedAmount === amount && !showCustomInput 
                        ? `0 0 0 2px ${theme.primaryColor}60` 
                        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  style={{
                    width: '100%',
                    height: '68px',
                    border: showCustomInput ? `3px solid #ffffff` : '1px solid #e5e7eb',
                    borderRadius: getBorderRadius(theme.borderRadius),
                    backgroundColor: showCustomInput ? `${theme.primaryColor}10` : '#ffffff',
                    color: showCustomInput ? 'rgba(0, 0, 0, 0.8)' : theme.textColor,
                    fontSize: '19px',
                    fontWeight: '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s, transform 0.1s ease',
                    transform: 'scale(1)',
                    boxShadow: showCustomInput 
                      ? `0 0 0 2px ${theme.primaryColor}60` 
                      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Custom
                </button>
              </div>
              {showCustomInput && (
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
                    borderRadius: getBorderRadius(theme.borderRadius),
                    backgroundColor: '#F5F5F5',
                    color: theme.textColor,
                    fontSize: '19px',
                    fontWeight: '400',
                    outline: 'none',
                    marginTop: '0.75rem',
                    transition: 'border-color 200ms ease-in, box-shadow 200ms ease-in',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                />
              )}
            </div>

            {/* Payment Method */}
            <div style={{ 
              marginBottom: '1.5rem', 
              textAlign: 'left',        
              borderBottom: `1px solid ${theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`}`,
              paddingBottom: '1.5rem'
            }}>
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
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: `${selectedPaymentMethod === method.value ? '3px solid #ffffff' : '1px solid #e5e7eb'}`,
                      borderRadius: getBorderRadius(theme.borderRadius),
                      backgroundColor: selectedPaymentMethod === method.value ? `${theme.primaryColor}10` : theme.backgroundColor,
                      cursor: 'pointer',
                      boxShadow: selectedPaymentMethod === method.value ? `0 0 0 2px ${theme.primaryColor}60` : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s, transform 0.1s ease',
                      transform: 'scale(1)',
                      textAlign: 'left',
                      width: '248px',
                      height: '110px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end'
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
                        color: selectedPaymentMethod === method.value ? 'rgba(0, 0, 0, 0.8)' : theme.textColor
                      }}>
                        {method.icon}
                      </span>
                      <span style={{
                        fontSize: '19px',
                        fontWeight: '600',
                        color: selectedPaymentMethod === method.value ? 'rgba(0, 0, 0, 0.8)' : theme.textColor
                      }}>
                        {method.label}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
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
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: isProcessing || (showCustomInput && !customAmount) 
                  ? '#9ca3af' 
                  : isActionButtonHovered 
                    ? theme.secondaryColor 
                    : theme.primaryColor,
                color: isProcessing || (showCustomInput && !customAmount)
                  ? 'white' 
                  : getAccessibleTextColor(isActionButtonHovered ? theme.secondaryColor : theme.primaryColor),
                border: isProcessing || (showCustomInput && !customAmount) 
                  ? '1.5px solid transparent' 
                  : (() => {
                    const border = getButtonBorder({...theme, buttonBorder: theme.buttonBorder || 'none', buttonShadow: theme.buttonShadow || 'none'});
                    return border === 'none' ? '1.5px solid transparent' : border;
                  })(),
                borderRadius: getBorderRadius(theme.borderRadius),
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isProcessing || (showCustomInput && !customAmount) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease',
                fontFamily: theme.fontFamily,
                boxShadow: isProcessing || (showCustomInput && !customAmount)
                  ? 'none'
                  : isActionButtonHovered
                    ? `${getButtonShadow(theme.buttonShadow || 'none')}, 0 0 0 4px rgba(202, 202, 202, 0.45)`
                    : getButtonShadow(theme.buttonShadow || 'none'),
                transform: 'scale(1)',
                outlineOffset: 2
              }}
              type="button"
              onMouseEnter={() => {
                if (!isProcessing && !(showCustomInput && !customAmount)) {
                  setIsActionButtonHovered(true);
                }
              }}
              onMouseLeave={() => {
                setIsActionButtonHovered(false);
              }}
              onMouseDown={(e) => {
                if (!isProcessing && !(showCustomInput && !customAmount)) {
                  e.currentTarget.style.transform = 'scale(0.97)';
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onFocus={(e) => { 
                if (!isProcessing && !(showCustomInput && !customAmount)) {
                  setIsActionButtonHovered(true);
                  e.currentTarget.style.boxShadow = `${getButtonShadow(theme.buttonShadow || 'none')}, 0 0 0 4px rgba(202, 202, 202, 0.45)`; 
                }
              }}
              onBlur={(e) => { 
                setIsActionButtonHovered(false);
                if (!isProcessing && !(showCustomInput && !customAmount)) {
                  e.currentTarget.style.boxShadow = getButtonShadow(theme.buttonShadow || 'none'); 
                }
              }}
            >
              <span style={{ fontSize: '19px', fontWeight: '600' }}>{isProcessing ? 'Processing...' : `Pay $${showCustomInput ? customAmount || '0' : selectedAmount}`}</span>
            </button>
          </div>
        ) : (
          // Payment Step - Show simplified payment confirmation for preview
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: selectedPaymentMethod === 'wallet' ? '#F5F5F5' : 'transparent',
            borderBottomLeftRadius: getModalBorderRadius(theme.borderRadius),
            borderBottomRightRadius: getModalBorderRadius(theme.borderRadius),
            transition: 'background-color 150ms ease'
          }}>
            <div style={{
              marginBottom: '2rem',
              padding: '2rem',
              backgroundColor: '#f9fafb',
              border: '2px dashed #e5e7eb',
              borderRadius: getBorderRadius('lg')
            }}>
              <div className="text-5xl mb-4">
                {selectedPaymentMethod === 'qr' ? '📱' : '👛'}
              </div>
              <h3 
                className="m-0 text-xl font-semibold mb-2"
                style={{ color: theme.textColor }}
              >
                {selectedPaymentMethod === 'qr' ? 'QR Code Payment' : 'Wallet Payment'}
              </h3>
              <p 
                className="m-0 text-sm"
                style={{ color: `${theme.textColor}70` }}
              >
                Payment preview for ${showCustomInput ? customAmount : selectedAmount} {selectedCurrency}
              </p>
            </div>
            
            <button
              onClick={() => {
                console.log('Preview payment completed');
                alert(`Mock payment completed: $${showCustomInput ? customAmount : selectedAmount} ${selectedCurrency}`);
              }}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: theme.primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: getBorderRadius(theme.borderRadius),
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              type="button"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.secondaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.primaryColor;
              }}
            >
              Complete Payment (Preview)
            </button>
          </div>
        )}
      </div>
    );
  }

  // Buy Now/Cart Modal for non-tip modes
  return (
    <div 
      style={{
        padding: '2rem',
        borderRadius: getModalBorderRadius(theme.borderRadius),
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        minWidth: '400px',
        maxWidth: '500px',
        fontFamily: theme.fontFamily,
        backgroundColor: theme.backgroundColor
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`
          }}
        >
          🛒
        </div>
        <h2 
          className="mt-0 mb-2 text-2xl font-bold"
          style={{ color: theme.textColor }}
        >
          {config.merchant.name}
        </h2>
        <p 
          className="m-0 text-sm"
          style={{ color: `${theme.textColor}80` }}
        >
          Complete your purchase
        </p>
      </div>

      {/* Products */}
      <div className="mb-6">
        {demoProducts.map((product, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center py-3",
              index < demoProducts.length - 1 && "border-b border-gray-100"
            )}
          >
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#f3f4f6',
              marginRight: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: getBorderRadius('md')
            }}>
              📦
            </div>
            <div className="flex-1">
              <div 
                className="font-semibold text-sm"
                style={{ color: theme.textColor }}
              >
                {product.name}
              </div>
              <div className="text-gray-500 text-xs">
                ${(product.price / 1_000_000).toFixed(2)} {selectedCurrency}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-4 mb-6 flex justify-between items-center">
        <span 
          className="font-bold text-lg"
          style={{ color: theme.textColor }}
        >
          Total
        </span>
        <span 
          className="font-bold text-lg"
          style={{ color: theme.primaryColor }}
        >
          ${(demoProducts.reduce((sum, p) => sum + p.price, 0) / 1_000_000).toFixed(2)} {selectedCurrency}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            console.log('Preview payment initiated');
            alert('Mock payment initiated');
          }}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            backgroundColor: theme.primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: getBorderRadius(theme.borderRadius),
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.secondaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.primaryColor;
          }}
        >
          Pay Now
        </button>
        <button 
          onClick={() => console.log('Preview cancel')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            border: `1px solid ${theme.textColor}30`,
            borderRadius: getBorderRadius(theme.borderRadius),
            color: theme.textColor,
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${theme.textColor}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}