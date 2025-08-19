'use client';

import { TabsRoot, TabsList, TabsTab } from '@solana-commerce/ui-primitives';
import type { Mode } from './types';
import Image from 'next/image';
import logoCommerceKit from '../assets/logo-commercekit.png';

interface UnifiedTabBarProps {
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
  activeTab: 'demo' | 'code';
  onTabChange: (tab: 'demo' | 'code') => void;
  checkoutStyle: 'modal' | 'page';
}

export function UnifiedTabBar({ 
  selectedMode, 
  onModeChange, 
  activeTab, 
  onTabChange, 
  checkoutStyle 
}: UnifiedTabBarProps) {
  return (
    <div className="sticky top-0 bg-white z-40 border-b border-gray-200">
      <div className="grid grid-cols-12">
        {/* Mode Selection Tabs */}
        <div className="col-span-4">
          <div className=" w-full flex">
            <Image
              src={logoCommerceKit}
              alt="CommerceKit Logo"
              width={100}
              height={100}
              className="w-12 h-12"
            />
          <TabsRoot
            value={selectedMode}
            onValueChange={(value) => {
              if (value === 'tip') onModeChange('tip');
              if (value === 'qrCustomization') onModeChange('qrCustomization');
            }}
          >
            <TabsList className="flex bg-zinc-100/50 h-12">
              <TabsTab 
                value="tip"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 text-zinc-400 transition-colors text-center cursor-pointer"
              >
                Tip Link
              </TabsTab>
              <TabsTab 
                value="qrCustomization"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 text-zinc-400 transition-colors text-center cursor-pointer"
              >
                QR Customization
              </TabsTab>
              <TabsTab 
                value="buyNow"
                disabled
                className="hidden px-4 py-2 text-sm font-medium border-b-2 border-transparent text-zinc-300 cursor-not-allowed opacity-70 select-none"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Single Item</span>
                  <span className="rounded-full bg-zinc-200 text-zinc-600 px-2 py-0.5 text-[10px] uppercase tracking-wide">Coming soon</span>
                </span>
              </TabsTab>
              <TabsTab 
                value="cart"
                disabled
                className="hidden px-4 py-2 text-sm font-medium border-b-2 border-transparent text-zinc-300 cursor-not-allowed opacity-70 select-none"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Multiple Items</span>
                  <span className="rounded-full bg-zinc-200 text-zinc-600 px-2 py-0.5 text-[10px] uppercase tracking-wide">Coming soon</span>
                </span>
              </TabsTab>
            </TabsList>
          </TabsRoot>
          </div>
        </div>
        
        {/* Demo/Code View Tabs */}
        <div className="col-span-8">
          <TabsRoot 
            value={activeTab} 
            onValueChange={(value) => onTabChange(value as 'demo' | 'code')}
          >
            <TabsList className="flex bg-zinc-100/50 h-12">
              <TabsTab 
                value="demo"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 text-zinc-400 transition-colors cursor-pointer"
              >
                {checkoutStyle === 'modal' ? 'Modal' : 'Page'}
              </TabsTab>
              <TabsTab 
                value="code"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 text-zinc-400 transition-colors cursor-pointer"
              >
                Code
              </TabsTab>
            </TabsList>
          </TabsRoot>
        </div>
      </div>
    </div>
  );
}
