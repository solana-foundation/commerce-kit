"use client";

import React, { useState, useCallback, useMemo, memo } from 'react';
import { getBorderRadius, sanitizeString, DEFAULT_PROFILE_SVG } from '../../utils';
import { QRPaymentContent } from '../tip-modal/qr-payment-content';
import { WalletPaymentContent } from '../tip-modal/wallet-payment-content';
import { type SolanaCommerceConfig, type ThemeConfig, type PaymentMethod, type Currency, CurrencyMap } from '../../types';
import { OrderItem } from '@solana-commerce/headless-sdk';

export interface CartItem extends OrderItem {
  quantity: number;
}

export interface MultiItemCartProps {
  initialItems: CartItem[];
  merchant: {
    name: string;
    wallet: string;
    logo?: string;
    description?: string;
  };
  
  // User info (optional)
  user?: {
    name?: string;
    wallet?: string;
    avatar?: string;
    email?: string;
  };
  
  // Configuration
  theme?: SolanaCommerceConfig['theme'];
  allowedMints?: readonly string[];
  defaultCurrency?: Currency;
  showTransactionFee?: boolean;
  transactionFeePercent?: number;
  enableItemEditing?: boolean;
  maxQuantityPerItem?: number;
  
  // Layout options
  className?: string;
  style?: React.CSSProperties;
  
  // Callbacks
  onPayment?: (amount: number, currency: string, paymentMethod: PaymentMethod, formData?: any) => void;
  onCancel?: () => void;
  onEmailChange?: (email: string) => void;
  onItemQuantityChange?: (itemId: string, newQuantity: number) => void;
  onItemRemove?: (itemId: string) => void;
}

