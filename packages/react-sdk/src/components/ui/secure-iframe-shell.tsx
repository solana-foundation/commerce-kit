"use client";

import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
  // @ts-ignore - Type definitions may not be available
  import { ConnectorClient, AppProvider, useConnectorClient } from '@solana-commerce/connector-kit';

import { useTransferSOL, useTransferToken, useArcClient } from '@solana-commerce/solana-hooks';
import type { SolanaCommerceConfig, ThemeConfig } from '../../types';
import { IFRAME_BUNDLE } from '../../iframe-app/bundle';
import { IFRAME_STYLES } from '../../iframe-app/bundle';

interface SecureIframeShellProps {
  config: SolanaCommerceConfig;
  theme: Required<ThemeConfig>;
  onPayment: (amount: number, currency: string) => void;
  onCancel: () => void;
}

// Token mint addresses for different networks
const TOKEN_MINTS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
  USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Mainnet USDT  
  USDT_DEVNET: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS', // Devnet USDT
} as const;



/**
 * Secure iframe shell using srcDoc + postMessage (no allow-same-origin).
 * Renders the full modal UI inside the iframe and communicates with parent.
 * 
 * NOTE: This component expects to be wrapped in AppProvider by the parent.
 */
export function SecureIframeShell({ config, theme, onPayment, onCancel }: SecureIframeShellProps) {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  // Force mainnet for testing with real USDC
  const rpcUrl = config.rpcUrl || 'https://api.mainnet-beta.solana.com';
  const network = 'mainnet';
  
  // Get the connector from AppProvider context
  const connectorClient = useConnectorClient();
  
  console.log('[SecureIframeShell] ConnectorClient from context:', {
    hasClient: !!connectorClient,
    connected: connectorClient?.getSnapshot?.()?.connected,
    selectedWallet: connectorClient?.getSnapshot?.()?.selectedWallet?.name
  });
  
  if (!connectorClient) {
    return <div>Loading connector...</div>;
  }

  // ArcProvider is now at the root level - no need to create another one here
  return (
    <SecureIframeShellInner 
      config={config} 
      theme={theme} 
      onPayment={onPayment} 
      onCancel={onCancel}
    />
  );
}

interface SecureIframeShellInnerProps extends SecureIframeShellProps {}

