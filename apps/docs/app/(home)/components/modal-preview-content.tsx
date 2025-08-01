'use client';

import React, { useState, useCallback } from 'react';
import type { DemoConfig, Mode } from './types';
import { cn } from '../../../lib/utils';
import { OrderItem } from '@solana-commerce/headless-sdk';

interface ModalPreviewContentProps {
  config: DemoConfig;
  selectedMode: Mode;
  demoProducts: OrderItem[];
}

type Currency = 'USDC' | 'SOL' | 'USDT';
type PaymentMethod = 'qr' | 'wallet';

export function ModalPreviewContent({ config, selectedMode, demoProducts }: ModalPreviewContentProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    (config.allowedMints[0] as Currency) || 'USDC'
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qr');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');

  const theme = {
    ...config.theme,
    fontFamily: config.theme.fontFamily || 'system-ui, -apple-system, sans-serif'
  };

  const presetAmounts = [1, 5, 15, 25];

  const getBorderRadiusClass = (radius: string) => {
    const radiusMap = {
      'none': 'rounded-none',
      'sm': 'rounded-sm',
      'md': 'rounded-md', 
      'lg': 'rounded-lg',
      'xl': 'rounded-xl',
      'full': 'rounded-full'
    };
    return radiusMap[radius as keyof typeof radiusMap] || 'rounded-md';
  };

  const getModalBorderRadiusClass = (radius: string) => {
    const modalRadiusMap = {
      'none': 'rounded-none',
      'sm': 'rounded-sm',
      'md': 'rounded-md', 
      'lg': 'rounded-lg',
      'xl': 'rounded-xl',
      'full': 'rounded-xl' // Cap modal radius for UX
    };
    return modalRadiusMap[radius as keyof typeof modalRadiusMap] || 'rounded-md';
  };

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

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
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
    { value: 'qr', label: 'Pay', description: 'QR code', icon: solanaPayIcon },
    { value: 'wallet', label: 'Wallet', description: 'Browser wallet', icon: walletIcon }
  ];

  if (selectedMode === 'tip') {
    return (
      <div 
        className={cn(
          "max-w-[525px] w-full shadow-2xl overflow-hidden",
          getModalBorderRadiusClass(theme.borderRadius)
        )}
        style={{
          fontFamily: theme.fontFamily,
          backgroundColor: theme.backgroundColor,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Header */}
        <div 
          className="flex justify-between items-center px-6 pt-6 pb-4 relative"
          style={{
            borderBottom: `1px solid ${theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.textColor}10`}`
          }}
        >
          {/* Left side - Back button or help button */}
          <div className="w-8 flex justify-start">
            {currentStep === 'payment' ? (
              <button
                onClick={handleBack}
                className="bg-transparent border-none text-xl cursor-pointer p-1 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-opacity-10"
                style={{
                  color: `${theme.textColor}70`
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
                onClick={() => {}}
                className="bg-transparent border-none text-xl cursor-pointer p-1 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
                style={{
                  color: `${theme.textColor}70`
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
          <h2 
            className="absolute left-1/2 transform -translate-x-1/2 text-center m-0 text-xl font-semibold"
            style={{ color: theme.textColor }}
          >
            {currentStep === 'form' 
              ? `Support ${sanitizeString(config.merchant.name)}`
              : selectedPaymentMethod === 'qr' 
                ? `Scan to Pay`
                : `Connect your wallet`
            }
          </h2>
          
          {/* Right side - Close button */}
          <button
            className="bg-transparent border-none text-2xl cursor-pointer p-1 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
            style={{ color: `${theme.textColor}60` }}
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
            ×
          </button>
        </div>

        {/* Main Content */}
        {currentStep === 'form' ? (
          <div className="p-6">
            {/* Profile Section */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-2xl text-white"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`
                }}
              >
                {config.merchant.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 max-w-full text-left min-w-0">
                <h3 
                  className="m-0 text-lg font-semibold -mb-1"
                  style={{ color: theme.textColor }}
                >
                  {sanitizeString(config.merchant.name)}
                </h3>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm font-mono"
                    style={{ color: `${theme.textColor}70` }}
                  >
                    {config.merchant.wallet.slice(0, 4)}...{config.merchant.wallet.slice(-4)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(config.merchant.wallet)}
                    className={cn(
                      "bg-transparent border-none cursor-pointer p-1 text-sm transition-all duration-200",
                      getBorderRadiusClass('sm')
                    )}
                    style={{ color: theme.primaryColor }}
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
            <div className="mb-6 text-left">
              <label 
                className="block text-xs font-normal mb-2"
                style={{ color: `${theme.textColor}70` }}
              >
                Select stablecoin
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                className="w-full h-9 px-3 py-1 border border-gray-200 rounded-xl bg-white text-sm font-normal cursor-pointer outline-none appearance-none transition-all duration-200 shadow-sm focus:ring-2 focus:ring-gray-300 hover:border-gray-300"
                style={{
                  color: theme.textColor,
                  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.7rem center',
                  backgroundSize: '0.65rem auto'
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
            <div className="mb-6 text-left">
              <label 
                className="block text-xs font-normal mb-3"
                style={{ color: `${theme.textColor}70` }}
              >
                Select amount
              </label>
              <div className="flex gap-4 flex-wrap justify-center">
                {presetAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setShowCustomInput(false);
                    }}
                    className={cn(
                      "w-20 h-16 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-105",
                      selectedAmount === amount && !showCustomInput 
                        ? 'border-3 border-white bg-gray-50' 
                        : 'border border-gray-300 bg-white'
                    )}
                    style={{
                      color: selectedAmount === amount && !showCustomInput ? theme.primaryColor : theme.textColor,
                      boxShadow: selectedAmount === amount && !showCustomInput 
                        ? '0 0 0 2px rgba(143, 143, 143, 1)' 
                        : undefined
                    }}
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className={cn(
                    "w-20 h-16 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-105",
                    showCustomInput 
                      ? 'border-3 border-white bg-gray-50' 
                      : 'border border-gray-300 bg-white'
                  )}
                  style={{
                    color: showCustomInput ? theme.primaryColor : theme.textColor,
                    boxShadow: showCustomInput 
                      ? '0 0 0 2px rgba(143, 143, 143, 1)' 
                      : undefined
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
                  className="w-full h-11 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-normal mt-3 outline-none transition-all duration-200 shadow-sm focus:ring-2 focus:ring-gray-300 hover:border-gray-300"
                  style={{ color: theme.textColor }}
                />
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-6 text-left">
              <label 
                className="block text-xs font-normal mb-3"
                style={{ color: `${theme.textColor}70` }}
              >
                Payment method
              </label>
              <div className="flex gap-4">
                {paymentMethods.map(method => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.value)}
                    className={cn(
                      "flex-1 p-4 cursor-pointer transition-all duration-200 text-left",
                      getBorderRadiusClass('lg'),
                      selectedPaymentMethod === method.value 
                        ? 'border-3 border-white shadow-lg' 
                        : 'border border-gray-300 shadow-sm'
                    )}
                    style={{
                      backgroundColor: selectedPaymentMethod === method.value ? '#F5F5F5' : theme.backgroundColor,
                      boxShadow: selectedPaymentMethod === method.value ? '0 0 0 2px rgba(143, 143, 143, 1)' : undefined
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="flex items-center"
                        style={{ 
                          color: selectedPaymentMethod === method.value ? theme.primaryColor : theme.textColor
                        }}
                      >
                        {method.icon}
                      </span>
                      <span 
                        className="text-sm font-semibold"
                        style={{
                          color: selectedPaymentMethod === method.value ? theme.primaryColor : theme.textColor
                        }}
                      >
                        {method.label}
                      </span>
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: `${theme.textColor}60` }}
                    >
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
              className={cn(
                "w-full p-4 text-white border-none text-base font-semibold transition-all duration-200",
                getBorderRadiusClass(theme.borderRadius),
                (isProcessing || (showCustomInput && !customAmount)) ? 'cursor-not-allowed' : 'cursor-pointer'
              )}
              style={{
                backgroundColor: isProcessing || (showCustomInput && !customAmount) ? '#9ca3af' : theme.primaryColor
              }}
              type="button"
              onMouseEnter={(e) => {
                if (!isProcessing && !(showCustomInput && !customAmount)) {
                  e.currentTarget.style.backgroundColor = theme.secondaryColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing && !(showCustomInput && !customAmount)) {
                  e.currentTarget.style.backgroundColor = theme.primaryColor;
                }
              }}
            >
              {isProcessing ? 'Processing...' : `Pay $${showCustomInput ? customAmount || '0' : selectedAmount}`}
            </button>
          </div>
        ) : (
          // Payment Step - Show simplified payment confirmation for preview
          <div className="p-6 text-center">
            <div className={cn(
              "mb-8 p-8 bg-gray-50 border-2 border-dashed border-gray-200",
              getBorderRadiusClass('lg')
            )}>
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
              className={cn(
                "w-full p-4 text-white border-none text-base font-semibold cursor-pointer transition-all duration-200",
                getBorderRadiusClass(theme.borderRadius)
              )}
              style={{ backgroundColor: theme.primaryColor }}
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
      className={cn(
        "p-8 shadow-2xl min-w-[400px] max-w-[500px]",
        getModalBorderRadiusClass(theme.borderRadius)
      )}
      style={{
        fontFamily: theme.fontFamily,
        backgroundColor: theme.backgroundColor,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
            <div className={cn(
              "w-10 h-10 bg-gray-100 mr-3 flex items-center justify-center",
              getBorderRadiusClass('md')
            )}>
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
          className={cn(
            "flex-1 py-3 px-6 text-white border-none cursor-pointer text-sm font-semibold transition-all duration-200",
            getBorderRadiusClass(theme.borderRadius)
          )}
          style={{ backgroundColor: theme.primaryColor }}
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
          className={cn(
            "py-3 px-6 bg-transparent cursor-pointer text-sm font-medium transition-all duration-200",
            getBorderRadiusClass(theme.borderRadius)
          )}
          style={{ 
            color: theme.textColor,
            border: `1px solid ${theme.textColor}30`
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