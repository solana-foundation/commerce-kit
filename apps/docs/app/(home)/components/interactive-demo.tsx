'use client';

import { useState } from 'react';
import { TabsRoot, TabsList, TabsTab, TabsPanel } from '@solana-commerce/ui-primitives';
import { HeroSection } from './hero-section';
import { ModeSelector } from './mode-selector';
import { CustomizationPanel } from './customization-panel';
import { DemoPreview } from './demo-preview';
import { CodeExample } from './code-example';
import type { Mode, CheckoutStyle, Customizations } from './types';
import { OrderItem } from '@solana-commerce/headless-sdk';

export function InteractiveDemo() {
  const [selectedMode, setSelectedMode] = useState<Mode>('tip');
  const [checkoutStyle, setCheckoutStyle] = useState<CheckoutStyle>('modal');
  const [isSwapped, setIsSwapped] = useState(false);
  
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
        borderRadius: customizations.borderRadius as 'none' | 'sm' | 'md' | 'lg' | 'xl'
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

  return (
    <section className="h-[calc(100vh-100px)]">
      <div className="max-w-7xl h-full mx-auto border-r border-l border-gray-200 dark:border-gray-800">
        <HeroSection />

        <div className="grid grid-cols-1 sm:grid-cols-12 divide-x divide-gray-200 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800">
          {/* Left Column - Mode Selector & Customization Panel */}
          <div className="space-y-4 col-span-5">
            {/* Mode Selector Tabs */}
            <ModeSelector 
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
            />

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
          {/* Right Column - Demo and Code Tabs */}
          <div 
          className="space-y-4 col-span-7"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(46, 77, 97, 0.08) 10px,
              rgba(46, 77, 97, 0.08) 11px
            )`
          }}
          >
            <TabsRoot defaultValue="demo">
              <TabsList className="flex border-b bg-zinc-100 border-gray-200 dark:border-gray-700">
                <TabsTab 
                  value="demo"
                  className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 text-zinc-400 transition-colors"
                >
                  {checkoutStyle === 'modal' ? 'Modal' : 'Page'}
                </TabsTab>
                <TabsTab 
                  value="code"
                  className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 text-zinc-400 transition-colors"
                >
                  Code
                </TabsTab>
              </TabsList>

              <TabsPanel value="demo" className=" px-4 h-[calc(100vh-200px)]">
                <DemoPreview
                  selectedMode={selectedMode}
                  checkoutStyle={checkoutStyle}
                  customizations={customizations}
                  demoProducts={demoProducts}
                  merchantConfig={merchantConfig}
                  config={getConfigForMode()}
                  onCheckoutStyleChange={setCheckoutStyle}
                />
              </TabsPanel>
              
              <TabsPanel value="code" className="px-4">
                <CodeExample
                  selectedMode={selectedMode}
                  checkoutStyle={checkoutStyle}
                  customizations={customizations}
                />
              </TabsPanel>
            </TabsRoot>
          </div>
        </div>
      </div>
    </section>
  );
} 