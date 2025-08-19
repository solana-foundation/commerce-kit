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
  const [timeRemaining, setTimeRemaining] = useState(120); // 60 polls * 2 seconds = 120 seconds
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
    setTimeRemaining(120); // Reset timer to full 2 minutes (60 polls * 2 seconds)

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      const remaining = Math.max(0, (maxPolls - pollCount) * 2); // 2 seconds per poll
      setTimeRemaining(remaining);
      
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
        
        // For SPL tokens, we need to check the Associated Token Account (Token or Token-2022)
        const selectedToken = CurrencyMap[selectedCurrency];
        const isSOL = selectedToken === address("So11111111111111111111111111111111111111112");

        if (!isSOL) {
          const tokenMintAddress = address(selectedToken);
          const ataV1 = await getAssociatedTokenAccountAddress(tokenMintAddress, merchantAddress, TOKEN_PROGRAM_ADDRESS).catch(() => null as any);
          const ataV2 = await getAssociatedTokenAccountAddress(tokenMintAddress, merchantAddress, TOKEN_2022_PROGRAM_ADDRESS).catch(() => null as any);
          addressToCheck = ataV1 ?? ataV2 ?? merchantAddress;
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

  // dev only logs could be added behind NODE_ENV checks if necessary
  
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
      {/* QR Code Container with Viewfinder */}
      <div style={{
        width: '283px',
        height: '283px',
        margin: '0 auto 0rem auto',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Viewfinder SVG Background */}
        <svg 
          width="283" 
          height="283" 
          viewBox="0 0 283 283" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        >
          <path d="M3.5 264.06C3.5 272.587 10.4127 279.5 18.9399 279.5H32.8799C33.7083 279.5 34.3799 280.172 34.3799 281V281C34.3799 281.828 33.7083 282.5 32.8799 282.5H17.4399C8.08427 282.5 0.5 274.916 0.5 265.56V250.12C0.5 249.292 1.17157 248.62 2 248.62V248.62C2.82843 248.62 3.5 249.292 3.5 250.12V264.06ZM282.5 266.058C282.5 275.139 275.139 282.5 266.058 282.5H251.116C250.288 282.5 249.616 281.828 249.616 281V281C249.616 280.172 250.288 279.5 251.116 279.5H264.558C272.81 279.5 279.5 272.81 279.5 264.558V250.12C279.5 249.292 280.172 248.62 281 248.62V248.62C281.828 248.62 282.5 249.292 282.5 250.12V266.058ZM34.3799 2C34.3799 2.82843 33.7083 3.5 32.8799 3.5H18.9399C10.4127 3.5 3.5 10.4127 3.5 18.9399V32.8799C3.5 33.7083 2.82843 34.3799 2 34.3799V34.3799C1.17157 34.3799 0.5 33.7083 0.5 32.8799V17.4399C0.5 8.08427 8.08427 0.5 17.4399 0.5H32.8799C33.7083 0.5 34.3799 1.17157 34.3799 2V2ZM282.5 32.8799C282.5 33.7083 281.828 34.3799 281 34.3799V34.3799C280.172 34.3799 279.5 33.7083 279.5 32.8799V18.4419C279.5 10.1897 272.81 3.5 264.558 3.5H251.116C250.288 3.5 249.616 2.82843 249.616 2V2C249.616 1.17157 250.288 0.5 251.116 0.5H266.058C275.139 0.5 282.5 7.86129 282.5 16.9419V32.8799Z" fill="#2D2D2D" fillOpacity="0.24"/>
        </svg>
        
        {/* QR Code Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
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
                    setTimeRemaining(120);
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
      </div>

      {/* Timer Pill - Show countdown when scanning */}
      {paymentStatus === 'scanning' && pollingIntervalRef.current && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            backgroundColor: 'white',
            border: `1px solid #00000030`,
            borderRadius: '50px',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: theme.primaryColor,
            fontWeight: '500'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: theme.primaryColor,
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            <span>
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

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