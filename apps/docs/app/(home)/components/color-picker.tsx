'use client';

import React, { useRef, useCallback, useState, useEffect, memo, useMemo } from 'react';

interface ColorPickerProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  width?: number;
  height?: number;
  isSecondaryLocked?: boolean;
}

interface ColorPosition {
  x: number;
  y: number;
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  
  return [h, s, v];
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Convert position to color (radial gradient)
function positionToColor(x: number, y: number, width: number, height: number): string {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.9;
  
  // Calculate distance from center and angle
  const deltaX = x - centerX;
  const deltaY = y - centerY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX);
  
  // Convert angle to hue (0-360 degrees)
  const hue = (angle * 180 / Math.PI + 360) % 360;
  
  // Convert distance to saturation (center = max saturation, edge = min saturation)
  const saturation = Math.max(0, Math.min(1, 1 - (distance / maxRadius)));
  const brightness = 0.9; // Keep brightness high for vibrant colors
  
  const [r, g, b] = hsvToRgb(hue, saturation, brightness);
  return rgbToHex(r, g, b);
}

// Convert color to position (radial gradient)
function colorToPosition(color: string, width: number, height: number): ColorPosition {
  const [r, g, b] = hexToRgb(color);
  const [h, s] = rgbToHsv(r, g, b);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(centerX, centerY) * 0.9;
  
  // Convert hue to angle
  const angle = h * Math.PI / 180;
  
  // Convert saturation to distance (invert: high saturation = close to center)
  const distance = (1 - s) * maxRadius;
  
  // Calculate position
  const x = centerX + Math.cos(angle) * distance;
  const y = centerY + Math.sin(angle) * distance;
  
  return { x, y };
}

// Function to create secondary color from primary (less saturated)
function createSecondaryColor(primaryColor: string): string {
  const [r, g, b] = hexToRgb(primaryColor);
  const [h, s, v] = rgbToHsv(r, g, b);
  
  // Reduce saturation by 25% for secondary color (closer to primary)
  const secondarySaturation = s * 0.5;
  
  const [newR, newG, newB] = hsvToRgb(h, secondarySaturation, v);
  return rgbToHex(newR, newG, newB);
}

// Throttle function to limit update frequency during dragging
function throttle<T extends (...args: Parameters<T>) => void>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;
  
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay);
    }
  }) as T;
}

