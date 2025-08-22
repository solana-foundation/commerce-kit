'use client';

import { ColorPickerPopover } from './color-picker-popover';
import { BorderRadiusPicker } from './border-radius-picker';
import type { Customizations } from './types';
// import { ButtonShadowSelector } from './button-shadow-selector';
// import { ButtonBorderSelector } from './button-border-selector';

interface DesignControlsProps {
  customizations: Customizations;
  onCustomizationChange: <K extends keyof Customizations>(key: K, value: Customizations[K]) => void;
  isSwapped: boolean;
  onSwapChange: (isSwapped: boolean) => void;
}

export function DesignControls({ 
  customizations, 
  onCustomizationChange, 
  isSwapped, 
  onSwapChange 
}: DesignControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200 overflow-hidden">
      <div className="col-span-1 px-2 p-0">
        <ColorPickerPopover
          customizations={customizations}
          onCustomizationChange={onCustomizationChange}
          isSwapped={isSwapped}
          onSwapChange={onSwapChange}
        />
      </div>
      <div className="col-span-1 px-2 p-0">
        <BorderRadiusPicker
          borderRadius={customizations.borderRadius}
          onBorderRadiusChange={(value: string) => onCustomizationChange('borderRadius', value)}
        />
      </div>
      {/* <div className="col-span-1 p-2">
        <ButtonShadowSelector
          value={(customizations.buttonShadow ?? 'md') as 'none' | 'sm' | 'md' | 'lg' | 'xl'}
          onChange={(v) => onCustomizationChange('buttonShadow', v)}
        />
      </div>
      <div className="col-span-1 p-2 border-l border-gray-200 pl-4">
        <ButtonBorderSelector
          value={(customizations.buttonBorder ?? 'black-10') as 'none' | 'black-10' | 'white-10'}
          onChange={(v) => onCustomizationChange('buttonBorder', v)}
        />
      </div> */}
    </div>
  );
}