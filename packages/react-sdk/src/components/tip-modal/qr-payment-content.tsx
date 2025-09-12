import React, { memo, useEffect, useState, useRef } from 'react';
import { getBorderRadius, getContainerBorderRadius } from '../../utils';
import { type ThemeConfig, type MerchantConfig, type Currency, CurrencyMap} from '../../types';
import { useSolanaPay } from '../../hooks/use-solana-pay';
import { useTimer } from '../../hooks/use-timer';
import { usePaymentStatus } from '../../hooks/use-payment-status';
import { MerchantAddressPill } from './merchant-address-pill';
// import { SPLToken } from '@solana-commerce/solana-pay';
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
  const [pollingMessage, setPollingMessage] = useState('Waiting for payment...');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced payment status management
  const paymentStatus = usePaymentStatus();

  // Enhanced timer for payment timeout (2 minutes)
  const paymentTimer = useTimer({
    duration: 120, // 2 minutes
    autoStart: false,
    onComplete: () => {
      paymentStatus.handleTimeout();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    },
    onTick: (remaining) => {
      if (remaining <= 30) {
        setPollingMessage(`Payment expires in ${remaining}s...`);
      }
    }
  });

  // Compute the effective amount for QR code generation
  const effectiveAmount = showCustomInput ? parseFloat(customAmount || '0') : selectedAmount;

  const { paymentRequest, loading } = useSolanaPay(config.merchant.wallet, effectiveAmount, selectedCurrency);

  // Start polling when QR code is generated and user might have scanned it
  useEffect(() => {
    if (paymentRequest && paymentStatus.status === 'idle') {
      paymentStatus.setStatus('scanning');
      paymentTimer.start();
      setTimeout(() => {
        startPolling(paymentRequest.memo);
      }, 2000);
    }
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      paymentTimer.stop();
    };
  }, [paymentRequest, paymentStatus.status, paymentTimer, paymentStatus]);

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
        
        paymentStatus.handleTimeout();
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

        if (paymentStatus.status === 'scanning') {
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
    
    paymentTimer.stop();
    paymentStatus.handleSuccess();
    setPollingMessage('Payment confirmed!');
    onPaymentComplete?.();
  };



  // dev only logs could be added behind NODE_ENV checks if necessary
  
  return (
    <div className="ck-qr-container">
      {/* QR Code Container with Viewfinder */}
      <div className="ck-qr-viewfinder">
        {/* Viewfinder SVG Background */}
        <svg 
          width="283" 
          height="283" 
          viewBox="0 0 283 283" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="ck-qr-viewfinder-svg"
        >
          <path d="M3.5 264.06C3.5 272.587 10.4127 279.5 18.9399 279.5H32.8799C33.7083 279.5 34.3799 280.172 34.3799 281V281C34.3799 281.828 33.7083 282.5 32.8799 282.5H17.4399C8.08427 282.5 0.5 274.916 0.5 265.56V250.12C0.5 249.292 1.17157 248.62 2 248.62V248.62C2.82843 248.62 3.5 249.292 3.5 250.12V264.06ZM282.5 266.058C282.5 275.139 275.139 282.5 266.058 282.5H251.116C250.288 282.5 249.616 281.828 249.616 281V281C249.616 280.172 250.288 279.5 251.116 279.5H264.558C272.81 279.5 279.5 272.81 279.5 264.558V250.12C279.5 249.292 280.172 248.62 281 248.62V248.62C281.828 248.62 282.5 249.292 282.5 250.12V266.058ZM34.3799 2C34.3799 2.82843 33.7083 3.5 32.8799 3.5H18.9399C10.4127 3.5 3.5 10.4127 3.5 18.9399V32.8799C3.5 33.7083 2.82843 34.3799 2 34.3799V34.3799C1.17157 34.3799 0.5 33.7083 0.5 32.8799V17.4399C0.5 8.08427 8.08427 0.5 17.4399 0.5H32.8799C33.7083 0.5 34.3799 1.17157 34.3799 2V2ZM282.5 32.8799C282.5 33.7083 281.828 34.3799 281 34.3799V34.3799C280.172 34.3799 279.5 33.7083 279.5 32.8799V18.4419C279.5 10.1897 272.81 3.5 264.558 3.5H251.116C250.288 3.5 249.616 2.82843 249.616 2V2C249.616 1.17157 250.288 0.5 251.116 0.5H266.058C275.139 0.5 282.5 7.86129 282.5 16.9419V32.8799Z" fill={paymentStatus.status === 'error' ? '#FF0000' : '#2D2D2D'} fillOpacity={paymentStatus.status === 'error' ? '0.56' : '0.24'}/>
        </svg>
        
        {/* QR Code Content */}
        <div className={`ck-qr-content ${paymentStatus.status === 'error' ? 'error' : ''}`}>
        {/* Gradient Background */}
        <div className={`ck-qr-gradient ${paymentStatus.status === 'error' ? 'error' : ''}`}>
          {/* Shine Effect - Only show when not in error state and payment is scanning */}
          {paymentStatus.status !== 'error' && paymentStatus.status === 'scanning' && (
            <div className="ck-qr-shine" />
          )}
        </div>
        {(() => {
          if (loading) {
            return (
              <div className="ck-qr-state-container">
                <div className="ck-qr-loading-text">Loading QR code...</div>
              </div>
            );
            }
            
          if (!paymentRequest) {
            return (
              <div className="ck-qr-state-container">
                <div className="ck-qr-loading-text">Failed to generate QR code</div>
                <button
                  onClick={() => window.location.reload()}
                  className="ck-qr-retry-button"
                >
                  Retry
                </button>
              </div>
            );
            }

          if (paymentStatus.status === 'success') {
            return (
              <div className="ck-qr-state-container ck-qr-success-container">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                <div className="ck-qr-success-text">Payment Confirmed!</div>
              </div>
            );
            }

          if (paymentStatus.status === 'error' || paymentStatus.status === 'timeout') {
            return (
              <div className="ck-qr-error-container">
                <svg width="48" height="49" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.33333 15.5003H14V22.167M2.01333 15.5003H2M8.68 22.167H8.66667M14.0133 27.5003H14M26.0133 15.5003H26M2 22.167H4M18.6667 15.5003H21.3333M2 27.5003H8.66667M14 2.16699V10.167M21.4667 27.5003H23.8667C24.6134 27.5003 24.9868 27.5003 25.272 27.355C25.5229 27.2272 25.7268 27.0232 25.8547 26.7723C26 26.4871 26 26.1137 26 25.367V22.967C26 22.2203 26 21.8469 25.8547 21.5617C25.7268 21.3108 25.5229 21.1068 25.272 20.979C24.9868 20.8337 24.6134 20.8337 23.8667 20.8337H21.4667C20.7199 20.8337 20.3466 20.8337 20.0613 20.979C19.8105 21.1068 19.6065 21.3108 19.4787 21.5617C19.3333 21.8469 19.3333 22.2203 19.3333 22.967V25.367C19.3333 26.1137 19.3333 26.4871 19.4787 26.7723C19.6065 27.0232 19.8105 27.2272 20.0613 27.355C20.3466 27.5003 20.7199 27.5003 21.4667 27.5003ZM21.4667 10.167H23.8667C24.6134 10.167 24.9868 10.167 25.272 10.0217C25.5229 9.89384 25.7268 9.68986 25.8547 9.43898C26 9.15376 26 8.7804 26 8.03366V5.63366C26 4.88692 26 4.51355 25.8547 4.22834C25.7268 3.97746 25.5229 3.77348 25.272 3.64565C24.9868 3.50033 24.6134 3.50033 23.8667 3.50033H21.4667C20.7199 3.50033 20.3466 3.50033 20.0613 3.64565C19.8105 3.77348 19.6065 3.97746 19.4787 4.22834C19.3333 4.51355 19.3333 4.88692 19.3333 5.63366V8.03366C19.3333 8.7804 19.3333 9.15376 19.4787 9.43898C19.6065 9.68986 19.8105 9.89384 20.0613 10.0217C20.3466 10.167 20.7199 10.167 21.4667 10.167ZM4.13333 10.167H6.53333C7.28007 10.167 7.65344 10.167 7.93865 10.0217C8.18954 9.89384 8.39351 9.68986 8.52134 9.43898C8.66667 9.15376 8.66667 8.7804 8.66667 8.03366V5.63366C8.66667 4.88692 8.66667 4.51355 8.52134 4.22834C8.39351 3.97746 8.18954 3.77348 7.93865 3.64565C7.65344 3.50033 7.28007 3.50033 6.53333 3.50033H4.13333C3.3866 3.50033 3.01323 3.50033 2.72801 3.64565C2.47713 3.77348 2.27316 3.97746 2.14532 4.22834C2 4.51355 2 4.88692 2 5.63366V8.03366C2 8.7804 2 9.15376 2.14532 9.43898C2.27316 9.68986 2.47713 9.89384 2.72801 10.0217C3.01323 10.167 3.3866 10.167 4.13333 10.167Z" stroke="#FF0000" strokeOpacity="0.56" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="ck-qr-error-title">
                  Payment time out
                </div>
                <button
                  onClick={() => {
                    paymentStatus.reset();
                    paymentTimer.reset();
                    setPollingMessage('Waiting for payment...');
                  }}
                  className="ck-qr-error-button"
                  style={{ borderRadius: getBorderRadius(theme.borderRadius) }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.30087 3.20164C8.45564 2.35583 7.2893 1.83366 5.9999 1.83366C3.42257 1.83366 1.33323 3.923 1.33323 6.50033C1.33323 9.07765 3.42257 11.167 5.9999 11.167C8.12658 11.167 9.9224 9.74394 10.4842 7.79693C10.5736 7.48739 10.8969 7.30887 11.2064 7.39819C11.516 7.48751 11.6945 7.81085 11.6052 8.12039C10.9031 10.5534 8.66016 12.3337 5.9999 12.3337C2.77824 12.3337 0.166563 9.72199 0.166563 6.50033C0.166563 3.27866 2.77824 0.666992 5.9999 0.666992C7.61129 0.666992 9.07102 1.32114 10.1261 2.37696C10.4972 2.74826 10.8965 3.20899 11.2498 3.63869V1.83366C11.2498 1.51149 11.511 1.25033 11.8332 1.25033C12.1553 1.25033 12.4165 1.51149 12.4165 1.83366V5.33366C12.4165 5.65583 12.1553 5.91699 11.8332 5.91699H8.33317C8.011 5.91699 7.74984 5.65583 7.74984 5.33366C7.74984 5.01149 8.011 4.75033 8.33317 4.75033H10.6486C10.2495 4.2495 9.74668 3.64775 9.30087 3.20164Z" fill="black" fillOpacity="0.72"/>
                  </svg>
                  Try Again
                </button>
              </div>
            );
            }
            
          return (
            <div className="ck-qr-code-container">
              <div 
                dangerouslySetInnerHTML={{ __html: paymentRequest.qr }}
                className={`ck-qr-code ${paymentStatus.status === 'processing' ? 'processing' : ''}`}
              />
                {paymentStatus.status === 'processing' && (
                  <div 
                    className="ck-qr-processing-overlay"
                    style={{ border: `2px solid ${theme.primaryColor}20` }}
                  >
                    <div 
                      className="ck-qr-processing-spinner"
                      style={{
                        border: `4px solid ${theme.primaryColor}20`,
                        borderTop: `4px solid ${theme.primaryColor}`
                      }}
                    />
                    <div 
                      className="ck-qr-processing-title"
                      style={{ color: theme.textColor }}
                    >
                      Payment Detected!
                    </div>
                    <div 
                      className="ck-qr-processing-message"
                      style={{ color: `${theme.textColor}70` }}
                    >
                      {pollingMessage}
                    </div>
                  </div>
                )}
              </div>
            );
        })()}
        </div>
      </div>

      {/* Timer Pill - Always show when not in success state */}
      {paymentStatus.status !== 'success' && (
        <div className="ck-timer-container">
          <div className="ck-timer-pill">
            <div className="ck-timer-dot" />
            <span>
              {paymentTimer.formatTime()}
            </span>
          </div>
        </div>
      )}

      {/* Simple Payment Info - Matching Demo Layout */}
      {paymentStatus.status !== 'success' && (
        <>
          <h2 className="ck-payment-info" style={{ color: theme.textColor }}>
            <span className="ck-payment-amount-dim">Send</span> ${displayAmount} {selectedCurrency}
          </h2>
          
          {/* Profile Picture and Name Pill - Shows address on hover */}
          <MerchantAddressPill
            theme={theme}
            config={config}
            copiedText="Address Copied!"
          />
        </>
      )}



      {/* Test button for development - remove in production */}
      {process.env.NODE_ENV === 'development' && paymentStatus.status === 'processing' && (
        <div className="ck-dev-test-container">
          <button
            onClick={handlePaymentSuccess}
            className="ck-dev-test-button"
            style={{
              backgroundColor: theme.secondaryColor,
              borderRadius: getBorderRadius(theme.borderRadius)
            }}
          >
            Simulate Payment Success (Dev Only)
          </button>
        </div>
      )}
    </div>
  );
});

QRPaymentContent.displayName = 'QRPaymentContent';