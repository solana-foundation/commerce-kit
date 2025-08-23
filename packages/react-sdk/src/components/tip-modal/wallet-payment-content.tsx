import React, { memo, useState } from 'react';
import { ConnectorProvider, useConnector, injectArcConnectorGlobalStyles, Spinner } from '@solana-commerce/connector-kit';

import type { ThemeConfig, MerchantConfig, Currency } from '../../types';
import { MerchantAddressPill } from './merchant-address-pill';

interface WalletPaymentContentProps {
  theme: Required<ThemeConfig>;
  config: { merchant: MerchantConfig };
  selectedAmount: number;
  selectedCurrency: Currency;
  customAmount: string;
  showCustomInput: boolean;
  onPaymentComplete: () => void;
  walletIcon: React.ReactNode;
}

export const WalletPaymentContent = memo<WalletPaymentContentProps>(({
  theme,
  config,
  selectedAmount,
  selectedCurrency,
  customAmount,
  showCustomInput,
  onPaymentComplete,
  walletIcon
}) => {
  if (typeof document !== 'undefined') {
    injectArcConnectorGlobalStyles();
  }

  return (
    <div className="ck-wallet-container">
      <ConnectorProvider config={{ autoConnect: false, storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }}>
        <WalletFlow
          theme={theme}
          onPaymentComplete={onPaymentComplete}
          walletIcon={walletIcon}
          config={config}
          selectedAmount={selectedAmount}
          selectedCurrency={selectedCurrency}
          customAmount={customAmount}
          showCustomInput={showCustomInput}
        />
      </ConnectorProvider>
    </div>
  );
});

WalletPaymentContent.displayName = 'WalletPaymentContent';

