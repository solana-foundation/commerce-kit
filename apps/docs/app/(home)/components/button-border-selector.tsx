'use client';

import React from 'react';

type BorderChoice = 'none' | 'black-10' | 'white-10';

interface ButtonBorderSelectorProps {
  value: BorderChoice;
  onChange: (value: BorderChoice) => void;
}

const BORDER_CHOICES: Array<{ key: BorderChoice; label: string; style: React.CSSProperties }> = [
  { key: 'none', label: 'None', style: { border: 'none' } },
  { key: 'black-10', label: 'Black 10%', style: { border: '1px solid rgba(0,0,0,0.1)' } },
];

export function ButtonBorderSelector({ value, onChange }: ButtonBorderSelectorProps) {
  return (
    <div className="space-y-4 p-2">
      <div>
        <label className="block text-sm font-medium">Button Border</label>
        <div className="text-xs text-gray-600">Choose the outline for the trigger button</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {BORDER_CHOICES.map((opt) => (
          <button
            key={opt.key}
            type="button"
            aria-pressed={value === opt.key}
            aria-label={`Select ${opt.label} border`}
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
            <div className="w-20 h-8 rounded-lg bg-white" style={opt.style} />
            <div className="absolute bottom-2 left-0 right-0 text-[10px] text-slate-600 font-mono">
              {opt.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


