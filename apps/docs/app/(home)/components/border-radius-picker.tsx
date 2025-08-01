'use client';

import React, { memo, useCallback } from 'react';
import { Slider } from '../../../components/ui/slider';
interface BorderRadiusPickerProps {
  borderRadius: string;
  onBorderRadiusChange: (value: string) => void;
}

const borderRadiusOptions = [
  { name: 'None', value: 'none', cssValue: '0' },
  { name: 'SM', value: 'sm', cssValue: '0.25rem' },
  { name: 'MD', value: 'md', cssValue: '0.5rem' },
  { name: 'LG', value: 'lg', cssValue: '0.75rem' },
  { name: 'XL', value: 'xl', cssValue: '1rem' },
  { name: 'Full', value: 'full', cssValue: '9999px' },
];

const BorderRadiusPickerComponent = function BorderRadiusPicker({
  borderRadius,
  onBorderRadiusChange
}: BorderRadiusPickerProps) {
  const currentOption = borderRadiusOptions.find(opt => opt.value === borderRadius) || borderRadiusOptions[3];
  const currentIndex = borderRadiusOptions.findIndex(opt => opt.value === borderRadius);
  
  const handleSliderChange = useCallback((values: number[]) => {
    const newIndex = values[0];
    const newOption = borderRadiusOptions[newIndex];
    if (newOption) {
      onBorderRadiusChange(newOption.value);
    }
  }, [onBorderRadiusChange]);
  
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between mb-1">
          <label className="block text-sm font-medium">Border Radius</label>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="text-left sr-only">
              <div className="text-xs font-mono text-gray-500">{currentOption.name}</div>
            </div>
            <div className="w-full h-full p-1 bg-white rounded-[7px] border border-black/20 shadow-sm shadow-black/10">
                <svg
                width={16}
                height={16}
                viewBox="0 0 32 32"
                className="opacity-70"
                fill="none"
                >
                {/* Background reference lines */}
                <path 
                    d="M29 2L29 29L2 29" 
                    stroke="black" 
                    strokeOpacity="0.3" 
                    strokeWidth="3"
                    fill="none"
                />
                
                {/* Main corner shape */}
                <path 
                    d={
                    currentOption.value === 'none' ? "M31 3H3V31" :
                    currentOption.value === 'sm' ? "M31 3H7C4.79086 3 3 4.79086 3 7V31" :
                    currentOption.value === 'md' ? "M31 3H11C6.58172 3 3 6.58172 3 11V31" :
                    currentOption.value === 'lg' ? "M31 3H15C8.37258 3 3 8.37258 3 15V31" :
                    currentOption.value === 'xl' ? "M31 3H18C9.71573 3 3 9.71573 3 18V31" :
                    "M31 3H28C14.1929 3 3 14.1929 3 28V31"
                    }
                    stroke="black" 
                    strokeWidth="4" 
                    strokeLinejoin="round"
                    fill="none"
                />
                </svg>                
            </div>

          </div>
        </div>
        
        <div className="space-y-4">
          <Slider
            value={[currentIndex >= 0 ? currentIndex : 3]}
            onValueChange={handleSliderChange}
            min={0}
            max={borderRadiusOptions.length - 1}
            step={1}
            className="w-full"
          />
          
          {/* Step labels */}
          <div className="flex justify-between text-[10px] text-gray-500">
            {borderRadiusOptions.map((option) => (
              <span key={option.value} className="text-center font-mono">
                {option.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const BorderRadiusPicker = memo(BorderRadiusPickerComponent);