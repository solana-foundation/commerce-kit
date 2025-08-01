"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full border border-black/30 shadow-sm shadow-black/10 bg-gradient-to-r from-gray-50 to-gray-100",
          "data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3",
          "hover:ring-4 hover:ring-black/4 transition-all duration-300"
        )}
      >
        {/* Subtle overlay similar to color picker */}
        <div 
          className="absolute inset-0 bg-white/30 backdrop-blur-[2px] rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)',
          }}
        />
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-gradient-to-r from-zinc-300 to-zinc-200 absolute rounded-full shadow-inner",
            "data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "block h-6 w-3 shrink-0 rounded-full border-2 border-white ring-2 ring-zinc-300 bg-white shadow-md",
            "cursor-grab hover:scale-110 focus-visible:scale-110 active:cursor-grabbing active:ring-2 active:ring-transparent active:scale-110",
            "transition-all duration-200 focus-visible:outline-none",
            "hover:shadow-[0_0_0_3px_rgba(0,0,0,0.1),_0_6px_12px_rgba(0,0,0,0.15)]",
            "focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.2),_0_6px_12px_rgba(0,0,0,0.2)]",
            "active:shadow-[0_0_0_4px_rgba(0,0,0,0.2),_0_8px_16px_rgba(0,0,0,0.25)]",
            "disabled:pointer-events-none disabled:opacity-50 disabled:scale-100"
          )}
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
          }}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