const ColorPickerComponent = function ColorPicker({
  primaryColor,
  secondaryColor,
  onPrimaryColorChange,
  onSecondaryColorChange,
  width = 280,
  height = 280,
  isSecondaryLocked = true
}: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'primary' | 'secondary' | null>(null);
  const [primaryPos, setPrimaryPos] = useState<ColorPosition>({ x: 0, y: 0 });
  const [secondaryPos, setSecondaryPos] = useState<ColorPosition>({ x: 0, y: 0 });

  // Create throttled versions of the color change callbacks to improve performance during dragging
  const throttledOnPrimaryColorChange = useMemo(
    () => throttle(onPrimaryColorChange, 16), // ~60fps
    [onPrimaryColorChange]
  );
  
  const throttledOnSecondaryColorChange = useMemo(
    () => throttle(onSecondaryColorChange, 16), // ~60fps
    [onSecondaryColorChange]
  );

  // Calculate secondary position based on primary (same hue, less saturation means closer to center)
  const calculateSecondaryPosition = useCallback((primaryColor: string) => {
    const [r, g, b] = hexToRgb(primaryColor);
    const [h, s] = rgbToHsv(r, g, b);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;
    
    // Convert hue to angle
    const angle = h * Math.PI / 180;
    
    // Secondary has reduced saturation (25% less), so it's closer to primary
    const secondarySaturation = s * 0.5;
    const distance = (1 - secondarySaturation) * maxRadius;
    
    // Calculate position
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    return { x, y };
  }, [width, height]);

  // Initialize positions
  useEffect(() => {
    setPrimaryPos(colorToPosition(primaryColor, width, height));
    if (isSecondaryLocked) {
      setSecondaryPos(calculateSecondaryPosition(primaryColor));
    } else {
      setSecondaryPos(colorToPosition(secondaryColor, width, height));
    }
  }, [primaryColor, secondaryColor, width, height, calculateSecondaryPosition, isSecondaryLocked]);

  // Auto-generate secondary color when primary changes (only if locked)
  useEffect(() => {
    if (isSecondaryLocked) {
      const autoSecondary = createSecondaryColor(primaryColor);
      if (autoSecondary !== secondaryColor) {
        // Use the original callback here, not throttled, for immediate updates
        onSecondaryColorChange(autoSecondary);
        setSecondaryPos(calculateSecondaryPosition(primaryColor));
      }
    }
  }, [primaryColor, secondaryColor, onSecondaryColorChange, calculateSecondaryPosition, isSecondaryLocked]);

  // Draw the radial color spectrum
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const centerX = width / 2;
    const centerY = height / 2;
    // Use 90% of the smaller dimension to leave some padding but fill most of the square
    const maxRadius = Math.min(centerX, centerY) * 0.9;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        
        const index = (y * width + x) * 4;
        
        if (distance <= maxRadius) {
          // Convert angle to hue (0-360 degrees)
          const hue = (angle * 180 / Math.PI + 360) % 360;
          
          // Convert distance to saturation (center = max saturation, edge = min saturation)
          const saturation = Math.max(0, 1 - (distance / maxRadius));
          const value = 0.9;
          
          const [r, g, b] = hsvToRgb(hue, saturation, value);
          
          data[index] = r;     // Red
          data[index + 1] = g; // Green
          data[index + 2] = b; // Blue
          data[index + 3] = 255; // Alpha
        } else {
          // Outside the circle - make it transparent/white
          data[index] = 248;     // Light gray
          data[index + 1] = 250;
          data[index + 2] = 252;
          data[index + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [width, height]);

  const updateColorFromPosition = useCallback((clientX: number, clientY: number, dragType: 'primary' | 'secondary') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(width, clientX - rect.left));
    const y = Math.max(0, Math.min(height, clientY - rect.top));

    // Check if position is within the circular color area
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    let finalX = x;
    let finalY = y;
    
    // Constrain position to within the circle
    if (distance > maxRadius) {
      const angle = Math.atan2(y - centerY, x - centerX);
      finalX = centerX + Math.cos(angle) * maxRadius;
      finalY = centerY + Math.sin(angle) * maxRadius;
    }

    if (dragType === 'primary') {
      // Dragging primary: update primary directly
      const newPrimaryColor = positionToColor(finalX, finalY, width, height);
      const newPos = { x: finalX, y: finalY };

      setPrimaryPos(newPos);
      // Use throttled callback during dragging for better performance
      throttledOnPrimaryColorChange(newPrimaryColor);
      
      // Secondary will be auto-updated via useEffect if locked
    } else {
      // Dragging secondary
      if (isSecondaryLocked) {
        // If locked, calculate what the primary should be
        const deltaX = finalX - centerX;
        const deltaY = finalY - centerY;
        const secondaryDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        
        // Convert secondary distance to primary distance
        const secondarySaturation = Math.max(0, 1 - (secondaryDistance / maxRadius));
        const primarySaturation = Math.min(1, secondarySaturation / 0.5);
        const primaryDistance = (1 - primarySaturation) * maxRadius;
        
        // Calculate primary position
        const primaryX = centerX + Math.cos(angle) * primaryDistance;
        const primaryY = centerY + Math.sin(angle) * primaryDistance;
        
        const newPrimaryColor = positionToColor(primaryX, primaryY, width, height);
        setPrimaryPos({ x: primaryX, y: primaryY });
        throttledOnPrimaryColorChange(newPrimaryColor);
        
        // Secondary position updates immediately
        setSecondaryPos({ x: finalX, y: finalY });
      } else {
        // If unlocked, update secondary independently
        const newSecondaryColor = positionToColor(finalX, finalY, width, height);
        const newPos = { x: finalX, y: finalY };

        setSecondaryPos(newPos);
        throttledOnSecondaryColorChange(newSecondaryColor);
      }
    }
  }, [width, height, throttledOnPrimaryColorChange, isSecondaryLocked, throttledOnSecondaryColorChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>, type: 'primary' | 'secondary') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(type);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateColorFromPosition(e.clientX, e.clientY, isDragging);
  }, [isDragging, updateColorFromPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Add global mouse event listeners for smooth dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return; // Don't handle clicks while dragging
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Determine which picker is closer to the click
    const primaryDistance = Math.sqrt(Math.pow(x - primaryPos.x, 2) + Math.pow(y - primaryPos.y, 2));
    const secondaryDistance = Math.sqrt(Math.pow(x - secondaryPos.x, 2) + Math.pow(y - secondaryPos.y, 2));

    const targetType = primaryDistance < secondaryDistance ? 'primary' : 'secondary';
    updateColorFromPosition(e.clientX, e.clientY, targetType);
  }, [isDragging, updateColorFromPosition, primaryPos, secondaryPos]);



  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 sr-only">Color Spectrum</label>
        <div 
          ref={containerRef}
          className="relative overflow-hidden w-full rounded-xl border border-black/20 shadow-lg shadow-black/10 hover:ring-4 hover:ring-black/4 transition-all duration-300"
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="cursor-crosshair block rounded-xl border-2 border-black/10   w-full h-auto"
            onClick={handleCanvasClick}
          />

          {/* Overlay to hide spectrum but show blur */}
          <div 
            className="absolute inset-0 bg-white backdrop-blur-[60px] saturate-150 pointer-events-none rounded-[11px] ring-1 ring-inset ring-white/80"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 70%)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='4' cy='4' r='1' fill='rgba(255,255,255,0.5)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          />
          
          {/* Primary Color Picker */}
          <div
            className={`absolute w-6 h-6 border-2 border-white rounded-full shadow-lg transform -translate-x-3 -translate-y-3 transition-transform ${
              isDragging === 'primary' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
            }`}
            style={{
              left: primaryPos.x,
              top: primaryPos.y,
              backgroundColor: primaryColor,
              boxShadow: isDragging === 'primary' 
                ? '0 0 0 3px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2)' 
                : '0 0 0 2px rgba(0,0,0,0.2), 0 3px 6px rgba(0,0,0,0.1)',
              zIndex: isDragging === 'primary' ? 50 : 40
            }}
            onMouseDown={(e) => handleMouseDown(e, 'primary')}
          />

          {/* Secondary Color Picker */}
          <div
            className={`absolute border-2 border-white rounded-full shadow-lg transform transition-transform ${
              isDragging === 'secondary' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
            } ${isSecondaryLocked ? 'w-5 h-5 -translate-x-2.5 -translate-y-2.5' : 'w-6 h-6 -translate-x-3 -translate-y-3'}`}
            style={{
              left: secondaryPos.x,
              top: secondaryPos.y,
              backgroundColor: secondaryColor,
              boxShadow: isDragging === 'secondary' 
                ? '0 0 0 3px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2)' 
                : '0 0 0 2px rgba(0,0,0,0.2), 0 3px 6px rgba(0,0,0,0.1)',
              zIndex: isDragging === 'secondary' ? 50 : (isSecondaryLocked ? 35 : 40),
              opacity: isSecondaryLocked ? 0.9 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, 'secondary')}
          />
        </div>
      </div>


    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ColorPicker = memo(ColorPickerComponent);