export const MultiItemCart = memo<MultiItemCartProps>(({
  initialItems,
  merchant,
  user,
  theme: themeConfig,
  allowedMints = ['SOL', 'USDC'],
  defaultCurrency = 'USDC',
  showTransactionFee = true,
  transactionFeePercent = 0.015,
  enableItemEditing = true,
  maxQuantityPerItem = 10,
  className = '',
  style,
  onPayment,
  onCancel,
  onEmailChange,
  onItemQuantityChange,
  onItemRemove
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qr');
  const [email, setEmail] = useState(user?.email || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');

  // Apply theme defaults
  const theme: Required<ThemeConfig> = {
    primaryColor: themeConfig?.primaryColor || '#9945FF',
    secondaryColor: themeConfig?.secondaryColor || '#14F195',
    backgroundColor: themeConfig?.backgroundColor || '#ffffff',
    textColor: themeConfig?.textColor || '#111827',
    borderRadius: themeConfig?.borderRadius || 'lg',
    fontFamily: themeConfig?.fontFamily || 'system-ui, -apple-system, sans-serif',
    buttonShadow: themeConfig?.buttonShadow || 'none',
    buttonBorder: themeConfig?.buttonBorder || 'none'
  };

  // Icons from tip modal
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

  const paymentMethods: Array<{ value: 'qr' | 'wallet'; label: string; description: string; icon: React.ReactNode }> = [
    { value: 'qr', label: 'Pay', description: 'QR code', icon: solanaPayIcon },
    { value: 'wallet', label: 'Wallet', description: 'Browser wallet', icon: walletIcon }
  ];

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const transactionFee = showTransactionFee ? Math.round(subtotal * transactionFeePercent) : 0;
    const total = subtotal + transactionFee;
    
    return { subtotal, transactionFee, total };
  }, [cartItems, showTransactionFee, transactionFeePercent]);

  // Format currency amounts
  const formatAmount = useCallback((amount: number, currency: string) => {
    if (currency === 'SOL') {
      return `${(amount / 1_000_000_000).toFixed(2)}`;
    } else if (currency === 'USDC') {
      return `$${(amount / 1_000_000).toFixed(2)}`;
    }
    return amount.toString();
  }, []);

  // Handle quantity change
  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantityPerItem) return;
    
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
    onItemQuantityChange?.(itemId, newQuantity);
  }, [maxQuantityPerItem, onItemQuantityChange]);

  // Handle item removal
  const handleItemRemove = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    onItemRemove?.(itemId);
  }, [onItemRemove]);

  // Handle email change
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    onEmailChange?.(newEmail);
  }, [onEmailChange]);

  // Handle proceeding to payment step
  const handleProceedToPayment = useCallback(async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      setIsProcessing(true);
      // Move to payment step
      setCurrentStep('payment');
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [email, cartItems]);

  // Handle going back to form
  const handleBack = useCallback(() => {
    setCurrentStep('form');
    setIsProcessing(false);
  }, []);

  // Handle actual payment completion
  const handlePaymentComplete = useCallback(async () => {
    try {
      onPayment?.(totals.total, selectedCurrency, selectedPaymentMethod, {
        email,
        cartItems,
        merchant
      });
    } catch (error) {
      console.error('Payment failed:', error);
    }
  }, [totals.total, selectedCurrency, selectedPaymentMethod, email, cartItems, merchant, onPayment]);

  const containerStyle: React.CSSProperties = {
    fontFamily: theme.fontFamily,
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    ...style
  };

  // Clean CSS Grid layout with center divider
  const responsiveStyles = `
    <style>
      .cart-grid {
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        min-height: 100vh;
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .cart-left {
        padding: 2rem;
      }
      
      .cart-divider {
        background-color: #e5e7eb;
        width: 1px;
      }
      
      .cart-right {
        padding: 2rem;
      }
      
      @media (max-width: 768px) {
        .cart-grid {
          grid-template-columns: 1fr !important;
          min-height: auto !important;
        }
        
        .cart-divider {
          display: none !important;
        }
        
        .cart-left,
        .cart-right {
          padding: 1.5rem 1rem !important;
        }
      }
      
      @media (max-width: 480px) {
        .cart-left,
        .cart-right {
          padding: 1rem !important;
        }
      }
    </style>
  `;





  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
      <div style={containerStyle} className={`multi-item-cart ${className}`}>
        <div className="cart-grid">
          {/* Left Side - Cart Items */}
          <div className="cart-left">
          {/* User/Merchant Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <img
              src={merchant.logo || DEFAULT_PROFILE_SVG}
              alt={sanitizeString(merchant.name)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                background: merchant.logo ? 'transparent' : `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                flexShrink: 0,
                marginRight: '1rem'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: theme.textColor,
                marginBottom: '0.25rem'
              }}>
                {sanitizeString(user?.name || merchant.name)}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                fontFamily: 'monospace'
              }}>
                {user?.wallet || merchant.wallet?.slice(0, 6) + '...' + merchant.wallet?.slice(-4)}
              </div>
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </div>
          </div>

          {/* Currency Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '400',
              color: `${theme.textColor}70`,
              marginBottom: '0.75rem'
            }}>
              Select stablecoin:
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
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
                transition: 'all 200ms ease-in-out',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
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
              {allowedMints.includes('USDC') && <option value="USDC">💵 USDC</option>}
              {allowedMints.includes('SOL') && <option value="SOL">◎ SOL</option>}
              {allowedMints.includes('USDT') && <option value="USDT">💰 USDT</option>}
            </select>
          </div>

          {/* Cart Items List */}
          <div style={{ marginBottom: '2rem' }}>
            {cartItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>Your cart is empty</div>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={item.id || index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.5rem 0',
                  borderBottom: index < cartItems.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: getBorderRadius('md'),
                    backgroundColor: '#f3f4f6',
                    marginRight: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}>
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: getBorderRadius('md'),
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      '📦'
                    )}
                  </div>
                  
                  <div style={{ flex: '1' }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: theme.textColor,
                      marginBottom: '0.5rem'
                    }}>
                      {sanitizeString(item.name)}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.75rem'
                    }}>
                      {sanitizeString(item.description || '')}
                    </div>
                    
                    {/* Quantity Controls */}
                    {enableItemEditing && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #d1d5db',
                            borderRadius: getBorderRadius('sm'),
                            backgroundColor: theme.backgroundColor,
                            color: theme.textColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            opacity: item.quantity <= 1 ? 0.5 : 1
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          minWidth: '2rem',
                          textAlign: 'center',
                          fontWeight: '500'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= maxQuantityPerItem}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #d1d5db',
                            borderRadius: getBorderRadius('sm'),
                            backgroundColor: theme.backgroundColor,
                            color: theme.textColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: item.quantity >= maxQuantityPerItem ? 'not-allowed' : 'pointer',
                            opacity: item.quantity >= maxQuantityPerItem ? 0.5 : 1
                          }}
                        >
                          +
                        </button>
                        
                        <button
                          onClick={() => handleItemRemove(item.id)}
                          style={{
                            marginLeft: '1rem',
                            padding: '0.25rem 0.5rem',
                            border: 'none',
                            borderRadius: getBorderRadius('sm'),
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    textAlign: 'right',
                    marginLeft: '1rem'
                  }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: theme.textColor,
                      marginBottom: '0.25rem'
                    }}>
                      {formatAmount(item.price * item.quantity, selectedCurrency)}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {formatAmount(item.price, selectedCurrency)} each
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Breakdown */}
          {cartItems.length > 0 && (
            <div style={{ 
              borderTop: '1px solid #e5e7eb',
              paddingTop: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <span style={{ color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontWeight: '500' }}>
                  {formatAmount(totals.subtotal, selectedCurrency)}
                </span>
              </div>
              
              {showTransactionFee && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ color: '#6b7280' }}>Transaction Fee</span>
                  <span style={{ fontWeight: '500' }}>
                    {formatAmount(totals.transactionFee, selectedCurrency)}
                  </span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e5e7eb',
                fontSize: '1.125rem',
                fontWeight: '700'
              }}>
                <span>Total due</span>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.primaryColor
                }}>
                  <span style={{ 
                    marginRight: '0.5rem',
                    fontSize: '1.25rem'
                  }}>
                    {selectedCurrency === 'USDC' ? '💵' : selectedCurrency === 'SOL' ? '◎' : '💰'}
                  </span>
                  {formatAmount(totals.total, selectedCurrency)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Divider */}
        <div className="cart-divider"></div>

        {/* Right Side - Checkout Form or Payment */}
        <div className="cart-right">
          {currentStep === 'form' ? (
            <>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: theme.textColor,
                marginBottom: '2rem',
                margin: '0 0 2rem 0'
              }}>
                Checkout
              </h2>

              {/* Email Field */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: '400',
                  color: `${theme.textColor}70`,
                  marginBottom: '0.75rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@email.com"
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
                />
              </div>

              {/* Payment Method Selection */}
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

              {/* Pay Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={isProcessing || !email.trim() || cartItems.length === 0}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: isProcessing || !email.trim() || cartItems.length === 0 ? '#9ca3af' : theme.primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: getBorderRadius(theme.borderRadius),
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isProcessing || !email.trim() || cartItems.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                type="button"
                onMouseEnter={(e) => {
                  if (!isProcessing && email.trim() && cartItems.length > 0) {
                    e.currentTarget.style.backgroundColor = theme.secondaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing && email.trim() && cartItems.length > 0) {
                    e.currentTarget.style.backgroundColor = theme.primaryColor;
                  }
                }}
              >
                {isProcessing ? 'Processing...' : 
                 cartItems.length === 0 ? 'Cart is empty' :
                 `Pay ${formatAmount(totals.total, selectedCurrency)}`}
              </button>
            </>
          ) : (
            <>
              {/* Back Button */}
              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: `1px solid ${theme.primaryColor}40`,
                  borderRadius: getBorderRadius('md'),
                  backgroundColor: 'transparent',
                  color: theme.primaryColor,
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '2rem',
                  transition: 'all 0.15s ease-in-out',
                  fontFamily: theme.fontFamily
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.primaryColor}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to cart
              </button>

              {/* Payment Content */}
              {selectedPaymentMethod === 'qr' ? (
                <QRPaymentContent
                  theme={theme}
                  config={{ merchant }}
                  selectedAmount={totals.total}
                  selectedCurrency={selectedCurrency}
                  customAmount={formatAmount(totals.total, selectedCurrency)}
                  showCustomInput={false}
                />
              ) : (
                <WalletPaymentContent
                  theme={theme}
                  config={{ merchant }}
                  selectedAmount={totals.total}
                  selectedCurrency={selectedCurrency}
                  customAmount={formatAmount(totals.total, selectedCurrency)}
                  showCustomInput={false}
                  onPaymentComplete={handlePaymentComplete}
                  walletIcon={paymentMethods.find(m => m.value === 'wallet')?.icon}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
});

MultiItemCart.displayName = 'MultiItemCart';