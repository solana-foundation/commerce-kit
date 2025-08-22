"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConnectorClient } from '@solana-commerce/connector-kit';
import type { SolanaCommerceConfig, ThemeConfig } from '../../types';
import { IFRAME_BUNDLE } from '../../iframe-app/bundle';
import { IFRAME_STYLES } from '../../iframe-app/bundle';

interface SecureIframeShellProps {
  config: SolanaCommerceConfig;
  theme: Required<ThemeConfig>;
  onPayment: (amount: number, currency: string, products?: readonly any[]) => void;
  onCancel: () => void;
}

/**
 * Secure iframe shell using srcDoc + postMessage (no allow-same-origin).
 * Renders the full modal UI inside the iframe and communicates with parent.
 */
export function SecureIframeShell({ config, theme, onPayment, onCancel }: SecureIframeShellProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(400);
  const [ready, setReady] = useState(false);
  const clientRef = useRef<ConnectorClient | null>(null);

  // Create the ConnectorClient once on mount; cleanup on unmount
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new ConnectorClient({ autoConnect: false, debug: process.env.NODE_ENV !== 'production' });
    }
    return () => {
      try { clientRef.current?.destroy?.(); } catch {}
      clientRef.current = null;
    };
  }, []);

  // Create the HTML document for the iframe with the bundled app
  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; base-uri 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; font-src data:; connect-src https: wss:;">
  <style>${IFRAME_STYLES || ''}</style>
</head>
<body>
  <div id="root"></div>
  <script>${IFRAME_BUNDLE}</script>
</body>
</html>`;
  }, [theme]);

  useEffect(() => {
    async function waitForWallets(client: ConnectorClient, timeoutMs = 1500): Promise<void> {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const wallets = client.getSnapshot().wallets || [];
        if (wallets.length > 0) return;
        await new Promise(r => setTimeout(r, 50));
      }
      // Let it continue even if empty; select() will throw and be handled below
    }

    async function onMessage(e: MessageEvent) {
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
        case 'walletConnect': {
          try {
            const client = clientRef.current!;
            // Ensure wallet list is ready (Wallet Standard can be async to populate)
            await waitForWallets(client);
            const snap = client.getSnapshot();
            const target = (snap.wallets || []).find((w: any) => w.name === data.walletName);
            if (!target) throw new Error('Wallet not found');
            if (process.env.NODE_ENV !== 'production') {
              console.log('[SecureIframeShell] Selecting wallet for iframe:', data.walletName);
            }
            const res = await client.select(data.walletName);
            const result = client.getSnapshot();
            const accounts = (result.accounts || []).map((a: any) => ({ address: a.address, icon: a.icon }));
            if (process.env.NODE_ENV !== 'production') {
              console.log('[SecureIframeShell] Iframe connect success, accounts:', accounts.map(a => a.address));
            }
            iframeRef.current?.contentWindow?.postMessage({ type: 'walletConnectResult', success: true, walletName: data.walletName, accounts }, '*');
          } catch (err: any) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[SecureIframeShell] walletConnect failed:', err);
            }
            iframeRef.current?.contentWindow?.postMessage({ type: 'walletConnectResult', success: false, walletName: data.walletName, error: err?.message || String(err) }, '*');
          }
          break;
        }
        // Additional event types can be handled here
      }
    }
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [onPayment, onCancel]);

  // Send init message when iframe is ready
  useEffect(() => {
    if (ready && iframeRef.current?.contentWindow) {
      const totalAmount = inferTotalAmount(config);
      const paymentUrl = config.mode === 'tip' 
        ? '' 
        : `solana:?recipient=${config.merchant.wallet}&amount=${totalAmount}`;
      
      console.log('[SecureIframeShell] Sending init message', { config, theme });

      // Gather wallet list in parent context (Wallet Standard available here)
      let initialWallets: Array<{ name: string; icon?: string; installed: boolean; connectable?: boolean }> | undefined
      try {
        const client = new ConnectorClient({ autoConnect: false });
        const snap = client.getSnapshot();
        initialWallets = (snap.wallets || []).map((w: any) => ({ name: w.name, icon: w.icon, installed: w.installed, connectable: w.connectable }))
        client.destroy?.()
      } catch {
        initialWallets = undefined
      }
      
      iframeRef.current.contentWindow.postMessage({
        type: 'init',
        config,
        theme,
        totalAmount,
        paymentUrl,
        wallets: initialWallets
      }, '*');
    }
  }, [ready, config, theme]);

  return (
    <iframe
      ref={iframeRef}
      title="Commerce Modal"
      srcDoc={srcDoc}
      width="100%"
      height={height}
      style={{
        width: '560px',
        maxWidth: '560px',
        minWidth: '560px',
        backgroundColor: 'transparent',
        border: 'none',
        transition: 'height 300ms cubic-bezier(0.19, 1, 0.22, 1)',
      }}
      sandbox="allow-scripts allow-forms allow-popups"
      referrerPolicy="no-referrer"
      allow="clipboard-write"
    />
  );
}

function inferTotalAmount(config: SolanaCommerceConfig): number {
  if (config.mode === 'tip') return 0;
  const items = config.products || [];
  return items.reduce((sum, p: any) => sum + (p?.price || 0), 0);
}


