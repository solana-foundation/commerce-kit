'use client';

import { StyleControls } from './style-controls';
import type { Customizations, Mode, CheckoutStyle, DemoConfig } from './types';

interface CustomizationPanelProps {
  customizations: Customizations;
  selectedMode: Mode;
  checkoutStyle: CheckoutStyle;
  onCustomizationChange: <K extends keyof Customizations>(key: K, value: Customizations[K]) => void;
  onCheckoutStyleChange: (style: CheckoutStyle) => void;
  isSwapped: boolean;
  onSwapChange: (isSwapped: boolean) => void;
  config: DemoConfig;
}

export function CustomizationPanel({
  customizations,
  selectedMode,
  checkoutStyle,
  onCustomizationChange,
  onCheckoutStyleChange,
  isSwapped,
  onSwapChange,
  config
}: CustomizationPanelProps) {
  return (
    <div className="">      
      <div className="space-y-6 overflow-hidden">
        <StyleControls
          customizations={customizations}
          selectedMode={selectedMode}
          checkoutStyle={checkoutStyle}
          onCustomizationChange={onCustomizationChange}
          onCheckoutStyleChange={onCheckoutStyleChange}
          isSwapped={isSwapped}
          onSwapChange={onSwapChange}
          config={config}
        />
      </div>
    </div>
  );
}