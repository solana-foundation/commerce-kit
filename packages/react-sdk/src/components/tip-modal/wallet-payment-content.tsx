import React, { memo, useMemo, useState } from 'react';
import { ConnectorProvider, useConnector, injectArcConnectorGlobalStyles, Spinner } from '@solana-commerce/connector-kit';
import { getBorderRadius, sanitizeString, DEFAULT_PROFILE_SVG } from '../../utils';
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

  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
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
                borderRadius: getBorderRadius(theme.borderRadius ?? 'md'),
                backgroundColor: '#ffffff',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.icon} alt={w.name} width={40} height={40} style={{ borderRadius: getBorderRadius(theme.borderRadius ?? 'md') }} />
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
                    borderRadius: getBorderRadius(theme.borderRadius ?? 'md'),
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
                    borderRadius: getBorderRadius(theme.borderRadius ?? 'md'),
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
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayAmount = showCustomInput ? customAmount || '0' : selectedAmount.toString();

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(config.merchant.wallet);
      setCopied(true);
      setIsHovered(false);
      setTimeout(() => {
        setCopied(false);
        setIsHovered(false);
      }, 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = config.merchant.wallet;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setIsHovered(false);
      setTimeout(() => {
        setCopied(false);
        setIsHovered(false);
      }, 2000);
    }
  };

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
    const isDev = true; // Always show dev buttons
    const message = devOutcome === 'success'
      ? 'Payment sent successfully.'
      : devOutcome === 'declined'
        ? 'User declined signature.'
        : 'Preparing transaction…';

    return (
      <div style={{ textAlign: 'center' }}>
        {/* Send Amount and Profile Pill */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '2rem',
            fontWeight: '600',
            color: theme.textColor
          }}>
            Send ${displayAmount} {selectedCurrency}
          </h2>
          
          {/* Profile Picture and Name Pill - Shows address on hover */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <div 
              onClick={handleCopyAddress}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                backgroundColor: 'white',
                border: `1px solid #00000030`,
                borderRadius: '50px',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.875rem',
                color: '#2D2D2D',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                maxWidth: '320px'
              }}
            >
              <img
                src={config.merchant.logo || DEFAULT_PROFILE_SVG}
                alt={sanitizeString(config.merchant.name)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  background: config.merchant.logo ? 'transparent' : `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                  flexShrink: 0
                }}
              />
              
              {copied ? (
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#22c55e',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Copied to clipboard
                </span>
              ) : isHovered ? (
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontFamily: 'monospace',
                  color: '#666666',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {config.merchant.wallet.slice(0, 4)}...{config.merchant.wallet.slice(-4)}
                </div>
              ) : (
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.textColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {sanitizeString(config.merchant.name)}
                </span>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: '0.25rem'
              }}>
                {copied ? (
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M15.2559 0.41107C15.5814 0.736507 15.5814 1.26414 15.2559 1.58958L6.08926 10.7562C5.76382 11.0817 5.23618 11.0817 4.91074 10.7562L0.744078 6.58958C0.418641 6.26414 0.418641 5.73651 0.744078 5.41107C1.06951 5.08563 1.59715 5.08563 1.92259 5.41107L5.5 8.98848L14.0774 0.41107C14.4028 0.0856329 14.9305 0.0856329 15.2559 0.41107Z" fill="#22c55e"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.3335 10.6673V12.534C5.3335 13.2807 5.3335 13.6541 5.47882 13.9393C5.60665 14.1902 5.81063 14.3942 6.06151 14.522C6.34672 14.6673 6.72009 14.6673 7.46683 14.6673H12.5335C13.2802 14.6673 13.6536 14.6673 13.9388 14.522C14.1897 14.3942 14.3937 14.1902 14.5215 13.9393C14.6668 13.6541 14.6668 13.2807 14.6668 12.534V7.46732C14.6668 6.72058 14.6668 6.34721 14.5215 6.062C14.3937 5.81111 14.1897 5.60714 13.9388 5.47931C13.6536 5.33398 13.2802 5.33398 12.5335 5.33398H10.6668M3.46683 10.6673H8.5335C9.28023 10.6673 9.6536 10.6673 9.93882 10.522C10.1897 10.3942 10.3937 10.1902 10.5215 9.93931C10.6668 9.65409 10.6668 9.28072 10.6668 8.53398V3.46732C10.6668 2.72058 10.6668 2.34721 10.5215 2.062C10.3937 1.81111 10.1897 1.60714 9.93882 1.47931C9.6536 1.33398 9.28023 1.33398 8.5335 1.33398H3.46683C2.72009 1.33398 2.34672 1.33398 2.06151 1.47931C1.81063 1.60714 1.60665 1.81111 1.47882 2.062C1.3335 2.34721 1.3335 2.72058 1.3335 3.46732V8.53398C1.3335 9.28072 1.3335 9.65409 1.47882 9.93931C1.60665 10.1902 1.81063 10.3942 2.06151 10.522C2.34672 10.6673 2.72009 10.6673 3.46683 10.6673Z" stroke="currentColor" strokeOpacity="0.72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Status */}
        <div style={{
          backgroundColor:'#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
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
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: '600',
              color: theme.textColor,
              marginBottom: '1rem'
            }}>
              {message}
            </div>
            {isDev ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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