function SecureIframeShellInner({ config, theme, onPayment, onCancel }: SecureIframeShellInnerProps) {
  // Use the ConnectorClient from context
  const connectorClient = useConnectorClient();
  
  console.log('[SecureIframeShellInner] ConnectorClient from context:', {
    hasClient: !!connectorClient,
    connected: connectorClient?.getSnapshot?.()?.connected
  });
  
  if (!connectorClient) {
    return <div>Loading connector...</div>;
  }
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(400);
  const [ready, setReady] = useState(false);
  
  // Use the standard transfer hooks at component level (not in async functions)
  const { transferSOL, isLoading: transferSOLLoading, error: transferSOLError } = useTransferSOL();
  const { transferToken, isLoading: transferTokenLoading, error: transferTokenError } = useTransferToken();
  
  // Debug: Check ArcClient state - now using the fixed ArcProvider
  const arcClient = useArcClient();
  console.log('[SecureIframeShell] ArcClient wallet state:', {
    connected: arcClient.wallet.connected,
    address: arcClient.wallet.address,
    hasSigner: !!arcClient.wallet.signer,
    selectedAccount: arcClient.wallet.selectedAccount,
    accountsCount: arcClient.wallet.accounts?.length
  });
  
  // State to track current payment attempt
  const [currentPayment, setCurrentPayment] = useState<{
    amount: number;
    currency: string;
    walletName: string;
  } | null>(null);

  // No need to create ConnectorClient here - it's passed as prop

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

  // Function to execute the actual payment after wallet connection
  const executePayment = async (
    paymentInfo: { amount: number; currency: string; walletName: string },
    transferSOLFn: typeof transferSOL,
    transferTokenFn: typeof transferToken
  ) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[SecureIframeShell] Executing payment:', paymentInfo);
      }
      
      // Validate merchant address
      if (!config.merchant?.wallet) {
        throw new Error('Merchant address not configured');
      }
      
      if (!connectorClient) {
        throw new Error('Connector client not available');
      }
      
      const state = connectorClient.getSnapshot();
      if (!state.selectedWallet || !state.selectedAccount) {
        throw new Error('No wallet connected');
      }
      
      // Get the connected wallet account
      console.log('[SecureIframeShell] ConnectorClient state:', {
        connected: state.connected,
        selectedWallet: state.selectedWallet?.name,
        selectedAccount: state.selectedAccount,
        accountsCount: state.accounts?.length,
        accounts: state.accounts?.map((a: any) => ({ address: a.address, hasRaw: !!a.raw }))
      });
      
      const connectedAccount = state.accounts.find((acc: any) => acc.address === state.selectedAccount);
      if (!connectedAccount) {
        throw new Error('Connected account not found');
      }
      
      console.log('[SecureIframeShell] Found connected account:', {
        address: connectedAccount.address,
        hasRaw: !!connectedAccount.raw
      });
      
      const { amount, currency } = paymentInfo;
      const isSOL = currency === 'SOL' || currency === 'SOL_DEVNET';
      
      let result;
      
      if (isSOL) {
        // SOL transfer - convert USD to SOL (simplified: assume 1 SOL = $100 for demo)
        const solAmount = BigInt(Math.floor(amount / 100 * 1_000_000_000)); // Convert to lamports
        result = await transferSOLFn({
          to: config.merchant.wallet,
          amount: solAmount,
          from: connectedAccount.address
        });
      } else {
        // SPL Token transfer
        const tokenMint = TOKEN_MINTS[currency as keyof typeof TOKEN_MINTS];
        if (!tokenMint) {
          throw new Error(`Unsupported token: ${currency}`);
        }
        
        // For USDC/USDT, use 6 decimals (1 USDC = 1,000,000 micro-USDC)
        const tokenAmount = BigInt(Math.floor(amount * 1_000_000));
        
        result = await transferTokenFn({
          mint: tokenMint,
          to: config.merchant.wallet,
          amount: tokenAmount,
          createAccountIfNeeded: true,
          from: connectedAccount.address
        });
      }
      
      const signature = result.signature;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[SecureIframeShell] Payment successful:', signature);
        console.log('Payment details:', { amount, currency, from: connectedAccount.address, to: config.merchant.wallet });
      }
      
      // Notify iframe of success
      iframeRef.current?.contentWindow?.postMessage({ 
        type: 'paymentSuccess', 
        signature: signature,
        amount: paymentInfo.amount,
        currency: paymentInfo.currency
      }, '*');
      
      // Also call the parent payment callback
      onPayment(paymentInfo.amount, paymentInfo.currency);
      
    } catch (error: any) {
      console.error('[SecureIframeShell] Payment failed:', error);
      
      let errorMessage = 'Payment failed';
      if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Payment cancelled by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for payment';  
      } else if (error.name === 'BlockhashExpirationError') {
        errorMessage = 'Transaction failed due to network congestion. Please try again.';
      } else {
        errorMessage = error.message || 'Unknown payment error';
      }
      
      // Notify iframe of error
      iframeRef.current?.contentWindow?.postMessage({ 
        type: 'paymentError', 
        error: errorMessage 
      }, '*');
      
      throw error; // Re-throw to be caught by wallet connect handler
    } finally {
      setCurrentPayment(null);
    }
  };

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
          onPayment(data.amount, data.currency);
          break;
        case 'walletConnect': {
          try {
            // Store payment details from the iframe for later execution
            const paymentInfo = {
              amount: data.amount || 5, // Default to $5 if not provided
              currency: data.currency || 'USDC',
              walletName: data.walletName
            };
            setCurrentPayment(paymentInfo);
            
            if (!connectorClient) {
              throw new Error('Connector client not available');
            }
            
            // Ensure wallet list is ready (Wallet Standard can be async to populate)
            await waitForWallets(connectorClient);
            const snap = connectorClient.getSnapshot();
            const target = (snap.wallets || []).find((w: any) => w.name === data.walletName);
            if (!target) throw new Error('Wallet not found');
            if (process.env.NODE_ENV !== 'production') {
              console.log('[SecureIframeShell] Selecting wallet for iframe:', data.walletName);
            }
            const res = await connectorClient.select(data.walletName);
            const result = connectorClient.getSnapshot();
            const accounts = (result.accounts || []).map((a: any) => ({ address: a.address, icon: a.icon }));
            if (process.env.NODE_ENV !== 'production') {
              console.log('[SecureIframeShell] Iframe connect success, accounts:', accounts.map((a: any) => a.address));
            }
            
            // Wait longer for React components to fully initialize
            // The ArcWebClient shows listenersCount: 0, need more time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Now execute the payment with the connected wallet
            await executePayment(paymentInfo, transferSOL, transferToken);
            
            iframeRef.current?.contentWindow?.postMessage({ type: 'walletConnectResult', success: true, walletName: data.walletName, accounts }, '*');
          } catch (err: any) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[SecureIframeShell] walletConnect failed:', err);
            }
            iframeRef.current?.contentWindow?.postMessage({ type: 'walletConnectResult', success: false, walletName: data.walletName, error: err?.message || String(err) }, '*');
            setCurrentPayment(null); // Clear on error
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

      // Gather wallet list from the existing connector client
      let initialWallets: Array<{ name: string; icon?: string; installed: boolean; connectable?: boolean }> | undefined
      try {
        if (connectorClient) {
          const snap = connectorClient.getSnapshot();
          initialWallets = (snap.wallets || []).map((w: any) => ({ name: w.name, icon: w.icon, installed: w.installed, connectable: w.connectable }))
        } else {
          initialWallets = undefined
        }
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
  // For tip mode, amount is determined by user input
  return 0;
}


