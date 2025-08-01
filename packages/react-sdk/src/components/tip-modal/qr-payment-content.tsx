import React, { memo, useEffect, useState, useRef } from 'react';
import { getBorderRadius, getContainerBorderRadius, sanitizeString } from '../../utils';
import { type ThemeConfig, type MerchantConfig, type Currency, CurrencyMap} from '../../types';
import { useSolanaPay } from '../../hooks/use-solana-pay';
import { SPLToken } from '@solana-commerce/solana-pay';
import { createCommerceClient, verifyPayment, waitForConfirmation } from '@solana-commerce/headless-sdk';
import { address } from 'gill';
import { getAssociatedTokenAccountAddress, TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS } from 'gill/programs/token';

interface QRPaymentContentProps {
  theme: Required<ThemeConfig>;
  config: { merchant: MerchantConfig, rpcUrl?: string };
  selectedAmount: number;
  selectedCurrency: Currency;
  customAmount: string;
  showCustomInput: boolean;
  onPaymentComplete?: () => void;
  onPaymentError?: (error: Error) => void;
}

export const QRPaymentContent = memo<QRPaymentContentProps>(({
  theme,
  config,
  selectedAmount,
  selectedCurrency,
  customAmount,
  showCustomInput,
  onPaymentComplete,
  onPaymentError
}) => {
  const displayAmount = showCustomInput ? customAmount || '0' : selectedAmount.toString();
  const [paymentStatus, setPaymentStatus] = useState<'scanning' | 'processing' | 'success' | 'error'>('scanning');
  const [pollingMessage, setPollingMessage] = useState('Waiting for payment...');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { paymentRequest, loading } = useSolanaPay(config.merchant.wallet, selectedAmount, CurrencyMap[selectedCurrency]);

  // Start polling when QR code is generated and user might have scanned it
  useEffect(() => {
    if (paymentRequest && paymentStatus === 'scanning') {
      setTimeout(() => {
        startPolling(paymentRequest.memo);
      }, 2000);
    }
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [paymentRequest, paymentStatus]);

  const startPolling = (memo: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }


    const client = createCommerceClient({
      network: 'mainnet',
      rpcUrl: config.rpcUrl
    });

    let pollCount = 0;
    const maxPolls = 60;

    setPollingMessage('Waiting for payment...');

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      
      if (pollCount >= maxPolls) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setPaymentStatus('error');
        setPollingMessage('Payment timeout - please try again');
        onPaymentError?.(new Error('Payment polling timeout'));
        return;
      }

      try {
        // Determine the address to check based on payment type
        const merchantAddress = address(config.merchant.wallet);
        let addressToCheck = merchantAddress;
        
        // For SPL tokens, we need to check the Associated Token Account
        const selectedToken = CurrencyMap[selectedCurrency];
        const isSOL = selectedToken === address("So11111111111111111111111111111111111111112");
        
        if (!isSOL) {
          // Get the ATA address for the SPL token
          const tokenMintAddress = address(selectedToken);
          addressToCheck = await getAssociatedTokenAccountAddress(tokenMintAddress, merchantAddress, TOKEN_PROGRAM_ADDRESS);
        }

        const signatures = await client.rpc.getSignaturesForAddress(addressToCheck, {
          limit: 10,
          commitment: 'confirmed'
        }).send();

        for (const signature of signatures.values()){
          // Parse memo to remove length prefix - format is "[length] memo"
          const parsedMemo = signature.memo ? signature.memo.replace(/^\[\d+\]\s+/, '').trim() : '';
          if (parsedMemo === memo) {
            handlePaymentSuccess();
            return;
          }
        }

        if (paymentStatus === 'scanning') {
          setPollingMessage(`Scan QR code to pay (${pollCount}/${maxPolls})`);
        }
        
      } catch (error) {
        console.warn('Polling error:', error);
        setPollingMessage(`Scanning for payment... (${pollCount}/${maxPolls})`);
      }
    }, 2000);
  };

  const handlePaymentSuccess = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setPaymentStatus('success');
    setPollingMessage('Payment confirmed!');
    onPaymentComplete?.();
  };

  console.log(config, selectedAmount, selectedCurrency, customAmount, showCustomInput);
  console.log('Payment request:', paymentRequest);
  
  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
      {/* QR Code Container - Clean and Simple like Demo */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto 2rem auto',
        backgroundColor: theme.backgroundColor === '#ffffff' ? '#f9fafb' : `${theme.backgroundColor}10`,
        border: theme.backgroundColor === '#ffffff' 
          ? '2px dashed #e5e7eb' 
          : `2px dashed ${theme.primaryColor}40`,
        borderRadius: getContainerBorderRadius(theme.borderRadius),
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        {(() => {
          if (loading) {
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                color: `${theme.textColor}70`
              }}>
                <div style={{ fontSize: '1rem' }}>Loading QR code...</div>
              </div>
            );
            }
            
          if (!paymentRequest) {
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                color: `${theme.textColor}70`
              }}>
                <div style={{ fontSize: '1rem' }}>Failed to generate QR code</div>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: theme.primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: getBorderRadius(theme.borderRadius),
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            );
            }

          if (paymentStatus === 'success') {
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                color: theme.primaryColor
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>Payment Confirmed!</div>
              </div>
            );
            }

          if (paymentStatus === 'error') {
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem',
                color: '#ef4444'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <div style={{ fontSize: '1rem', textAlign: 'center' }}>{pollingMessage}</div>
                <button
                  onClick={() => {
                    setPaymentStatus('scanning');
                    setPollingMessage('Waiting for payment...');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: theme.primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: getBorderRadius(theme.borderRadius),
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            );
            }
            
          return (
            <div style={{ position: 'relative' }}>
              <div 
                dangerouslySetInnerHTML={{ __html: paymentRequest.qr }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: paymentStatus === 'processing' ? 0.6 : 1
                }}
              />
                {paymentStatus === 'processing' && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '1.5rem 2rem',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    textAlign: 'center',
                    minWidth: '200px',
                    border: `2px solid ${theme.primaryColor}20`
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: `4px solid ${theme.primaryColor}20`,
                      borderTop: `4px solid ${theme.primaryColor}`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }}></div>
                    <div style={{ 
                      fontSize: '1rem', 
                      color: theme.textColor,
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      Payment Detected!
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: `${theme.textColor}70`
                    }}>
                      {pollingMessage}
                    </div>
                  </div>
                )}
              </div>
            );
        })()}
      </div>

      {/* Simple Payment Info - Matching Demo Layout */}
      {paymentStatus !== 'success' && (
        <>
          <h2 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: theme.textColor
          }}>
            Send ${displayAmount} {selectedCurrency}
          </h2>
          
          <p style={{
            margin: '0 0 2rem 0',
            fontSize: '1rem',
            color: `${theme.textColor}70`
          }}>
            to {sanitizeString(config.merchant.name)}
          </p>
          
          {/* Wallet Address */}
          <div style={{
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            color: `${theme.textColor}60`,
            backgroundColor: theme.backgroundColor === '#ffffff' ? '#f3f4f6' : `${theme.backgroundColor}20`,
            padding: '1rem',
            borderRadius: getContainerBorderRadius(theme.borderRadius),
            wordBreak: 'break-all',
            border: `1px solid ${theme.backgroundColor === '#ffffff' ? '#e5e7eb' : `${theme.textColor}10`}`,
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {config.merchant.wallet}
          </div>
        </>
      )}

      {/* Status Indicator - Only show when actively polling */}
      {paymentStatus === 'scanning' && pollingIntervalRef.current && (
        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: `${theme.primaryColor}10`,
          borderRadius: getContainerBorderRadius(theme.borderRadius),
          border: `1px solid ${theme.primaryColor}30`,
          textAlign: 'center',
          maxWidth: '300px',
          margin: '1.5rem auto 0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: theme.primaryColor
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: theme.primaryColor,
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            {pollingMessage}
          </div>
        </div>
      )}

      {/* Test button for development - remove in production */}
      {process.env.NODE_ENV === 'development' && paymentStatus === 'processing' && (
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={handlePaymentSuccess}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.secondaryColor,
              color: 'white',
              border: 'none',
              borderRadius: getBorderRadius(theme.borderRadius),
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Simulate Payment Success (Dev Only)
          </button>
        </div>
      )}
      </div>
    </>
  );
});

QRPaymentContent.displayName = 'QRPaymentContent';