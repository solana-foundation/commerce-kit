import React from 'react'
import type { ThemeConfig, MerchantConfig, Currency } from '../../types'

interface WalletPaymentContentProps {
  theme: Required<ThemeConfig>
  config: { merchant: MerchantConfig; rpcUrl?: string }
  selectedAmount: number
  selectedCurrency: Currency
  customAmount: string
  showCustomInput: boolean
  onPaymentComplete: () => void
  walletIcon: React.ReactNode
}

type IFrameWalletInfo = { name: string; icon?: string; installed: boolean; connectable?: boolean }

export const WalletPaymentContent = ({
  theme,
  selectedAmount,
  selectedCurrency,
  customAmount,
  showCustomInput,
  onPaymentComplete,
  walletIcon,
}: WalletPaymentContentProps) => {
  const [wallets, setWallets] = React.useState<IFrameWalletInfo[]>([])
  const [connecting, setConnecting] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const mountedRef = React.useRef(false)

  React.useEffect(() => {
    mountedRef.current = true
    // Read wallets provided by parent via init message
    const provided = (window as any).__IFRAME_WALLETS__ as IFrameWalletInfo[] | undefined
    if (Array.isArray(provided)) setWallets(provided)

    function onMessage(e: MessageEvent) {
      const data = e.data as any
      if (!data || typeof data !== 'object') return
      if (data.type === 'walletConnectResult') {
        if (!mountedRef.current) return
        if (data.success) {
          setConnecting(null)
          setError(null)
          // Don't call onPaymentComplete yet - wait for actual payment result
        } else {
          setConnecting(null)
          setError(data.error || 'Failed to connect wallet')
        }
      } else if (data.type === 'paymentSuccess') {
        if (!mountedRef.current) return
        setConnecting(null)
        setError(null)
        // Payment successful - signal completion to modal
        onPaymentComplete()
      } else if (data.type === 'paymentError') {
        if (!mountedRef.current) return
        setConnecting(null)
        setError(data.error || 'Payment failed')
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      mountedRef.current = false
      window.removeEventListener('message', onMessage)
    }
  }, [onPaymentComplete])

  function requestConnect(walletName: string) {
    setError(null)
    setConnecting(walletName)
    try {
      // Calculate the payment amount to send to parent
      const amountValue = showCustomInput ? parseFloat(customAmount || '0') : selectedAmount;
      window.parent.postMessage({ 
        type: 'walletConnect', 
        walletName,
        amount: amountValue,
        currency: selectedCurrency
      }, '*')
    } catch (e: any) {
      setConnecting(null)
      setError(e?.message || 'Failed to request wallet connect')
    }
  }

  const showEmptyState = wallets.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 18, color: theme.textColor, fontWeight: 600 }}>Connect Your Wallet</div>
      <div style={{ marginBottom: 8, fontSize: 12, color: `${theme.textColor}90` }}>Select one of your available wallets.</div>

      {error ? (
        <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>{error}</div>
      ) : null}

      {showEmptyState ? (
        <div style={{ textAlign: 'left', color: `${theme.textColor}90`, padding: 12, border: '1px dashed #e5e7eb', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>No wallets detected</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Install a Solana wallet (e.g., Phantom, Backpack) and try again.</div>
        </div>
      ) : (
        <div className="ck-wallet-list">
          {wallets.map((w) => (
            <div
              key={w.name}
              className="ck-wallet-item"
            >
              <div className="ck-wallet-info">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {w.icon ? <img src={w.icon} alt={w.name} className="ck-wallet-icon" /> : walletIcon}
                <div>
                  <div className="ck-wallet-name">{w.name}</div>
                  <div className="ck-wallet-status">
                    {connecting === w.name ? 'Connecting…' : (w.installed ? 'Installed' : 'Not installed')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => requestConnect(w.name)}
                disabled={Boolean(connecting) || w.connectable === false}
                className="ck-wallet-connect-button"
                style={{
                  opacity: connecting && connecting !== w.name ? 0.7 : 1,
                }}
              >
                {connecting === w.name ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

WalletPaymentContent.displayName = 'IframeWalletPaymentContent'
