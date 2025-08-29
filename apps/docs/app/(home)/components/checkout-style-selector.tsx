'use client';

import { cn } from '../../../lib/utils';
import type { CheckoutStyle, Mode } from './types';

interface CheckoutStyleSelectorProps {
  value: CheckoutStyle;
  onChange: (style: CheckoutStyle) => void;
  mode?: Mode;
}

export function CheckoutStyleSelector({ value, onChange, mode }: CheckoutStyleSelectorProps) {
  const isPageDisabled = mode === 'tip';
  const isModalDisabled = false; // Note: buyNow and cart modes removed for tip flow MVP
  return (
    <div className="space-y-4 p-2">
      <div>
        <label className="block text-sm font-medium">Checkout Experience</label>
        <div className="text-xs text-gray-600 mb-6">Choose how customers will complete their purchase</div>
      </div>
      
      {/* Checkout Style Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Modal Checkout */}
        <div className="space-y-3">
          <div 
            className={cn(
              "relative rounded-xl p-3 h-32 transition-all duration-200 group overflow-hidden border",
              value === 'modal' 
                          ? 'border-zinc-400/50 ring-4 ring-inset-4 ring-zinc-300' 
                          : 'border-zinc-300 hover:border-zinc-200',
              isModalDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            )}
            aria-disabled={isModalDisabled}
            onClick={() => { if (!isModalDisabled) onChange('modal'); }}
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
            {/* Background page mockup */}
            <div className="absolute inset-2 bg-zinc-100 rounded-[5px] border-1 border-zinc-400/50">
              {/* Page header */}
              <div className="w-full h-3 bg-gray-100 rounded-t-[21px] border-b border-gray-200 flex items-center px-2">
                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                <div className="w-1 h-1 bg-yellow-400 rounded-full ml-0.5"></div>
                <div className="w-1 h-1 bg-green-400 rounded-full ml-0.5"></div>
              </div>
              
              {/* Page content */}
              <div className="p-2 space-y-1">
                <div className="w-3/4 h-1 bg-gray-300 rounded"></div>
                <div className="w-1/2 h-1 bg-gray-300 rounded"></div>
              </div>
              
              {/* Modal overlay */}
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded-b-[3px] rounded-t-none flex items-center justify-center h-[96px] mt-[12px]">
                <div className="bg-white rounded-lg shadow-lg p-2 w-16 h-16 ">
                  {/* Modal header */}
                  <div className="w-full h-1 bg-blue-500 rounded mb-1"></div>
                  {/* Modal content */}
                  <div className="flex flex-col gap-1">
                    <div className="w-3/4 h-0.5 bg-gray-300 rounded"></div>
                    <div className="w-1/2 h-0.5 bg-gray-300 rounded"></div>
                    <div className="w-full h-2 bg-blue-100 rounded mt-[20px]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Label underneath */}
          <div className="text-left">
            <div className="text-sm font-medium text-slate-900">Modal</div>
            <div className="text-xs text-slate-600">Overlay experience</div>
          </div>
        </div>

        {/* Page Checkout */}
        <div className="space-y-3">
          <div 
            className={cn(
              "relative rounded-xl p-3 h-32 transition-all duration-200 group overflow-hidden bg-slate-50 border",
              value === 'page' 
                          ? 'border-zinc-400/50 ring-4 ring-inset-4 ring-zinc-300' 
                          : 'border-zinc-300 hover:border-zinc-200',
              isPageDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            )}
            aria-disabled={isPageDisabled}
            onClick={() => { if (!isPageDisabled) onChange('page'); }}
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
            {/* Full page checkout mockup */}
            <div className="absolute inset-2 bg-white rounded-[5px] border-1 border-zinc-400/50">
              {/* Page header */}
              <div className="w-full h-3 bg-gray-100 rounded-t border-b border-gray-200 flex items-center px-2">
                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                <div className="w-1 h-1 bg-yellow-400 rounded-full ml-0.5"></div>
                <div className="w-1 h-1 bg-green-400 rounded-full ml-0.5"></div>
              </div>
              
              {/* Split view checkout content */}
              <div className="p-1 flex h-full overflow-hidden">
                {/* Left side - Product info (less focused) */}
                <div className="flex-1 p-1 space-y-1 p-4">
                  {/* Product image placeholder */}
                  <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200"></div>
                  
                  {/* Product details */}
                  <div className="space-y-0.5">
                    <div className="w-3/4 h-0.5 bg-gray-100 rounded"></div>
                    <div className="w-1/2 h-0.5 bg-gray-100 rounded"></div>
                  </div>
                  
                  {/* Price/summary */}
                  <div className="w-2/3 h-1 bg-gray-200 rounded"></div>
                </div>
                
                {/* Divider */}
                <div className="w-[1px] h-[100px] bg-gray-200 mx-0.5 mt-[-10px]"></div>
                
                {/* Right side - Checkout form (focused) */}
                <div className="flex-1 p-1 space-y-1 p-4 px-10">
                  {/* Checkout header */}
                  <div className="w-3/4 h-1 bg-blue-500 rounded"></div>
                  
                  {/* Form fields */}
                  <div className="space-y-0.5">
                    <div className="w-full h-0.5 bg-gray-200 rounded"></div>
                    <div className="w-4/5 h-0.5 bg-gray-200 rounded"></div>
                    <div className="w-3/5 h-0.5 bg-gray-200 rounded"></div>
                  </div>
                  
                  {/* Payment section */}
                  <div className="w-full h-2 bg-blue-100 rounded p-0.5 mt-[25px]">
                    <div className="w-full h-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Label underneath */}
          <div className="text-left">
            <div className="text-sm font-medium text-slate-900">Page</div>
            <div className="text-xs text-slate-600">Full screen experience</div>
          </div>
        </div>
      </div>
    </div>
  );
}