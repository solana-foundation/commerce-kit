#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Read the built iframe bundle and CSS
const iframeBundlePath = join(process.cwd(), 'dist/iframe/index.global.js');
const iframeCssPath = join(process.cwd(), 'dist/iframe/index.css');
const outputPath = join(process.cwd(), 'src/iframe-app/bundle.ts');

try {
  const bundleContent = readFileSync(iframeBundlePath, 'utf-8');
  let cssContent = '';
  try {
    cssContent = readFileSync(iframeCssPath, 'utf-8');
  } catch {}
  
  // Create the output directory if it doesn't exist
  mkdirSync(dirname(outputPath), { recursive: true });
  
  // Generate TypeScript file with the bundle as a constant
  const tsContent = `// This file is auto-generated. Do not edit manually.
// Generated from: dist/iframe-app/index.global.js

export const IFRAME_BUNDLE = ${JSON.stringify(bundleContent)};
export const IFRAME_STYLES = ${JSON.stringify(cssContent)};
`;
  
  writeFileSync(outputPath, tsContent, 'utf-8');
  console.log('✅ Generated iframe bundle at:', outputPath);

  // Generate HTML files for CDN deployment
  const ckHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Commerce Kit</title>
  <link rel="stylesheet" href="/index.css">
  <script>
    // Parse all query parameters from URL
    function parseQueryParams() {
      const params = new URLSearchParams(window.location.search);
      
      return {
        // Core parameters
        mode: params.get('mode') || 'tip',
        wallet: params.get('wallet') || undefined,
        merchantName: params.get('merchantName') || undefined,
        merchantLogo: params.get('merchantLogo') || undefined,
        
        // Multiple currencies support (comma-separated)
        currencies: params.get('currencies')?.split(',').filter(Boolean) || undefined,
        
        // Tip specific
        amount: params.has('amount') ? parseFloat(params.get('amount')) : undefined,
        tipPresets: params.get('tipPresets')?.split(',').map(Number).filter(n => !isNaN(n)) || undefined,
        
        // Theme parameters
        primaryColor: params.get('primaryColor') || undefined,
        secondaryColor: params.get('secondaryColor') || undefined,
        backgroundColor: params.get('backgroundColor') || undefined,
        textColor: params.get('textColor') || undefined,
        borderRadius: params.get('borderRadius') || undefined,
        fontFamily: params.get('fontFamily') || undefined,
        buttonShadow: params.get('buttonShadow') || undefined,
        buttonBorder: params.get('buttonBorder') || undefined,
      };
    }

    // Check if we're in standalone mode (no parent frame)
    function isStandalone() {
      try {
        return window.self === window.top;
      } catch (e) {
        // If we can't access window.top due to cross-origin, we're in an iframe
        return false;
      }
    }

    // Apply query parameters and auto-initialize if standalone
    window.addEventListener('DOMContentLoaded', function() {
      const queryParams = parseQueryParams();
      const standalone = isStandalone();
      
      if (standalone) {
        // Auto-initialize with query params
        const config = {
          mode: queryParams.mode || 'tip',
          merchant: {
            name: queryParams.merchantName || 'Commerce Kit',
            wallet: queryParams.wallet || '11111111111111111111111111111111',
            logo: queryParams.merchantLogo
          },
          allowedMints: queryParams.currencies || ['USDC'],
          tipPresets: queryParams.tipPresets || [1, 5, 15, 25, 50],
          tipDefaultAmount: queryParams.amount || 5
        };

        const theme = {
          primaryColor: queryParams.primaryColor || '#0066FF',
          secondaryColor: queryParams.secondaryColor || '#F0F4FF',
          backgroundColor: queryParams.backgroundColor || '#FFFFFF',
          textColor: queryParams.textColor || '#1A1A1A',
          borderRadius: queryParams.borderRadius || 'medium',
          fontFamily: queryParams.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          buttonShadow: queryParams.buttonShadow !== 'false',
          buttonBorder: queryParams.buttonBorder || 'none'
        };

        // Auto-initialize
        window.postMessage({
          type: 'init',
          config: config,
          theme: theme
        }, '*');
      }
    });
  </script>
</head>
<body>
  <div id="root"></div>
  <script src="/index.global.js"></script>
</body>
</html>`;

  const cktipHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Commerce Kit Tip Button</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: transparent;
    }
    
    .tip-button {
      padding: 0.75rem 1.5rem;
      background-color: #0066FF;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease;
      font-family: inherit;
      box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
      outline: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .tip-button:hover {
      background-color: #0052CC;
      box-shadow: 0 6px 16px rgba(0, 102, 255, 0.4);
    }
    
    .tip-button:active {
      transform: scale(0.97);
    }
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    
    .iframe-container {
      position: relative;
    }
    
    .close-button {
      position: absolute;
      top: -40px;
      right: 0;
      background: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <button class="tip-button" id="tipButton">
    <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
      <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
      <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
    </svg>
    <span id="buttonText">Tip with Crypto</span>
  </button>

  <div class="overlay" id="overlay">
    <div class="iframe-container">
      <button class="close-button" id="closeButton">×</button>
      <iframe id="tipIframe" 
        width="600" 
        height="700" 
        frameborder="0"
        style="border: none; outline: none; background: transparent; box-shadow: none;">
      </iframe>
    </div>
  </div>

  <script>
    // Parse query parameters
    function parseQueryParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        text: params.get('text') || 'Tip with Crypto',
        wallet: params.get('wallet'),
        merchantName: params.get('merchantName'),
        merchantLogo: params.get('merchantLogo'),
        currencies: params.get('currencies'),
        amount: params.get('amount'),
        tipPresets: params.get('tipPresets'),
        primaryColor: params.get('primaryColor'),
        secondaryColor: params.get('secondaryColor'),
        backgroundColor: params.get('backgroundColor'),
        textColor: params.get('textColor'),
        borderRadius: params.get('borderRadius'),
        fontFamily: params.get('fontFamily'),
        buttonShadow: params.get('buttonShadow'),
        buttonBorder: params.get('buttonBorder')
      };
    }

    // Build iframe URL with parameters
    function buildIframeUrl(params) {
      const baseUrl = window.location.origin + '/ck';
      const iframeParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && key !== 'text') {
          iframeParams.set(key, value);
        }
      });
      
      return \`\${baseUrl}?\${iframeParams.toString()}\`;
    }

    // Initialize
    const queryParams = parseQueryParams();
    
    // Set button text
    document.getElementById('buttonText').textContent = queryParams.text;
    
    // Button click handler
    document.getElementById('tipButton').addEventListener('click', function() {
      const iframe = document.getElementById('tipIframe');
      iframe.src = buildIframeUrl(queryParams);
      document.getElementById('overlay').style.display = 'flex';
    });
    
    // Close button handler
    document.getElementById('closeButton').addEventListener('click', function() {
      document.getElementById('overlay').style.display = 'none';
      document.getElementById('tipIframe').src = '';
    });
    
    // Close on overlay click
    document.getElementById('overlay').addEventListener('click', function(e) {
      if (e.target === this) {
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('tipIframe').src = '';
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('tipIframe').src = '';
      }
    });
  </script>
</body>
</html>`;

  // Write HTML files
  const ckHtmlPath = join(process.cwd(), 'dist/iframe/ck.html');
  const cktipHtmlPath = join(process.cwd(), 'dist/iframe/cktip.html');
  
  writeFileSync(ckHtmlPath, ckHtml, 'utf-8');
  writeFileSync(cktipHtmlPath, cktipHtml, 'utf-8');
  
  console.log('✅ Generated CDN HTML files:');
  console.log('  - ck.html (iframe endpoint)');
  console.log('  - cktip.html (button widget endpoint)');
} catch (error) {
  console.error('❌ Failed to generate iframe bundle:', error);
  process.exit(1);
}
