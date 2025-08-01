'use client';

import { cn } from '../../../lib/utils';
import type { DemoConfig } from './types';

interface ButtonVariantSelectorProps {
  value: 'default' | 'icon-only';
  onChange: (variant: 'default' | 'icon-only') => void;
  config: DemoConfig;
}

export function ButtonVariantSelector({ value, onChange, config }: ButtonVariantSelectorProps) {
  return (
    <div className="space-y-4 p-2">
      <div>
        <label className="block text-sm font-medium">Button Variant</label>
        <div className="text-xs text-gray-600 mb-6">Choose the button style for the modal trigger</div>
      </div>
      
      {/* Button Variant Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Default Button */}
        <div className="space-y-3">
          <div 
            className={cn(
              "relative cursor-pointer rounded-xl p-3 h-20 transition-all duration-200 group overflow-hidden border flex items-center justify-center",
              value === 'default' 
                        ? 'border-zinc-400/50 ring-4 ring-inset-4 ring-zinc-300' 
                        : 'border-zinc-300 hover:border-zinc-200'
            )}
            onClick={() => onChange('default')}
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
            {/* Button mockup with icon and text */}
            <div 
              className="text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-medium"
              style={{ backgroundColor: config.theme.primaryColor }}
            >
              {/* Solana icon */}
              <svg width="14" height="10" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
                <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
                <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
              </svg>
              Pay Now
            </div>
          </div>
          
          {/* Label underneath */}
          <div className="text-left">
            <div className="text-sm font-medium text-slate-900">Default</div>
            <div className="text-xs text-slate-600">Icon with text</div>
          </div>
        </div>

        {/* Icon Only Button */}
        <div className="space-y-3">
          <div 
            className={cn(
              "relative cursor-pointer rounded-xl p-3 h-20 transition-all duration-200 group overflow-hidden border flex items-center justify-center",
              value === 'icon-only' 
                        ? 'border-zinc-400/50 ring-4 ring-inset-4 ring-zinc-300' 
                        : 'border-zinc-300 hover:border-zinc-200'
            )}
            onClick={() => onChange('icon-only')}
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
            {/* Button mockup icon only */}
            <div 
              className="text-white p-3 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: config.theme.primaryColor }}
            >
              {/* Solana icon */}
              <svg width="16" height="12" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
                <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
                <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          
          {/* Label underneath */}
          <div className="text-left">
            <div className="text-sm font-medium text-slate-900">Icon Only</div>
            <div className="text-xs text-slate-600">Compact style</div>
          </div>
        </div>
      </div>
    </div>
  );
}