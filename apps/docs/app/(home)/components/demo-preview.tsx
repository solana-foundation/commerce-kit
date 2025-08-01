'use client';

import React from 'react';
import type { OrderItem } from '@solana-commerce/headless-sdk';
import { SolanaCommerceClient } from './solana-commerce-client';
import { SingleItemCart, MultiItemCart, type CartItem } from '@solana-commerce/react-sdk';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import type { Mode, CheckoutStyle, Customizations, DemoConfig } from './types';
import { IconEye } from 'symbols-react';

// Modal preview components
import { ModalPreviewContent } from './modal-preview-content';

interface DemoPreviewProps {
  selectedMode: Mode;
  checkoutStyle: CheckoutStyle;
  customizations: Customizations;
  demoProducts: OrderItem[];
  merchantConfig: {
    name: string;
    wallet: string;
    description: string;
  };
  config: DemoConfig;
  onCheckoutStyleChange: (style: CheckoutStyle) => void;
}

// Modal Preview Component - wrapper that positions the modal content properly
function ModalPreview({ config, selectedMode, demoProducts }: { 
  config: DemoConfig; 
  selectedMode: Mode; 
  demoProducts: OrderItem[];
}) {
  return (
    <div className="relative h-full w-full bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <ModalPreviewContent 
        config={config}
        selectedMode={selectedMode}
        demoProducts={demoProducts}
      />
    </div>
  );
}

export function DemoPreview({ 
  selectedMode, 
  checkoutStyle, 
  customizations, 
  demoProducts, 
  merchantConfig, 
  config,
  onCheckoutStyleChange 
}: DemoPreviewProps) {
  const getCartItems = (): CartItem[] => {
    return demoProducts.map(product => ({
      ...product,
      quantity: 1
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {checkoutStyle === 'modal' ? (
        // Modal Demo with Tabs
        <Tabs defaultValue={selectedMode === 'tip' ? "modal" : "button"} className="h-full relative">
          {/* Tabs in top right corner */}
          <div className="absolute top-4 right-4 z-20">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="button">Button</TabsTrigger>
              <TabsTrigger value="modal">Modal</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Content */}
          <TabsContent value="button" className="h-full m-0">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg bg-zinc-100 p-8 w-full h-full text-center">
                <SolanaCommerceClient
                  config={config}
                  variant={customizations.buttonVariant}
                  onPayment={(amount: number, currency: string, products?: readonly OrderItem[]) => {
                    console.log('Demo payment:', { amount, currency, products });
                    alert(`Payment initiated: ${amount / 1000000000} ${currency}`);
                  }}
                  onPaymentStart={() => {
                    console.log('Payment started...');
                  }}
                  onPaymentSuccess={(signature: string) => {
                    console.log('Payment successful:', signature);
                    alert('Payment successful!');
                  }}
                  onPaymentError={(error: Error) => {
                    console.error('Payment failed:', error);
                    alert('Payment failed. Check console for details.');
                  }}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Click to experience the customized {selectedMode} modal
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="modal" className="h-full m-0">
            <div className="h-full overflow-hidden relative bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Preview indicator */}
              <div className="absolute top-2 left-2 z-30 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs text-gray-600 font-medium shadow-sm flex items-center gap-1">
                <IconEye className="w-4 h-4 fill-gray-600" />
                <span>Preview</span>
              </div>
              <ModalPreview 
                config={config} 
                selectedMode={selectedMode} 
                demoProducts={demoProducts}
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Page Demo
        <div className="h-full overflow-auto">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white p-4 h-full">
            {selectedMode === 'tip' ? (
              <div className="text-center p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tip Mode Not Available for Page Checkout
                </h3>
                <p className="text-gray-600 mb-4">
                  Tip functionality is designed for quick interactions and works best with the modal checkout experience.
                </p>
                <button
                  onClick={() => onCheckoutStyleChange('modal')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Switch to Modal Checkout
                </button>
              </div>
            ) : selectedMode === 'buyNow' ? (
              <div className="h-full">

                <div style={{ transform: 'scale(0.65)', transformOrigin: 'top left', width: '154%', height: '154%' }}>
                  <SingleItemCart
                    products={[{
                      id: demoProducts[0].id,
                      name: demoProducts[0].name,
                      description: demoProducts[0].description,
                      price: demoProducts[0].price,
                      image: 'https://via.placeholder.com/400x300/9945FF/FFFFFF?text=Demo+Product'
                    }]}
                    merchant={merchantConfig}
                    user={customizations.showMerchantInfo ? {
                      name: merchantConfig.name,
                      wallet: "FLsQ...4c67",
                      email: "you@email.com"
                    } : undefined}
                    theme={config.theme}
                    allowedMints={config.allowedMints}
                    defaultCurrency={config.allowedMints[0] as 'SOL' | 'USDC' | 'USDT'}
                    showTransactionFee={true}
                    transactionFeePercent={0.015}
                    onPayment={(amount: number, currency: string, paymentMethod: 'qr' | 'wallet', formData?: Record<string, unknown>) => {
                      console.log('Payment initiated:', { amount, currency, paymentMethod, formData });
                      alert(`Payment initiated: ${(amount / 1_000_000).toFixed(2)} ${currency}`);
                    }}
                    onEmailChange={(email: string) => {
                      console.log('Email changed:', email);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full">

                <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%', height: '182%' }}>
                  <MultiItemCart
                    initialItems={getCartItems()}
                    merchant={merchantConfig}
                    user={customizations.showMerchantInfo ? {
                      name: merchantConfig.name,
                      wallet: "FLsQ...4c67",
                      email: "you@email.com"
                    } : undefined}
                    theme={config.theme}
                    allowedMints={config.allowedMints}
                    defaultCurrency={config.allowedMints[0] as 'SOL' | 'USDC' | 'USDT'}
                    showTransactionFee={true}
                    transactionFeePercent={0.015}
                    enableItemEditing={true}
                    maxQuantityPerItem={10}
                    onPayment={(amount: number, currency: string, paymentMethod: 'qr' | 'wallet', formData?: Record<string, unknown>) => {
                      console.log('Cart payment initiated:', { amount, currency, paymentMethod, formData });
                      alert(`Cart payment initiated: ${(amount / 1_000_000).toFixed(2)} ${currency}`);
                    }}
                    onEmailChange={(email: string) => {
                      console.log('Email changed:', email);
                    }}
                    onItemQuantityChange={(itemId: string, newQuantity: number) => {
                      console.log('Quantity changed:', { itemId, newQuantity });
                    }}
                    onItemRemove={(itemId: string) => {
                      console.log('Item removed:', itemId);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}