'use client';

import { useState } from 'react';

import { UnifiedTabBar } from './unified-tab-bar';
import { CustomizationPanel } from './customization-panel';
import { DemoPreview } from './demo-preview';
import { CodeExample } from './code-example';
import type { Mode, CheckoutStyle, Customizations } from './types';
import { OrderItem } from '@solana-commerce/headless-sdk';

export function InteractiveDemo() {
  const [selectedMode, setSelectedMode] = useState<Mode>('tip');
  const [checkoutStyle, setCheckoutStyle] = useState<CheckoutStyle>('modal');
  const [isSwapped, setIsSwapped] = useState(false);
  const [activeTab, setActiveTab] = useState<'demo' | 'code'>('demo');
  
  // Customization state
  const [customizations, setCustomizations] = useState<Customizations>({
    primaryColor: '#9945FF',
    secondaryColor: '#14F195',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderRadius: 'lg',
    buttonVariant: 'default',
    showQR: true,
    showProductDetails: true,
    showMerchantInfo: true,
    allowCustomAmount: false,
    position: 'overlay',
    supportedCurrencies: ['SOL', 'USDC', 'USDT', 'USDC_DEVNET', 'SOL_DEVNET', 'USDT_DEVNET'],
    merchantName: 'Demo Store',
    merchantDescription: 'Experience Solana Commerce SDK',
    walletAddress: 'BQWWFhzBdw2vKKBUX17NHeFbCoFQHfRARpdztPE2tDJ',
    imageUrl: 'https://via.placeholder.com/400x300/9945FF/FFFFFF?text=Demo+Logo',
    productName: 'Demo Product',
    productDescription: 'Amazing digital product',
    productPrice: '0.1',
    buttonShadow: 'md',
    buttonBorder: 'black-10',
  });

  // Demo products
  const demoProducts: OrderItem[] = [
    {
      id: 'course-1',
      name: customizations.productName,
      description: customizations.productDescription,
      price: Math.round(parseFloat(customizations.productPrice || '0.1') * 1000000000), // Convert to lamports
      // currency: customizations.supportedCurrencies[0] as 'SOL' | 'USDC' | 'USDT'
    },
    {
      id: 'nft-1',
      name: 'Premium NFT Collection',
      description: 'Exclusive digital art piece',
      price: 500000000, // 0.5 SOL  
      // currency: customizations.supportedCurrencies[0] as 'SOL' | 'USDC' | 'USDT'
    }
  ];

  const merchantConfig = {
    name: customizations.merchantName,
    wallet: customizations.walletAddress,
    description: customizations.merchantDescription
  };

  const getConfigForMode = () => {
    // Apply swap logic to colors
    const effectivePrimaryColor = isSwapped ? customizations.secondaryColor : customizations.primaryColor;
    const effectiveSecondaryColor = isSwapped ? customizations.primaryColor : customizations.secondaryColor;
    
    const baseConfig = {
      merchant: merchantConfig,
      theme: {
        primaryColor: effectivePrimaryColor,
        secondaryColor: effectiveSecondaryColor,
        backgroundColor: customizations.backgroundColor,
        textColor: customizations.textColor,
        borderRadius: customizations.borderRadius as 'none' | 'sm' | 'md' | 'lg' | 'xl',
        buttonShadow: (customizations.buttonShadow ?? 'md') as 'none' | 'sm' | 'md' | 'lg' | 'xl',
        buttonBorder: (customizations.buttonBorder ?? 'black-10') as 'none' | 'black-10',
      },
      showQR: customizations.showQR,
      showProductDetails: customizations.showProductDetails,
      showMerchantInfo: customizations.showMerchantInfo,
      position: customizations.position as 'overlay' | 'inline',
      allowedMints: customizations.supportedCurrencies
    };

    switch (selectedMode) {
      case 'tip':
        return {
          mode: 'tip' as const,
          ...baseConfig,
          // Empty products array - enhanced tip modal handles amount input
          products: [],
          showProductDetails: false
        };
      case 'buyNow':
        return {
          mode: 'buyNow' as const,
          ...baseConfig,
          products: [demoProducts[0]]
        };
      case 'cart':
        return {
          mode: 'cart' as const,
          ...baseConfig,
          products: demoProducts
        };
      case 'qrCustomization':
        return {
          mode: 'qrCustomization' as const,
          ...baseConfig,
          products: [] // No products needed for QR customization
        };
      default:
        return {
          mode: 'tip' as const,
          ...baseConfig,
          products: []
        };
    }
  };

  const updateCustomization = <K extends keyof typeof customizations>(
    key: K, 
    value: typeof customizations[K]
  ) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Ensure layout switches based on mode selection
  const handleModeChange = (mode: Mode) => {
    setSelectedMode(mode);
    if (mode === 'tip') setCheckoutStyle('modal');
    else setCheckoutStyle('page');
  };

  return (
    <section className="">
      <div className="w-full h-full mx-auto border-r border-l border-gray-200">
        {/* Unified Tab Bar */}
        <UnifiedTabBar
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          checkoutStyle={checkoutStyle}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-12 divide-x divide-gray-200 h-[calc(100vh-48px)]">
          {/* Left Column - Scrollable Customization Panel */}
          <div className="col-span-4 overflow-y-auto py-4">
            <CustomizationPanel
              customizations={customizations}
              selectedMode={selectedMode}
              checkoutStyle={checkoutStyle}
              onCustomizationChange={updateCustomization}
              onCheckoutStyleChange={setCheckoutStyle}
              isSwapped={isSwapped}
              onSwapChange={setIsSwapped}
              config={getConfigForMode()}
            />
          </div>
          
          {/* Right Column - Fixed Content */}
          <div className="col-span-8 overflow-hidden">
            {activeTab === 'demo' ? (
              <div className="p-4">
                <DemoPreview
                  selectedMode={selectedMode}
                  checkoutStyle={checkoutStyle}
                  customizations={customizations}
                  demoProducts={demoProducts}
                  merchantConfig={merchantConfig}
                  config={getConfigForMode()}
                  onCheckoutStyleChange={setCheckoutStyle}
                  onCustomizationChange={updateCustomization}
                />
              </div>
            ) : (
              <div className="p-4">
                <CodeExample
                  selectedMode={selectedMode}
                  checkoutStyle={checkoutStyle}
                  customizations={customizations}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 