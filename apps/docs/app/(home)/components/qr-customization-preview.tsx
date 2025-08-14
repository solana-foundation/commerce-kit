'use client';

import React, { useState, useEffect } from 'react';
import { createStyledQRCode, type QROptions } from '@solana-commerce/solana-pay';

interface QRCustomizationPreviewProps {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
  };
}



const sampleURL = 'solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v?amount=1&memo=demo';



export function QRCustomizationPreview({ theme }: QRCustomizationPreviewProps) {
  const [customOptions, setCustomOptions] = useState<QROptions>({
    width: 256,
    margin: 2,
    color: {
      dark: theme.primaryColor,
      light: theme.backgroundColor
    },
    errorCorrectionLevel: 'Q',
    dotStyle: 'rounded',
    cornerStyle: 'extra-rounded'
  });
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Update QR code when options change
  useEffect(() => {
    const generateQR = async () => {
      setLoading(true);
      try {
        const svg = await createStyledQRCode(sampleURL, customOptions);
        setQrCode(svg);
      } catch (error) {
        console.error('Error generating QR code:', error);
        setQrCode('');
      }
      setLoading(false);
    };

    generateQR();
  }, [customOptions]);

  // Update colors when theme changes
  useEffect(() => {
    setCustomOptions(prev => ({
      ...prev,
      color: {
        dark: theme.primaryColor,
        light: theme.backgroundColor
      }
    }));
  }, [theme.primaryColor, theme.backgroundColor]);



  const getBorderRadiusClass = (radius: string) => {
    const radiusMap = {
      'none': 'rounded-none',
      'sm': 'rounded-sm',
      'md': 'rounded-md', 
      'lg': 'rounded-lg',
      'xl': 'rounded-xl',
      'full': 'rounded-full'
    };
    return radiusMap[radius as keyof typeof radiusMap] || 'rounded-md';
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="text-center">
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: theme.textColor }}
        >
          QR Code Customization
        </h2>
        <p 
          className="text-sm opacity-70"
          style={{ color: theme.textColor }}
        >
          Explore all available QR code styling options
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* QR Code Preview */}
        <div className="flex-1 flex flex-col">
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: theme.textColor }}
          >
            Preview
          </h3>
          
          <div 
            className={`flex-1 flex items-center justify-center p-8 border-2 border-dashed ${getBorderRadiusClass(theme.borderRadius)}`}
            style={{
              borderColor: theme.backgroundColor === '#ffffff' ? '#e5e7eb' : `${theme.primaryColor}40`,
              backgroundColor: theme.backgroundColor === '#ffffff' ? '#f9fafb' : `${theme.backgroundColor}10`
            }}
          >
            {loading ? (
              <div className="text-center">
                <div 
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                  style={{ borderColor: theme.primaryColor }}
                ></div>
                <p style={{ color: theme.textColor }}>Generating QR...</p>
              </div>
            ) : qrCode ? (
              <div 
                className={`bg-white p-4 shadow-lg ${getBorderRadiusClass(theme.borderRadius)}`}
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />
            ) : (
              <p style={{ color: theme.textColor }}>Failed to generate QR code</p>
            )}
          </div>

          {/* Current Options Summary */}
          <div 
            className={`mt-4 p-4 bg-opacity-10 ${getBorderRadiusClass(theme.borderRadius)}`}
            style={{ backgroundColor: theme.primaryColor }}
          >
            <h4 
              className="text-sm font-semibold mb-2"
              style={{ color: theme.textColor }}
            >
              Current Configuration
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: theme.textColor }}>
              <div>Size: {customOptions?.width}px</div>
              <div>Margin: {customOptions?.margin}</div>
              <div>Dots: {customOptions?.dotStyle}</div>
              <div>Corners: {customOptions?.cornerStyle}</div>
              <div>Error Level: {customOptions?.errorCorrectionLevel}</div>
              <div>Colors: Theme-based</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Dot Style */}
          <div className="mb-6 text-left">
            <label 
              className="block text-xs font-normal mb-2"
              style={{ color: `${theme.textColor}70` }}
            >
              Dot style
            </label>
            <select
              value={customOptions.dotStyle || 'rounded'}
              onChange={(e) => {
                setCustomOptions(prev => ({ ...prev, dotStyle: e.target.value as QROptions['dotStyle'] }));
              }}
              className="w-full h-9 px-3 py-1 border border-gray-200 rounded-xl bg-white text-sm font-normal cursor-pointer outline-none appearance-none transition-all duration-200 shadow-sm focus:ring-2 focus:ring-gray-300 hover:border-gray-300"
              style={{
                color: theme.textColor,
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem center',
                backgroundSize: '0.65rem auto'
              }}
            >
              <option value="dots">Perfect Circles</option>
              <option value="rounded">Rounded Rectangles</option>
              <option value="square">Sharp Squares</option>
            </select>
          </div>

          {/* Corner Style */}
          <div className="mb-6 text-left">
            <label 
              className="block text-xs font-normal mb-2"
              style={{ color: `${theme.textColor}70` }}
            >
              Corner style
            </label>
            <select
              value={customOptions.cornerStyle || 'extra-rounded'}
              onChange={(e) => {
                setCustomOptions(prev => ({ ...prev, cornerStyle: e.target.value as QROptions['cornerStyle'] }));
              }}
              className="w-full h-9 px-3 py-1 border border-gray-200 rounded-xl bg-white text-sm font-normal cursor-pointer outline-none appearance-none transition-all duration-200 shadow-sm focus:ring-2 focus:ring-gray-300 hover:border-gray-300"
              style={{
                color: theme.textColor,
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem center',
                backgroundSize: '0.65rem auto'
              }}
            >
              <option value="square">None</option>
              <option value="rounded">MD</option>
              <option value="extra-rounded">LG</option>
              <option value="full-rounded">XL</option>
              <option value="maximum-rounded">Full</option>
            </select>
          </div>

          {/* Error Correction Level */}
          <div className="mb-6 text-left">
            <label 
              className="block text-xs font-normal mb-2"
              style={{ color: `${theme.textColor}70` }}
            >
              Scan reliability
            </label>
            <select
              value={customOptions.errorCorrectionLevel || 'Q'}
              onChange={(e) => {
                setCustomOptions(prev => ({ ...prev, errorCorrectionLevel: e.target.value as QROptions['errorCorrectionLevel'] }));
              }}
              className="w-full h-9 px-3 py-1 border border-gray-200 rounded-xl bg-white text-sm font-normal cursor-pointer outline-none appearance-none transition-all duration-200 shadow-sm focus:ring-2 focus:ring-gray-300 hover:border-gray-300"
              style={{
                color: theme.textColor,
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem center',
                backgroundSize: '0.65rem auto'
              }}
            >
              <option value="L">Fast Scanning</option>
              <option value="M">Balanced</option>
              <option value="Q">Reliable</option>
              <option value="H">Ultra Reliable</option>
            </select>
          </div>






        </div>
      </div>
    </div>
  );
}