function WalletConnectList({ theme, onIframeConnected }: { theme: Required<ThemeConfig>; onIframeConnected?: (accounts?: Array<{ address?: string }>) => void }) {
  const { wallets, connecting, connected, select } = useConnector();
  const [error, setError] = useState<string | null>(null);

  // Prefer parent-provided list if injected (e.g., iframe constraints)
  const injectedWallets = (typeof window !== 'undefined' && (window as any).__IFRAME_WALLETS__ ? (window as any).__IFRAME_WALLETS__ : undefined) as any[] | undefined
  const sourceWallets = injectedWallets && injectedWallets.length > 0 ? injectedWallets : (wallets ?? [])

  function getInstallUrl(name: string): string {
    const n = String(name).toLowerCase()
    if (n.includes('phantom')) return 'https://phantom.app'
    if (n.includes('backpack')) return 'https://backpack.app'
    if (n.includes('solflare')) return 'https://solflare.com'
    return 'https://phantom.app'
  }

  return (
    <div>
      {error ? (
        <div className="ck-wallet-error">
          {error}
        </div>
      ) : null}

      {(sourceWallets ?? []).length === 0 ? (
        <div className="ck-wallet-no-wallets">
          <div className="ck-wallet-no-wallets-title">No wallets detected</div>
          <div className="ck-wallet-no-wallets-subtitle">Install a Solana wallet to get started</div>
        </div>
      ) : (
        <div className="ck-wallet-list">
          {sourceWallets.map((w: any, index: number) => (
            <div
              key={`${w.name}-${index}`}
              className="ck-wallet-item"
            >
              <div className="ck-wallet-info">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.icon} alt={w.name} className="ck-wallet-icon" />
                <div>
                  <div className="ck-wallet-name">{w.name}</div>
                  <div className="ck-wallet-status">
                    {(w as any).installed ? 'Ready to connect' : 'Not installed'}
                  </div>
                </div>
              </div>

              {(w as any).installed && (w as any).connectable ? (
                <button
                  onClick={async () => {
                    try {
                      setError(null)
                      if (typeof (window as any).__IFRAME_WALLET_CONNECT__ === 'function') {
                        if (process.env.NODE_ENV !== 'production') {
                          console.log('[WalletConnectList][iframe] Requesting parent connect for', w.name)
                        }
                        const res = await (window as any).__IFRAME_WALLET_CONNECT__(w.name)
                        if (!res?.success) throw new Error(res?.error || 'Failed to connect wallet')
                        if (process.env.NODE_ENV !== 'production') {
                          console.log('[WalletConnectList][iframe] Connect success, accounts:', (res as any).accounts)
                        }
                        try { onIframeConnected?.((res as any).accounts) } catch {}
                      } else if (select) {
                        await select(w.name)
                      }
                    } catch (e: any) {
                      setError(e?.message ?? 'Failed to connect wallet')
                    }
                  }}
                  disabled={Boolean(connecting)}
                  className="ck-wallet-connect-button"
                >
                  {connecting ? <Spinner size={16} /> : null}
                  {connecting ? 'Connecting…' : 'Connect'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const url = getInstallUrl(w.name)
                    try { window.open(url, '_blank') } catch {}
                  }}
                  className="ck-wallet-install-button"
                >
                  Install
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletFlow({ theme, onPaymentComplete, walletIcon, config, selectedAmount, selectedCurrency, customAmount, showCustomInput }: { 
  theme: Required<ThemeConfig>; 
  onPaymentComplete: () => void; 
  walletIcon: React.ReactNode;
  config: { merchant: MerchantConfig };
  selectedAmount: number;
  selectedCurrency: Currency;
  customAmount: string;
  showCustomInput: boolean;
}) {
  const { connected, selectedAccount, disconnect } = useConnector();
  const emittedRef = React.useRef(false);
  const [devOutcome, setDevOutcome] = React.useState<'idle' | 'success' | 'declined'>('idle');
  const [iframeConnected, setIframeConnected] = React.useState(false);
  const [iframeAccount, setIframeAccount] = React.useState<string | null>(null);

  const displayAmount = showCustomInput ? customAmount || '0' : selectedAmount.toString();

  // Dev log: connected account
  React.useEffect(() => {
    if (connected && selectedAccount && process.env.NODE_ENV !== 'production') {
      console.log('[WalletPayment] Connected account:', selectedAccount);
    }
  }, [connected, selectedAccount]);

  // Emit once when connected (real flow)
  React.useEffect(() => {
    if (connected && !emittedRef.current) {
      emittedRef.current = true;
      onPaymentComplete();
    }
  }, [connected, onPaymentComplete]);

  React.useEffect(() => {
    if (iframeConnected && iframeAccount && process.env.NODE_ENV !== 'production') {
      console.log('[WalletPayment][iframe] Connected account:', iframeAccount);
    }
  }, [iframeConnected, iframeAccount]);

  const showLoading = connected || iframeConnected;

  if (showLoading) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WalletFlow] Showing loading state', { connected, iframeConnected, selectedAccount })
    }
    const isDev = process.env.NODE_ENV !== 'production';
    const message = devOutcome === 'success'
      ? 'Payment sent successfully.'
      : devOutcome === 'declined'
        ? 'User declined signature.'
        : 'Preparing transaction…';

    return (
      <div className="ck-wallet-loading-container">
        {/* Send Amount and Profile Pill */}
        <div className="ck-wallet-payment-section">
          <h2 className="ck-payment-title">
            <span className="ck-payment-amount-dim">Send</span> ${displayAmount} {selectedCurrency}
          </h2>
          
          {/* Profile Picture and Name Pill - Shows address on hover */}
          <MerchantAddressPill
            theme={theme}
            config={config}
            copiedText="Copied to clipboard"
          />
        </div>

        {/* Wallet Connection Status */}
        <div className="ck-wallet-status-container">
          <div className="ck-wallet-status-content">
            {devOutcome === 'success' ? (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.12" d="M15.9998 29.3332C23.3636 29.3332 29.3332 23.3636 29.3332 15.9998C29.3332 8.63604 23.3636 2.6665 15.9998 2.6665C8.63604 2.6665 2.6665 8.63604 2.6665 15.9998C2.6665 23.3636 8.63604 29.3332 15.9998 29.3332Z" fill="#23C456"/>
                <path d="M9.99984 15.9998L13.9998 19.9998L21.9998 11.9998M29.3332 15.9998C29.3332 23.3636 23.3636 29.3332 15.9998 29.3332C8.63604 29.3332 2.6665 23.3636 2.6665 15.9998C2.6665 8.63604 8.63604 2.6665 15.9998 2.6665C23.3636 2.6665 29.3332 8.63604 29.3332 15.9998Z" stroke="#23C456" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : devOutcome === 'declined' ? (
              <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.12" d="M9.855 3.79134C10.0856 3.56074 10.2009 3.44544 10.3355 3.36298C10.4548 3.28988 10.5848 3.23601 10.7209 3.20334C10.8743 3.1665 11.0374 3.1665 11.3635 3.1665H20.6362C20.9623 3.1665 21.1254 3.1665 21.2788 3.20334C21.4149 3.23601 21.5449 3.28988 21.6642 3.36298C21.7988 3.44544 21.9141 3.56074 22.1447 3.79134L28.7083 10.355C28.9389 10.5856 29.0542 10.7009 29.1367 10.8355C29.2098 10.9548 29.2637 11.0848 29.2963 11.2209C29.3332 11.3743 29.3332 11.5374 29.3332 11.8635V21.1362C29.3332 21.4623 29.3332 21.6254 29.2963 21.7788C29.2637 21.9149 29.2098 22.0449 29.1367 22.1642C29.0542 22.2988 28.9389 22.4141 28.7083 22.6447L22.1447 29.2083C21.9141 29.4389 21.7988 29.5542 21.6642 29.6367C21.5449 29.7098 21.4149 29.7637 21.2788 29.7963C21.1254 29.8332 20.9623 29.8332 20.6362 29.8332H11.3635C11.0374 29.8332 10.8743 29.8332 10.7209 29.7963C10.5848 29.7637 10.4548 29.7098 10.3355 29.6367C10.2009 29.5542 10.0856 29.4389 9.855 29.2083L3.29134 22.6447C3.06074 22.4141 2.94544 22.2988 2.86298 22.1642C2.78988 22.0449 2.73601 21.9149 2.70334 21.7788C2.6665 21.6254 2.6665 21.4623 2.6665 21.1362V11.8635C2.6665 11.5374 2.6665 11.3743 2.70334 11.2209C2.73601 11.0848 2.78988 10.9548 2.86298 10.8355C2.94544 10.7009 3.06074 10.5856 3.29134 10.355L9.855 3.79134Z" fill="#FF0000" fillOpacity="0.56"/>
                <path d="M15.9998 11.1665V16.4998M15.9998 21.8332H16.0132M2.6665 11.8635V21.1362C2.6665 21.4623 2.6665 21.6254 2.70334 21.7788C2.73601 21.9149 2.78988 22.0449 2.86298 22.1642C2.94544 22.2988 3.06074 22.4141 3.29134 22.6447L9.855 29.2083C10.0856 29.4389 10.2009 29.5542 10.3355 29.6367C10.4548 29.7098 10.5848 29.7637 10.7209 29.7963C10.8743 29.8332 11.0374 29.8332 11.3635 29.8332H20.6362C20.9623 29.8332 21.1254 29.8332 21.2788 29.7963C21.4149 29.7637 21.5449 29.7098 21.6642 29.6367C21.7988 29.5542 21.9141 29.4389 22.1447 29.2083L28.7083 22.6447C28.9389 22.4141 29.0542 22.2988 29.1367 22.1642C29.2098 22.0449 29.2637 21.9149 29.2963 21.7788C29.3332 21.6254 29.3332 21.4623 29.3332 21.1362V11.8635C29.3332 11.5374 29.3332 11.3743 29.2963 11.2209C29.2637 11.0848 29.2098 10.9548 29.1367 10.8355C29.0542 10.7009 28.9389 10.5856 28.7083 10.355L22.1447 3.79134C21.9141 3.56074 21.7988 3.44544 21.6642 3.36298C21.5449 3.28988 21.4149 3.23601 21.2788 3.20334C21.1254 3.1665 20.9623 3.1665 20.6362 3.1665H11.3635C11.0374 3.1665 10.8743 3.1665 10.7209 3.20334C10.5848 3.23601 10.4548 3.28988 10.3355 3.36298C10.2009 3.44544 10.0856 3.56074 9.855 3.79134L3.29134 10.355C3.06074 10.5856 2.94544 10.7009 2.86298 10.8355C2.78988 10.9548 2.73601 11.0848 2.70334 11.2209C2.6665 11.3743 2.6665 11.5374 2.6665 11.8635Z" stroke="#FF0000" strokeOpacity="0.56" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <Spinner size={32} color={theme.primaryColor} />
            )}
            <div className="ck-wallet-status-message">
              {message}
            </div>
            {isDev ? (
              <div className="ck-wallet-dev-buttons">
                <button
                  type="button"
                  onClick={async () => { try { await disconnect(); } catch {} setDevOutcome('idle'); emittedRef.current = false; setIframeConnected(false); setIframeAccount(null); }}
                  className="ck-wallet-dev-button"
                >
                  Disconnect
                </button>
                <button
                  type="button"
                  onClick={() => setDevOutcome('declined')}
                  className="ck-wallet-dev-button"
                >
                  Simulate Decline
                </button>
                <button
                  type="button"
                  onClick={() => { onPaymentComplete(); setDevOutcome('success'); }}
                  className="ck-wallet-dev-button"
                >
                  Simulate Success
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="ck-wallet-flow-container">
      {/* Send Amount and Profile Pill */}
      <div className="ck-wallet-payment-section">
        <h2 className="ck-payment-title">
          <span className="ck-payment-amount-dim">Send</span> ${displayAmount} {selectedCurrency}
        </h2>
        
        {/* Profile Picture and Name Pill - Shows address on hover */}
        <MerchantAddressPill
          theme={theme}
          config={config}
          copiedText="Address Copied!"
        />
      </div>

      <WalletConnectList
        theme={theme}
        onIframeConnected={(accounts?: Array<{ address?: string }>) => {
          const first = accounts && accounts.length > 0 ? accounts[0]?.address ?? null : null;
          setIframeAccount(first);
          setIframeConnected(true);
        }}
      />
      {process.env.NODE_ENV !== 'production' && (
        <div className="ck-wallet-flow-dev-section">
          <button
            type="button"
            onClick={() => { setIframeConnected(true); setDevOutcome('idle'); }}
            className="ck-wallet-dev-button"
          >
            Dev: Show Loading
          </button>
          <button
            type="button"
            onClick={() => { setIframeConnected(true); setDevOutcome('declined'); }}
            className="ck-wallet-dev-button"
          >
            Dev: Sad Path
          </button>
          <button
            type="button"
            onClick={() => { setIframeConnected(true); setDevOutcome('success'); }}
            className="ck-wallet-dev-button"
          >
            Dev: Happy Path
          </button>
          <button
            type="button"
            onClick={() => { setIframeConnected(false); setDevOutcome('idle'); setIframeAccount(null); }}
            className="ck-wallet-dev-button"
          >
            Dev: Reset
          </button>
        </div>
      )}
    </div>
  );
}