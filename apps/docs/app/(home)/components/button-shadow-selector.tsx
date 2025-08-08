'use client';

import React from 'react';

interface ButtonShadowSelectorProps {
  value: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onChange: (value: 'none' | 'sm' | 'md' | 'lg' | 'xl') => void;
}

const SHADOW_CHOICES: Array<{ key: 'none' | 'sm' | 'md' | 'lg' | 'xl'; label: string; className: string }> = [
  { key: 'none', label: 'None', className: 'shadow-none' },
  { key: 'sm', label: 'SM', className: 'shadow-sm' },
  { key: 'md', label: 'MD', className: 'shadow-md' },
  { key: 'lg', label: 'LG', className: 'shadow-lg' },
  { key: 'xl', label: 'XL', className: 'shadow-xl' },
];

export function ButtonShadowSelector({ value, onChange }: ButtonShadowSelectorProps) {
  return (
    <div className="space-y-4 p-2">
      <div>
        <label className="block text-sm font-medium">Button Shadow</label>
        <div className="text-xs text-gray-600">Choose the elevation for the trigger button</div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {SHADOW_CHOICES.map((opt) => (
          <button
            key={opt.key}
            type="button"
            aria-pressed={value === opt.key}
            aria-label={`Select ${opt.label} shadow`}
            onClick={() => onChange(opt.key)}
            className={[
              'relative cursor-pointer rounded-xl p-3 h-20 transition-all duration-200 overflow-hidden border flex items-center justify-center focus:outline-none',
              value === opt.key
                ? 'border-zinc-400/50 ring-4 ring-inset-4 ring-zinc-300'
                : 'border-zinc-300 hover:border-zinc-200',
            ].join(' ')}
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(46, 77, 97, 0.08) 10px, rgba(46, 77, 97, 0.08) 11px)',
            }}
          >
            <div className={`w-14 h-8 rounded-lg bg-white ${opt.className}`} />
            <div className="absolute bottom-2 left-0 right-0 text-[10px] text-slate-600 font-mono">
              {opt.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


