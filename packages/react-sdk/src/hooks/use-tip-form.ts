/**
 * Tip Form State Management Hook
 * Consolidates all form-related state and logic
 */

import { useReducer, useCallback, useMemo } from 'react';
import type { Currency, PaymentMethod, SolanaCommerceConfig } from '../types';
import { ALL_CURRENCIES } from '../constants/tip-modal';
import { convertUsdToLamports } from '../utils';

// Form state type
interface TipFormState {
  selectedAmount: number;
  selectedCurrency: Currency;
  selectedPaymentMethod: PaymentMethod;
  customAmount: string;
  showCustomInput: boolean;
  isProcessing: boolean;
  currentStep: 'form' | 'payment';
  currencyDropdownOpen: boolean;
  priceError: string | null;
}

// Action types
type TipFormAction = 
  | { type: 'SET_AMOUNT'; amount: number }
  | { type: 'SET_CURRENCY'; currency: Currency }
  | { type: 'SET_PAYMENT_METHOD'; method: PaymentMethod }
  | { type: 'SET_CUSTOM_AMOUNT'; amount: string }
  | { type: 'TOGGLE_CUSTOM_INPUT'; show: boolean }
  | { type: 'SET_PROCESSING'; processing: boolean }
  | { type: 'SET_STEP'; step: 'form' | 'payment' }
  | { type: 'SET_CURRENCY_DROPDOWN'; open: boolean }
  | { type: 'SET_PRICE_ERROR'; error: string | null }
  | { type: 'RESET_TO_FORM' };

// Initial state factory
const createInitialState = (config: SolanaCommerceConfig): TipFormState => ({
  selectedAmount: (config as any).tipDefaultAmount || 5,
  selectedCurrency: (config.allowedMints?.[0] as Currency) || 'USDC',
  selectedPaymentMethod: 'qr',
  customAmount: '',
  showCustomInput: false,
  isProcessing: false,
  currentStep: 'form',
  currencyDropdownOpen: false,
  priceError: null
});

// Reducer
function tipFormReducer(state: TipFormState, action: TipFormAction): TipFormState {
  switch (action.type) {
    case 'SET_AMOUNT':
      return { ...state, selectedAmount: action.amount, showCustomInput: false };
    case 'SET_CURRENCY':
      return { ...state, selectedCurrency: action.currency };
    case 'SET_PAYMENT_METHOD':
      return { ...state, selectedPaymentMethod: action.method };
    case 'SET_CUSTOM_AMOUNT':
      return { ...state, customAmount: action.amount };
    case 'TOGGLE_CUSTOM_INPUT':
      return { ...state, showCustomInput: action.show };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.processing };
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_CURRENCY_DROPDOWN':
      return { ...state, currencyDropdownOpen: action.open };
    case 'SET_PRICE_ERROR':
      return { ...state, priceError: action.error };
    case 'RESET_TO_FORM':
      return { ...state, currentStep: 'form', isProcessing: false, priceError: null };
    default:
      return state;
  }
}

// Hook
export function useTipForm(config: SolanaCommerceConfig) {
  const [state, dispatch] = useReducer(tipFormReducer, config, createInitialState);

  // Available currencies based on config
  const availableCurrencies = useMemo(() => 
    ALL_CURRENCIES.filter(c => config.allowedMints?.includes(c.value)), 
    [config.allowedMints]
  );

  // Tip presets from config
  const tipPresets = useMemo(() => 
    (config as any).tipPresets || [1, 5, 15, 25, 50],
    [config]
  );

  // Actions
  const actions = useMemo(() => ({
    setAmount: (amount: number) => dispatch({ type: 'SET_AMOUNT', amount }),
    setCurrency: (currency: Currency) => dispatch({ type: 'SET_CURRENCY', currency }),
    setPaymentMethod: (method: PaymentMethod) => dispatch({ type: 'SET_PAYMENT_METHOD', method }),
    setCustomAmount: (amount: string) => dispatch({ type: 'SET_CUSTOM_AMOUNT', amount }),
    toggleCustomInput: (show: boolean) => dispatch({ type: 'TOGGLE_CUSTOM_INPUT', show }),
    setProcessing: (processing: boolean) => dispatch({ type: 'SET_PROCESSING', processing }),
    setStep: (step: 'form' | 'payment') => dispatch({ type: 'SET_STEP', step }),
    setCurrencyDropdown: (open: boolean) => dispatch({ type: 'SET_CURRENCY_DROPDOWN', open }),
    setPriceError: (error: string | null) => dispatch({ type: 'SET_PRICE_ERROR', error }),
    resetToForm: () => dispatch({ type: 'RESET_TO_FORM' }),
  }), []);

  // Computed values
  const computed = useMemo(() => ({
    finalAmount: state.showCustomInput ? parseFloat(state.customAmount) || 0 : state.selectedAmount,
    isFormValid: state.showCustomInput ? !!state.customAmount && parseFloat(state.customAmount) > 0 : true,
    selectedCurrencyInfo: availableCurrencies.find(c => c.value === state.selectedCurrency),
  }), [state.showCustomInput, state.customAmount, state.selectedAmount, state.selectedCurrency, availableCurrencies]);

  // Handlers
  const handlers = {
    handleSubmit: useCallback(async () => {
      actions.setProcessing(true);
      actions.setStep('payment');
    }, [actions]),

    handleBack: useCallback(() => {
      actions.resetToForm();
    }, [actions]),

    handlePaymentComplete: useCallback((onPayment: (amount: number, currency: string, method: PaymentMethod) => void) => {
      return async () => {
        try {
          actions.setPriceError(null); // Clear any previous errors
          
          if (!isFinite(computed.finalAmount) || computed.finalAmount <= 0) {
            console.error('Invalid payment amount:', computed.finalAmount);
            return;
          }
          
          let lamports: number;
          
          // For stablecoins (USDC/USDT), use direct conversion since they're already USD-based
          if (state.selectedCurrency === 'USDC' || state.selectedCurrency === 'USDC_DEVNET') {
            lamports = Math.round(computed.finalAmount * 1000000); // USDC has 6 decimals
          } else if (state.selectedCurrency === 'USDT' || state.selectedCurrency === 'USDT_DEVNET') {
            lamports = Math.round(computed.finalAmount * 1000000); // USDT has 6 decimals
          } else if (state.selectedCurrency === 'SOL' || state.selectedCurrency === 'SOL_DEVNET') {
            // For SOL, convert USD amount to equivalent SOL lamports
            lamports = await convertUsdToLamports(computed.finalAmount);
          } else {
            // Fallback for unknown currencies
            lamports = Math.round(computed.finalAmount * 1000000000);
          }
          
          onPayment(lamports, state.selectedCurrency, state.selectedPaymentMethod);
        } catch (error) {
          console.error('Payment failed:', error);
          
          // Handle price API errors specifically
          if (error instanceof Error && error.message.includes('SOL price')) {
            actions.setPriceError(error.message);
            actions.setProcessing(false);
            actions.setStep('form'); // Go back to form to show error
          }
        }
      };
    }, [state.selectedCurrency, state.selectedPaymentMethod, computed.finalAmount, actions]),
  };

  return {
    state,
    actions,
    computed,
    handlers,
    availableCurrencies,
    tipPresets,
  };
}
