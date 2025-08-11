"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SolanaCommerceConfig, ThemeConfig } from '../../types';
import { IFRAME_BUNDLE } from '../../iframe-app/bundle';

interface SecureIframeShellProps {
  config: SolanaCommerceConfig;
  theme: Required<ThemeConfig>;
  onPayment: (amount: number, currency: string, products?: readonly any[]) => void;
  onCancel: () => void;
  wrap?: boolean; // if false, render only the iframe (to embed inside a DialogContent)
}

/**
 * Secure iframe shell using srcDoc + postMessage (no allow-same-origin).
 * Renders the full modal UI inside the iframe and communicates with parent.
 */
export function SecureIframeShell({ config, theme, onPayment, onCancel, wrap = true }: SecureIframeShellProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(400);
  const [ready, setReady] = useState(false);

  // Create the HTML document for the iframe with the bundled app
  const srcDoc = useMemo(() => {
    // Base styles for the iframe document
    const globalStyles = `
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      html, body { 
        height: 100%; 
        margin: 0; 
        padding: 0;
        overflow: hidden;
      }
      body { 
        background: ${theme.backgroundColor || 'transparent'};
        font-family: ${theme.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
        color: ${theme.textColor || '#000'};
      }
      #root {
        min-height: 100%;
      }
    `;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; base-uri 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; font-src data:; connect-src https: wss:;">
  <style>${globalStyles}</style>
</head>
<body>
  <div id="root"></div>
  <script>${IFRAME_BUNDLE}</script>
</body>
</html>`;
  }, [theme]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as any;
      if (!data || typeof data !== 'object') return;
      
      // Validate the message is from our iframe
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      
      switch (data.type) {
        case 'ready':
          setReady(true);
          break;
        case 'resize':
          const next = Math.min(Number(data.height) || 0, Math.floor(window.innerHeight * 0.9));
          if (next > 0) setHeight(next);
          break;
        case 'close':
          onCancel();
          break;
        case 'payment':
          onPayment(data.amount, data.currency, data.products);
          break;
        // Additional event types can be handled here
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onPayment, onCancel]);

  // Send init message when iframe is ready
  useEffect(() => {
    if (ready && iframeRef.current?.contentWindow) {
      const totalAmount = inferTotalAmount(config);
      const paymentUrl = config.mode === 'tip' 
        ? '' 
        : `solana:?recipient=${config.merchant.wallet}&amount=${totalAmount}`;
      
      console.log('[SecureIframeShell] Sending init message', { config, theme });
      
      iframeRef.current.contentWindow.postMessage({
        type: 'init',
        config,
        theme,
        totalAmount,
        paymentUrl
      }, '*');
    }
  }, [ready, config, theme]);

  const iframeEl = (
    <iframe
      ref={iframeRef}
      title="Commerce Modal"
      srcDoc={srcDoc}
      style={{
        width: Math.min(500, Math.floor(window.innerWidth * 0.9)),
        height,
        display: 'block',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        background: 'transparent',
        overflow: 'hidden',
      }}
      sandbox="allow-scripts allow-forms allow-popups"
      referrerPolicy="no-referrer"
      allow="clipboard-write"
    />
  );

  if (!wrap) return iframeEl;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        maxWidth: '90vw',
        maxHeight: '90vh',
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {iframeEl}
    </div>
  );
}

function inferTotalAmount(config: SolanaCommerceConfig): number {
  if (config.mode === 'tip') return 0;
  const items = config.products || [];
  return items.reduce((sum, p: any) => sum + (p?.price || 0), 0);
}


