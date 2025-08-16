import React, { memo, useMemo, useState } from 'react';
import { ConnectorProvider, useConnector, injectArcConnectorGlobalStyles, Spinner } from '@solana-commerce/connector-kit';
import { getBorderRadius, sanitizeString } from '../../utils';
import type { ThemeConfig, MerchantConfig, Currency } from '../../types';

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
  const displayAmount = showCustomInput ? customAmount || '0' : selectedAmount.toString();

  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      {/* Payment Info */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.textColor
        }}>
          Send ${displayAmount} {selectedCurrency}
        </h3>
        <p style={{
          margin: '0 0 1rem 0',
          fontSize: '0.875rem',
          color: `${theme.textColor}70`
        }}>
          to {sanitizeString(config.merchant.name)}
        </p>
      </div>

      <ConnectorProvider config={{ autoConnect: false, storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }}>
        <WalletFlow
          theme={theme}
          onPaymentComplete={onPaymentComplete}
          walletIcon={walletIcon}
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
        <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>
          {error}
        </div>
      ) : null}

      {(sourceWallets ?? []).length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>No wallets detected</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Install a Solana wallet to get started</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sourceWallets.map((w: any, index: number) => (
            <div
              key={`${w.name}-${index}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 9999,
                backgroundColor: '#ffffff',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.icon} alt={w.name} width={40} height={40} style={{ borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
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
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9999,
                    border: '1px solid rgba(255,255,255,0.5)',
                    background: '#0a0a0a',
                    color: '#fff',
                    cursor: connecting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
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
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9999,
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
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

function WalletFlow({ theme, onPaymentComplete, walletIcon }: { theme: Required<ThemeConfig>; onPaymentComplete: () => void; walletIcon: React.ReactNode }) {
  const { connected, selectedAccount, disconnect } = useConnector();
  const emittedRef = React.useRef(false);
  const [devOutcome, setDevOutcome] = React.useState<'idle' | 'success' | 'declined'>('idle');
  const [iframeConnected, setIframeConnected] = React.useState(false);
  const [iframeAccount, setIframeAccount] = React.useState<string | null>(null);

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
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 200 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#f3f4f6' }}>
            {walletIcon}
          </div>
          {devOutcome === 'success' ? null : (
            <Spinner size={28} color={theme.primaryColor} />
          )}
          <div style={{ fontSize: 13, color: `${theme.textColor}80` }}>{message}</div>
          {isDev ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={async () => { try { await disconnect(); } catch {} setDevOutcome('idle'); emittedRef.current = false; setIframeConnected(false); setIframeAccount(null); }}
                style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
              >
                Disconnect
              </button>
              <button
                type="button"
                onClick={() => setDevOutcome('declined')}
                style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
              >
                Simulate Decline
              </button>
              <button
                type="button"
                onClick={() => { onPaymentComplete(); setDevOutcome('success'); }}
                style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
              >
                Simulate Success
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
      <WalletConnectList
        theme={theme}
        onIframeConnected={(accounts?: Array<{ address?: string }>) => {
          const first = accounts && accounts.length > 0 ? accounts[0]?.address ?? null : null;
          setIframeAccount(first);
          setIframeConnected(true);
        }}
      />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => { setIframeConnected(true); setDevOutcome('idle'); }}
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
          >
            Dev: Show Loading
          </button>
          <button
            type="button"
            onClick={() => { setIframeConnected(true); setDevOutcome('declined'); }}
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
          >
            Dev: Sad Path
          </button>
          <button
            type="button"
            onClick={() => { setIframeConnected(true); setDevOutcome('success'); }}
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
          >
            Dev: Happy Path
          </button>
          <button
            type="button"
            onClick={() => { setIframeConnected(false); setDevOutcome('idle'); setIframeAccount(null); }}
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}
          >
            Dev: Reset
          </button>
        </div>
    </div>
  );
}