'use client';

import { DesignControls } from './design-controls';
import { SupportedCurrencies } from './currency-selector';
// import { CheckoutStyleSelector } from './checkout-style-selector';
import { ButtonVariantSelector } from './button-variant-selector';
import { ConfigurationInputs } from './amount-controls';
import { SectionSeparator } from './section-separator';
import type { Customizations, Mode, CheckoutStyle, DemoConfig } from './types';

interface StyleControlsProps {
  customizations: Customizations;
  selectedMode: Mode;
  checkoutStyle: CheckoutStyle;
  onCustomizationChange: <K extends keyof Customizations>(key: K, value: Customizations[K]) => void;
  onCheckoutStyleChange: (style: CheckoutStyle) => void;
  isSwapped: boolean;
  onSwapChange: (isSwapped: boolean) => void;
  config: DemoConfig;
}


export function StyleControls({ 
  customizations, 
  selectedMode, 
  // checkoutStyle, 
  onCustomizationChange, 
  // onCheckoutStyleChange,
  isSwapped,
  onSwapChange,
  config
}: StyleControlsProps) {
  return (
    <div className="space-y-4 px-6 py-2">
      <ConfigurationInputs
        mode={selectedMode}
        merchantName={customizations.merchantName}
        walletAddress={customizations.walletAddress}
        imageUrl={customizations.imageUrl}
        productName={customizations.productName}
        productDescription={customizations.productDescription}
        productPrice={customizations.productPrice}
        onMerchantNameChange={(value) => onCustomizationChange('merchantName', value)}
        onWalletAddressChange={(value) => onCustomizationChange('walletAddress', value)}
        onImageUrlChange={(value) => onCustomizationChange('imageUrl', value)}
        onProductNameChange={(value) => onCustomizationChange('productName', value)}
        onProductDescriptionChange={(value) => onCustomizationChange('productDescription', value)}
        onProductPriceChange={(value) => onCustomizationChange('productPrice', value)}
      />

      <SectionSeparator />

              
      <ButtonVariantSelector
        value={customizations.buttonVariant}
        onChange={(value) => onCustomizationChange('buttonVariant', value)}
        config={config}
      />
    
      <SectionSeparator />

      {/* Design Controls - Colors & Border Radius */}
      <DesignControls
        customizations={customizations}
        onCustomizationChange={onCustomizationChange}
        isSwapped={isSwapped}
        onSwapChange={onSwapChange}
      />

      {/* <CheckoutStyleSelector
        value={checkoutStyle}
        onChange={onCheckoutStyleChange}
        mode={selectedMode}
      /> */}



      <SectionSeparator />

      <SupportedCurrencies
        supportedCurrencies={customizations.supportedCurrencies}
        onChange={(currencies) => onCustomizationChange('supportedCurrencies', currencies)}
      />

    </div>
  );
}