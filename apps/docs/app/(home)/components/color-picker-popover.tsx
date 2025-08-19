'use client';

import React, { useState, useCallback, memo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Switch } from '../../../components/ui/switch';
import { Input } from '../../../components/ui/input';
import { ColorPicker } from './color-picker';
import { Lock, Unlock, RefreshCw } from 'lucide-react';
import type { Customizations } from './types';
import { IconSwatchpaletteFill } from 'symbols-react';

interface ColorPickerPopoverProps {
  customizations: Customizations;
  onCustomizationChange: <K extends keyof Customizations>(key: K, value: Customizations[K]) => void;
  isSwapped: boolean;
  onSwapChange: (isSwapped: boolean) => void;
}

const colorPresets = [
  '#9945FF', // Purple
  '#14F195', // Green
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
];

const ColorPickerPopoverComponent = function ColorPickerPopover({
  customizations,
  onCustomizationChange,
  isSwapped,
  onSwapChange
}: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSecondaryLocked, setIsSecondaryLocked] = useState(true);
  const [hexInputValue, setHexInputValue] = useState('');

  // Get the effective colors based on swap state
  const effectivePrimaryColor = isSwapped ? customizations.secondaryColor : customizations.primaryColor;
  const effectiveSecondaryColor = isSwapped ? customizations.primaryColor : customizations.secondaryColor;

  // Handle color changes - always update the original color regardless of swap state
  const handlePrimaryColorChange = useCallback((color: string) => {
    if (isSwapped) {
      onCustomizationChange('secondaryColor', color);
    } else {
      onCustomizationChange('primaryColor', color);
    }
  }, [isSwapped, onCustomizationChange]);

  const handleSecondaryColorChange = useCallback((color: string) => {
    if (isSwapped) {
      onCustomizationChange('primaryColor', color);
    } else {
      onCustomizationChange('secondaryColor', color);
    }
  }, [isSwapped, onCustomizationChange]);

  // Validate hex color format
  const isValidHex = useCallback((hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }, []);

  // Handle hex input changes
  const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInputValue(value);
    
    // If it's a valid hex color, update the primary color
    if (isValidHex(value)) {
      handlePrimaryColorChange(value.toUpperCase());
    }
  }, [isValidHex, handlePrimaryColorChange]);

  // Handle hex input focus to set current color as value
  const handleHexInputFocus = useCallback(() => {
    setHexInputValue(effectivePrimaryColor);
  }, [effectivePrimaryColor]);

  // Handle hex input blur to reset if invalid
  const handleHexInputBlur = useCallback(() => {
    if (!isValidHex(hexInputValue)) {
      setHexInputValue('');
    }
  }, [hexInputValue, isValidHex]);





  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-3">Theme Colors</label>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button 
              className="p-2 bg-zinc-50 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-left flex flex-row items-center justify-start w-full hover:ring-4 hover:ring-inset-2 hover:ring-gray-200 transition-all duration-300 ease-in-out cursor-pointer active:scale-[0.99]"
              title="Click to customize colors"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(46, 77, 97, 0.05) 10px,
                  rgba(46, 77, 97, 0.05) 11px
                )`
              }}
            >
                <div className="flex items-center justify-start gap-3">
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-8 h-8 rounded-full border-4 border-white shadow-md shadow-black/10"
                      style={{ backgroundColor: effectivePrimaryColor }}
                    />
                    <div className="text-left">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Primary</div>
                      <div className="text-xs font-mono text-gray-500">{effectivePrimaryColor.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-8 h-8 rounded-full border-4 border-white shadow-md shadow-black/10"
                      style={{ backgroundColor: effectiveSecondaryColor }}
                    />
                    <div className="text-left">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Accent</div>
                      <div className="text-xs font-mono text-gray-500">{effectiveSecondaryColor.toUpperCase()}</div>
                    </div>
                  </div>
                </div>            
              </button>
          </PopoverTrigger>

          <PopoverContent className="w-80 p-0 rounded-xl mt-[-100px] overflow-hidden" align="start" side="right" sideOffset={20}>
            <div className="space-y-0">

              {/* Color Presets */}
              <div className="p-4 pb-0 mb-4">
                <div className="flex gap-2 items-center mb-3">
                  <IconSwatchpaletteFill className="w-4 h-4 fill-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Color Presets</span>  
                </div>
                <div className="flex gap-2 justify-center px-1">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePrimaryColorChange(preset)}
                      className={`w-[22px] h-[22px] rounded-md border-2 transition-all hover:scale-110 cursor-pointer ${
                        effectivePrimaryColor === preset 
                          ? 'border-white scale-110 ring-2 ring-inset-2 ring-gray-300' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: preset }}
                      title={`Set primary color to ${preset}`}
                    />
                  ))}
                </div>
              </div>


              {/* Advanced Color Picker */}
                <div className="px-4 mb-4">
                  <ColorPicker
                    primaryColor={effectivePrimaryColor}
                    secondaryColor={effectiveSecondaryColor}
                    onPrimaryColorChange={handlePrimaryColorChange}
                    onSecondaryColorChange={handleSecondaryColorChange}
                    width={280}
                    height={280}
                    isSecondaryLocked={isSecondaryLocked && !isSwapped}
                  />
                </div>

              {/* Hex Color Input */}
              <div className="px-4 mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Value
                </label>
                <Input
                  key={`hex-input-${effectivePrimaryColor}`}
                  type="text"
                  value={hexInputValue}
                  placeholder={effectivePrimaryColor}
                  onChange={handleHexInputChange}
                  onFocus={handleHexInputFocus}
                  onBlur={handleHexInputBlur}
                  className={`text-xs font-mono uppercase placeholder:text-gray-400 placeholder:opacity-60 ${
                    hexInputValue && !isValidHex(hexInputValue) 
                      ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-200' 
                      : ''
                  }`}
                  maxLength={7}
                />
                {hexInputValue && !isValidHex(hexInputValue) && (
                  <p className="text-xs text-red-500 mt-1">
                    Please enter a valid hex color (e.g., #FF5733)
                  </p>
                )}
              </div>
              <div className="flex flex-col">
                  <div className="h-[1px]  w-full bg-gray-200 scale-x-125" />
                  {/* <div className="h-[1px] w-full bg-gray-200 scale-x-125" /> */}
                </div>

              {/* Color Swap Control */}
              <div className="flex items-center flex-row w-full justify-between px-4 pt-4 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Reverse Colors</span>
                    <RefreshCw size={12} className="text-gray-500 dark:text-gray-400" />
                    </div>                    
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isSwapped ? 'Colors are swapped' : 'Colors in original position'}
                  </div>
                  </div>
                    <Switch
                    checked={isSwapped}
                    onCheckedChange={onSwapChange}
                    />
                </div>

              {/* Secondary Lock Control */}
              <div className="flex items-center flex-row w-full justify-between px-4 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Auto Secondary</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isSecondaryLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    </div>
                    </div>                    
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isSecondaryLocked ? 'Secondary follows primary' : 'Independent secondary color'}
                  </div>
                  </div>
                    <Switch
                    checked={isSecondaryLocked}
                    onCheckedChange={setIsSecondaryLocked}
                    />
                </div>

                <div className="flex flex-col">
                  <div className="h-[1px]  w-full bg-gray-200 scale-x-125" />
                  {/* <div className="h-[1px] w-full bg-gray-200 scale-x-125" /> */}
                </div>

              {/* Current Colors Legend */}
              <div 
                className="flex items-center justify-between bg-gray-50 p-4 overflow-hidden"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(46, 77, 97, 0.05) 10px,
                    rgba(46, 77, 97, 0.05) 11px
                  )`
                }}
                >
                <div className="flex items-center justify-start gap-4">
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-8 h-8 rounded-full border-4 border-white shadow-md shadow-black/10"
                      style={{ backgroundColor: effectivePrimaryColor }}
                    />
                    <div className="text-left">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Primary</div>
                      <div className="text-xs font-mono text-gray-500">{effectivePrimaryColor.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-8 h-8 rounded-full border-4 border-white shadow-md shadow-black/10"
                      style={{ backgroundColor: effectiveSecondaryColor }}
                    />
                    <div className="text-left">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Accent</div>
                      <div className="text-xs font-mono text-gray-500">{effectiveSecondaryColor.toUpperCase()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ColorPickerPopover = memo(ColorPickerPopoverComponent);