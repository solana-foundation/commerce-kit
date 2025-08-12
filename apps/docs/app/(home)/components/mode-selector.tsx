'use client';

import { TabsRoot, TabsList, TabsTab } from '@solana-commerce/ui-primitives';
import type { Mode } from './types';

interface ModeSelectorProps {
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="sticky top-[57px]">
      <TabsRoot
        value={selectedMode}
        onValueChange={(value) => {
          if (value === 'tip') onModeChange('tip');
        }}
      >
        <TabsList className="flex bg-zinc-100/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-[9999]">
          <TabsTab 
            value="tip"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 text-zinc-400 transition-colors text-center cursor-pointer"
          >
            Tip Link
          </TabsTab>
          <TabsTab 
            value="buyNow"
            disabled
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-zinc-300 cursor-not-allowed opacity-70 select-none"
          >
            <span className="inline-flex items-center gap-2">
              <span>Single Item</span>
              <span className="rounded-full bg-zinc-200 text-zinc-600 px-2 py-0.5 text-[10px] uppercase tracking-wide">Coming soon</span>
            </span>
          </TabsTab>
          <TabsTab 
            value="cart"
            disabled
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-zinc-300 cursor-not-allowed opacity-70 select-none"
          >
            <span className="inline-flex items-center gap-2">
              <span>Multiple Items</span>
              <span className="rounded-full bg-zinc-200 text-zinc-600 px-2 py-0.5 text-[10px] uppercase tracking-wide">Coming soon</span>
            </span>
          </TabsTab>
        </TabsList>
      </TabsRoot>
    </div>
  );
}