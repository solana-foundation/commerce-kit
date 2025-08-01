"use client";

import { useState, useCallback, useRef } from 'react';
import { PaymentState, PaymentOptions, OrderRequest, createCommerceClient, SolanaClientConfig, createCommercePaymentRequest, OrderItem, verifyPayment, waitForConfirmation } from '@solana-commerce/headless-sdk';

export function usePayment(options: PaymentOptions = {}) {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    isVerifying: false,
    paymentUrl: null,
    qrCodeData: null,
    signature: null,
    verificationResult: null,
    error: null,
    retryCount: 0
  });

  // Keep refs for cleanup
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create commerce client
  const createClient = useCallback(() => {
    const config: SolanaClientConfig = {
      network: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com'
    };
    return createCommerceClient(config);
  }, []);

  // Create payment request
  const initiatePayment = useCallback(async (request: OrderRequest) => {
    try {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        retryCount: 0
      }));

      // Create payment request
      const paymentRequest = createCommercePaymentRequest(request);
      
      setPaymentState(prev => ({
        ...prev,
        paymentUrl: paymentRequest.url,
        qrCodeData: paymentRequest.qrCode
      }));

      options.onPaymentInitiated?.(paymentRequest.url);

      return paymentRequest;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment request';
      
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));

      options.onPaymentError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [options]);

  // Process signature and verify payment
  const processSignature = useCallback(async (
    signature: string,
    expectedAmount?: number,
    expectedRecipient?: string
  ) => {
    try {
      setPaymentState(prev => ({
        ...prev,
        signature,
        isVerifying: true,
        error: null
      }));

      options.onPaymentSigned?.(signature);

      const client = createClient();
      
      // First, wait for confirmation with timeout
      const timeoutMs = 30000;
      
      verificationTimeoutRef.current = setTimeout(() => {
        setPaymentState(prev => ({
          ...prev,
          isVerifying: false,
          error: 'Payment verification timeout'
        }));
        
        options.onPaymentError?.(new Error('Payment verification timeout'));
      }, timeoutMs);

      // Wait for confirmation
      const confirmed = await waitForConfirmation(client, signature, timeoutMs);
      
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
        verificationTimeoutRef.current = null;
      }

      if (!confirmed) {
        throw new Error('Payment not confirmed within timeout period');
      }

      // Verify payment details
      const verificationResult = await verifyPayment(
        client,
        signature,
        expectedAmount,
        expectedRecipient
      );

      setPaymentState(prev => ({
        ...prev,
        isVerifying: false,
        verificationResult,
        error: verificationResult.verified ? null : verificationResult.error || 'Payment verification failed'
      }));

      options.onPaymentVerified?.(verificationResult);

      return verificationResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      
      setPaymentState(prev => ({
        ...prev,
        isVerifying: false,
        error: errorMessage
      }));

      options.onPaymentError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [createClient, options]);

  // Start polling for signature (for QR code payments)
  const startSignaturePolling = useCallback((
    reference: string,
    expectedAmount?: number,
    expectedRecipient?: string
  ) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const client = createClient();
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes with 5-second intervals

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      
      if (pollCount >= maxPolls) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'Payment polling timeout - no signature found'
        }));
        
        options.onPaymentError?.(new Error('Payment polling timeout'));
        return;
      }

      try {
        // This is a simplified polling - in production you'd use RPC subscription
        // or check for transactions with the specific reference
        
        // For now, we'll just update the polling state
        setPaymentState(prev => ({
          ...prev,
          retryCount: pollCount
        }));

      } catch (error) {
        console.warn('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

  }, [createClient, options]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
  }, []);

  // Retry payment
  const retryPayment = useCallback(async (request: OrderRequest) => {
    const maxRetries = 3;
    
    if (paymentState.retryCount >= maxRetries) {
      const error = new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
      options.onPaymentError?.(error);
      throw error;
    }

    setPaymentState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null
    }));

    return await initiatePayment(request);
  }, [paymentState.retryCount, options, initiatePayment]);

  // Reset payment state
  const resetPayment = useCallback(() => {
    stopPolling();
    
    setPaymentState({
      isProcessing: false,
      isVerifying: false,
      paymentUrl: null,
      qrCodeData: null,
      signature: null,
      verificationResult: null,
      error: null,
      retryCount: 0
    });
  }, [stopPolling]);

  // Cancel payment
  const cancelPayment = useCallback(() => {
    stopPolling();
    
    setPaymentState(prev => ({
      ...prev,
      isProcessing: false,
      isVerifying: false,
      error: 'Payment cancelled by user'
    }));
  }, [stopPolling]);

  // Create Buy Now payment
  const createBuyNowPayment = useCallback(async (
    recipient: string,
    product: OrderItem,
    options: {
      memo?: string;
      label?: string;
      message?: string;
    } = {}
  ) => {
    const request: OrderRequest = {
      recipient,
      amount: product.price,
      currency: 'SOL',
      items: [product],
      memo: options.memo || `Purchase: ${product.name}`,
      label: options.label || product.name,
      message: options.message || `Thank you for purchasing ${product.name}!`
    };

    return await initiatePayment(request);
  }, [initiatePayment]);

  // Create Cart payment
  const createCartPayment = useCallback(async (
    recipient: string,
    products: OrderItem[],
    options: {
      memo?: string;
      label?: string;
      message?: string;
      currency?: string;
    } = {}
  ) => {
    const totalAmount = products.reduce((sum, product) => sum + product.price, 0);
    
    const request: OrderRequest = {
      recipient,
      amount: totalAmount,
      currency: options.currency,
      items: products,
      memo: options.memo || `Cart purchase (${products.length} items)`,
      label: options.label || 'Cart Checkout',
      message: options.message || 'Thank you for your purchase!'
    };

    return await initiatePayment(request);
  }, [initiatePayment]);

  // Cleanup effect
  const cleanup = useCallback(() => {
    stopPolling();
  }, [stopPolling]);

  return {
    paymentState,
    initiatePayment,
    processSignature,
    startSignaturePolling,
    stopPolling,
    retryPayment,
    resetPayment,
    cancelPayment,
    createBuyNowPayment,
    createCartPayment,
    cleanup
  };
}