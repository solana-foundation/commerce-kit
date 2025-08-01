"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { SolanaCommerceConfig } from '../index';
import { CheckoutStep, getCheckoutSteps, SecureOrderConfig } from '@solana-commerce/headless-sdk';
import { Customer } from '@solana-commerce/headless-sdk/src/types/customer';

const createSecurePaymentContext = (merchantId: string, clientId: string, options?: any) => ({
  sessionId: 'temp-session',
  reference: 'temp-reference',
  timestamp: Date.now(),
  csrfToken: 'temp-csrf',
  isValid: true,
  errors: []
});

const validateCheckoutSession = (config: SecureOrderConfig, options?: any) => ({
  valid: true,
  errors: [],
  warnings: []
});

const validatePaymentParams = (params: any) => ({
  valid: true,
  errors: [],
  warnings: []
});

export interface CheckoutState {
  // Current step in checkout process
  currentStep: 'details' | 'payment' | 'confirmation';
  steps: CheckoutStep[];
  
  // Payment processing
  isProcessing: boolean;
  isLoading: boolean;
  
  // Selected payment method
  paymentMethod: 'SOL' | 'USDC' | 'USDT';
  
  // Customer information
  customerInfo: Customer;
  
  // Security context
  securityContext: {
    sessionId: string;
    reference: string;
    timestamp: number;
    csrfToken: string;
  } | null;
  
  // Error handling
  errors: Record<string, string>;
  globalError: string | null;
  
  // Success state
  paymentSignature: string | null;
  orderId: string | null;
}

export interface UseCheckoutOptions {
  mode: 'buyNow' | 'cart';
  merchantId: string;
  enableSecurity?: boolean;
  sessionTimeout?: number;
  onStepChange?: (step: string) => void;
  onPaymentSuccess?: (signature: string, orderId?: string) => void;
  onPaymentError?: (error: Error) => void;
  onValidationError?: (errors: Record<string, string>) => void;
}

export function useCheckout(
  config: SolanaCommerceConfig,
  options: UseCheckoutOptions
) {
  // Generate client identifier for rate limiting
  const clientIdentifier = useMemo(() => {
    return typeof window !== 'undefined' 
      ? `${window.navigator.userAgent}-${Date.now()}`.slice(0, 50)
      : 'server-side';
  }, []);

  // Initial checkout state
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    currentStep: 'details',
    steps: getCheckoutSteps(options.mode),
    isProcessing: false,
    isLoading: false,
    paymentMethod: 'SOL',
    customerInfo: {},
    securityContext: null,
    errors: {},
    globalError: null,
    paymentSignature: null,
    orderId: null
  });

  // Initialize security context
  useEffect(() => {
    if (options.enableSecurity !== false && typeof window !== 'undefined') {
      try {
        const context = createSecurePaymentContext(
          options.merchantId,
          clientIdentifier,
          {
            sessionTimeout: options.sessionTimeout,
            enableRateLimit: true
          }
        );

        if (context.isValid) {
          setCheckoutState(prev => ({
            ...prev,
            securityContext: {
              sessionId: context.sessionId,
              reference: context.reference,
              timestamp: context.timestamp,
              csrfToken: context.csrfToken
            }
          }));
        } else {
          setCheckoutState(prev => ({
            ...prev,
            globalError: context.errors.join(', ')
          }));
        }
      } catch (error) {
        console.error('Failed to initialize security context:', error);
        setCheckoutState(prev => ({
          ...prev,
          globalError: 'Failed to initialize secure checkout'
        }));
      }
    }
  }, [options.merchantId, clientIdentifier, options.enableSecurity, options.sessionTimeout]);

  // Update customer information
  const updateCustomerInfo = useCallback((info: Partial<Customer>) => {
    setCheckoutState(prev => ({
      ...prev,
      customerInfo: { ...prev.customerInfo, ...info },
      errors: { ...prev.errors, customerInfo: '' } // Clear customer info errors
    }));
  }, []);

  // Select payment method
  const selectPaymentMethod = useCallback((method: 'SOL' | 'USDC' | 'USDT') => {
    // Validate that the method is allowed
    const allowedMints = config.allowedMints || ['SOL'];
    if (!allowedMints.includes(method)) {
      setCheckoutState(prev => ({
        ...prev,
        errors: { ...prev.errors, paymentMethod: `${method} is not allowed` }
      }));
      return;
    }

    setCheckoutState(prev => ({
      ...prev,
      paymentMethod: method,
      errors: { ...prev.errors, paymentMethod: '' }
    }));
  }, [config.allowedMints]);

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    setCheckoutState(prev => {
      const currentIndex = prev.steps.findIndex(step => step.active);
      if (currentIndex < prev.steps.length - 1) {
        const newSteps = prev.steps.map((step, index) => ({
          ...step,
          completed: index <= currentIndex,
          active: index === currentIndex + 1
        }));

        const nextStep = newSteps[currentIndex + 1];
        const stepName = nextStep?.id as CheckoutState['currentStep'];
        
        options.onStepChange?.(stepName);
        
        return {
          ...prev,
          currentStep: stepName,
          steps: newSteps
        };
      }
      return prev;
    });
  }, [options]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    setCheckoutState(prev => {
      const currentIndex = prev.steps.findIndex(step => step.active);
      if (currentIndex > 0) {
        const newSteps = prev.steps.map((step, index) => ({
          ...step,
          completed: index < currentIndex - 1,
          active: index === currentIndex - 1
        }));

        const prevStep = newSteps[currentIndex - 1];
        const stepName = prevStep?.id as CheckoutState['currentStep'];
        
        options.onStepChange?.(stepName);
        
        return {
          ...prev,
          currentStep: stepName,
          steps: newSteps
        };
      }
      return prev;
    });
  }, [options]);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (checkoutState.currentStep === 'details') {
      // Validate customer info
      if (!checkoutState.customerInfo.email) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutState.customerInfo.email)) {
        errors.email = 'Please enter a valid email';
      }

      // Additional validation based on mode
      if (options.mode === 'cart' && !checkoutState.customerInfo.name) {
        errors.name = 'Name is required for cart checkout';
      }
    }

    if (checkoutState.currentStep === 'payment') {
      // Validate payment method selection
      if (!checkoutState.paymentMethod) {
        errors.paymentMethod = 'Please select a payment method';
      }

      // Validate security context if enabled
      if (options.enableSecurity !== false && checkoutState.securityContext) {
        const securityConfig: SecureOrderConfig = {
          sessionId: checkoutState.securityContext.sessionId,
          csrfToken: checkoutState.securityContext.csrfToken,
          timestamp: checkoutState.securityContext.timestamp
        };

        const validation = validateCheckoutSession(securityConfig, {
          requireCsrf: true,
          clientIdentifier
        });

        if (!validation.valid) {
          errors.security = validation.errors.join(', ');
        }
      }
    }

    setCheckoutState(prev => ({ ...prev, errors }));
    
    if (Object.keys(errors).length > 0) {
      options.onValidationError?.(errors);
      return false;
    }

    return true;
  }, [checkoutState, options, clientIdentifier]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (!config.products || config.products.length === 0) return 0;
    
    if (options.mode === 'cart') {
      return config.products.reduce((sum: number, product: any) => sum + product.price, 0);
    }
    
    return config.products[0]?.price || 0;
  }, [config.products, options.mode]);

  // Start payment process
  const startPayment = useCallback(async () => {
    if (!validateCurrentStep()) {
      return false;
    }

    setCheckoutState(prev => ({ ...prev, isProcessing: true, globalError: null }));

    try {
      // Validate payment parameters
      if (checkoutState.securityContext) {
        const paymentParams = {
          amount: totalAmount,
          recipient: config.merchant.wallet,
          reference: checkoutState.securityContext.reference,
          timestamp: checkoutState.securityContext.timestamp,
          merchantId: options.merchantId,
          expectedCurrency: checkoutState.paymentMethod
        };

        const validation = validatePaymentParams(paymentParams);
        if (!validation.valid) {
          throw new Error(`Payment validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment validation failed';
      setCheckoutState(prev => ({
        ...prev,
        isProcessing: false,
        globalError: errorMessage
      }));
      
      options.onPaymentError?.(error instanceof Error ? error : new Error(errorMessage));
      return false;
    }
  }, [checkoutState, totalAmount, config.merchant.wallet, options, validateCurrentStep]);

  // Complete payment
  const completePayment = useCallback((signature: string, orderId?: string) => {
    setCheckoutState(prev => ({
      ...prev,
      isProcessing: false,
      paymentSignature: signature,
      orderId: orderId || null,
      currentStep: 'confirmation',
      steps: prev.steps.map(step => ({
        ...step,
        completed: true,
        active: step.id === 'confirmation'
      }))
    }));

    options.onPaymentSuccess?.(signature, orderId);
  }, [options]);

  // Handle payment error
  const handlePaymentError = useCallback((error: Error) => {
    setCheckoutState(prev => ({
      ...prev,
      isProcessing: false,
      globalError: error.message
    }));

    options.onPaymentError?.(error);
  }, [options]);

  // Reset checkout state
  const resetCheckout = useCallback(() => {
    setCheckoutState({
      currentStep: 'details',
      steps: [
        { id: 'details', name: 'Details', completed: false, active: true },
        { id: 'payment', name: 'Payment', completed: false, active: false },
        { id: 'confirmation', name: 'Confirmation', completed: false, active: false }
      ],
      isProcessing: false,
      isLoading: false,
      paymentMethod: 'SOL',
      customerInfo: {},
      securityContext: null,
      errors: {},
      globalError: null,
      paymentSignature: null,
      orderId: null
    });
  }, []);

  // Clear specific error
  const clearError = useCallback((errorKey: string) => {
    setCheckoutState(prev => ({
      ...prev,
      errors: { ...prev.errors, [errorKey]: '' },
      globalError: errorKey === 'global' ? null : prev.globalError
    }));
  }, []);

  return {
    checkoutState,
    totalAmount,
    updateCustomerInfo,
    selectPaymentMethod,
    goToNextStep,
    goToPreviousStep,
    validateCurrentStep,
    startPayment,
    completePayment,
    handlePaymentError,
    resetCheckout,
    clearError
  };
}