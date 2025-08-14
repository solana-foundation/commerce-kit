"use client"

import React, { memo, useEffect, useMemo, useState } from 'react'
import { useConnector } from './connector-provider'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogBackdrop,
  DialogClose,
  DropdownRoot,
  DropdownTrigger,
  DropdownContent,
  DropdownItem
} from '@solana-commerce/ui-primitives'
import { defaultConnectorTheme, getAccessibleTextColor, getBorderRadius, getButtonBorder, getButtonShadow, type ConnectorTheme } from './theme'
import { Spinner } from './spinner'

export interface ConnectButtonProps {
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'icon-only'
  theme?: Partial<ConnectorTheme>
  label?: string
}

export const ConnectButton = memo<ConnectButtonProps>(({ className, style, variant = 'default', theme = {}, label }) => {
  const t: ConnectorTheme = { ...defaultConnectorTheme, ...theme }
  const { wallets, connected, select, disconnect, selectedAccount, accounts, selectAccount, selectedWallet, connecting } = useConnector()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<'list' | 'help'>('list')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [connectingWalletName, setConnectingWalletName] = useState<string | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [unconnectableWalletName, setUnconnectableWalletName] = useState<string | null>(null)

  useEffect(() => {
    setIsDialogOpen(false)
    setCurrentStep('list')
    setConnectingWalletName(null)
    setConnectError(null)
  }, [connected])

  const selectedDisplay = useMemo(() => {
    if (!selectedAccount) return null
    return `${String(selectedAccount).slice(0, 4)}...${String(selectedAccount).slice(-4)}`
  }, [selectedAccount])

  const isIconOnly = variant === 'icon-only'

  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const buttonStyles: React.CSSProperties = useMemo(() => ({
    padding: isIconOnly ? '0.75rem' : '0.75rem 1.5rem',
    backgroundColor: isHovered ? t.secondaryColor : t.primaryColor,
    color: getAccessibleTextColor(isHovered ? t.secondaryColor : t.primaryColor),
    border: getButtonBorder(t.border),
    borderRadius: getBorderRadius(t.borderRadius),
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: isIconOnly ? 0 : '0.5rem',
    boxShadow: isHovered
      ? `${getButtonShadow(t.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)`
      : getButtonShadow(t.buttonShadow),
    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease',
    fontFamily: t.fontFamily,
    minWidth: isIconOnly ? '44px' : 'auto',
    aspectRatio: isIconOnly ? '1' : 'auto',
    outlineOffset: 2,
    ...style,
  }), [isIconOnly, isHovered, isPressed, t.border, t.borderRadius, t.buttonShadow, t.fontFamily, t.primaryColor, t.secondaryColor, style])

  const icon = (
    <svg width="18" height="14" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
      <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
      <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
    </svg>
  )

  const connectableWallets = useMemo(() => (wallets ?? []).filter((w: any) => w.connectable), [wallets])
  const unconnectableWallets = useMemo(() => (wallets ?? []).filter((w: any) => !w.connectable), [wallets])

  const selectedAccountInfo = useMemo(() => {
    if (!selectedAccount) return null
    return (accounts ?? []).find((a: any) => a.address === selectedAccount) ?? null
  }, [accounts, selectedAccount])

  const selectedWalletIcon = useMemo(() => {
    if (selectedAccountInfo?.icon) return selectedAccountInfo.icon
    if (!selectedWallet) return null
    const match = (wallets ?? []).find((w: any) => w.wallet === selectedWallet)
    return match?.icon ?? null
  }, [selectedAccountInfo, selectedWallet, wallets])

  function getUnconnectableReason(w: any): string {
    try {
      const features = (w?.wallet?.features ?? {}) as Record<string, unknown>
      const chains = (w?.wallet as any)?.chains as unknown as string[] | undefined
      const hasConnect = Boolean(features['standard:connect'])
      const hasDisconnect = Boolean(features['standard:disconnect'])
      const isSolana = Array.isArray(chains) && chains.some(c => typeof c === 'string' && c.includes('solana'))
      const missing: string[] = []
      if (!hasConnect) missing.push('standard:connect')
      if (!hasDisconnect) missing.push('standard:disconnect')
      if (!isSolana) missing.push('solana chain')
      if (missing.length === 0) return 'Unknown limitation'
      return `Unsupported features: ${missing.join(', ')}`
    } catch {
      return 'Wallet is not compatible with Wallet Standard connect/disconnect for Solana.'
    }
  }

  if (connected) {
    return (
      <DropdownRoot open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownTrigger asChild>
          <button
            className={className}
            style={{ ...buttonStyles, position: 'relative' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={(e) => { setIsHovered(false); setIsPressed(false); e.currentTarget.style.boxShadow = getButtonShadow(t.buttonShadow) }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onFocus={(e) => { setIsHovered(true); e.currentTarget.style.boxShadow = `${getButtonShadow(t.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)` }}
            onBlur={(e) => { setIsHovered(false); e.currentTarget.style.boxShadow = getButtonShadow(t.buttonShadow) }}
            type="button"
            aria-label={isIconOnly ? (selectedDisplay || label || 'Wallet') : undefined}
          >
            {selectedWalletIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedWalletIcon} alt="Account" width={18} height={18} style={{ borderRadius: 9 }} />
            ) : (
              icon
            )}
            {!isIconOnly && (selectedDisplay || label || 'Wallet')}
          </button>
        </DropdownTrigger>
        <DropdownContent align="end">
          <div
            style={{
              minWidth: 240,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              padding: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              textAlign: 'left'
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: 12, color: '#6b7280' }}>Account</div>
            <div style={{ padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', color: '#111827' }}>{selectedDisplay}</div>
            {(accounts ?? []).length > 1 ? (
              <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8, paddingTop: 8 }}>
                <div style={{ padding: '4px 12px', fontSize: 12, color: '#6b7280' }}>Accounts</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(accounts ?? []).map((acc: any) => (
                    <button
                      key={acc.address}
                      onClick={() => selectAccount(acc.address)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
                        color: acc.address === selectedAccount ? '#111827' : '#374151'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {acc.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={acc.icon} alt="" width={16} height={16} style={{ borderRadius: 8 }} />
                        ) : null}
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {String(acc.address).slice(0, 8)}...{String(acc.address).slice(-4)}
                        </span>
                      </span>
                      <span aria-hidden>{acc.address === selectedAccount ? '●' : '○'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {selectedWallet?.name ? (
              <DropdownItem onSelect={async (_e) => {
                try {
                  setConnectingWalletName(selectedWallet.name)
                  await select(selectedWallet.name)
                } catch (error: any) {
                  setConnectError(error?.message ?? 'Failed to connect more accounts')
                } finally {
                  setConnectingWalletName(null)
                }
              }}>
                <div style={{ padding: '8px 12px', fontSize: 13, color: '#111827', borderRadius: 6, cursor: 'pointer' }}>
                  {connectingWalletName === selectedWallet.name ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Spinner size={14} color="#9ca3af" speedMs={900} />
                      Connecting…
                    </span>
                  ) : (
                    'Connect More'
                  )}
                </div>
              </DropdownItem>
            ) : null}
              <DropdownItem onSelect={async (_e) => { 
                try {
                    setIsDialogOpen(false);
                    setCurrentStep('list');
                    await disconnect()
                } catch (error) {
                    // Reset state to ensure clean disconnection flow
                    setIsDialogOpen(false);
                    setCurrentStep('list');
                    // Consider showing a toast or notification to the user
                    console.error('Failed to disconnect wallet:', error);
                }
            }}>
              <div style={{ padding: '8px 12px', fontSize: 13, color: '#dc2626', borderRadius: 6, cursor: 'pointer' }}>
                Disconnect
              </div>
            </DropdownItem>
          </div>
        </DropdownContent>
      </DropdownRoot>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setCurrentStep('list') }}>
      <DialogTrigger asChild>
        <button
          className={className}
          style={buttonStyles}
          onClick={() => setIsDialogOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={(e) => { setIsHovered(false); setIsPressed(false); e.currentTarget.style.boxShadow = getButtonShadow(t.buttonShadow) }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onFocus={(e) => { setIsHovered(true); e.currentTarget.style.boxShadow = `${getButtonShadow(t.buttonShadow)}, 0 0 0 4px rgba(202, 202, 202, 0.45)` }}
          onBlur={(e) => { setIsHovered(false); e.currentTarget.style.boxShadow = getButtonShadow(t.buttonShadow) }}
          type="button"
          aria-label={isIconOnly ? (label || 'Connect Wallet') : undefined}
        >
          {icon}
          {!isIconOnly && (label || 'Connect Wallet')}
        </button>
      </DialogTrigger>
      <DialogBackdrop />
      <DialogContent style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #00000060', overflow: 'hidden', width: 300 }}>
        <div style={{ padding: 16, paddingTop: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            {currentStep === 'help' ? (
              <button aria-label="Back" type="button" onClick={() => setCurrentStep('list')} style={{ background: 'none', border: '1px solid transparent', width: 32, height: 32, borderRadius: 16, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>←</button>
            ) : (
              <button aria-label="Help" type="button" onClick={() => setCurrentStep('help')} style={{ background: 'none', border: '1px solid transparent', width: 32, height: 32, borderRadius: 16, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>?</button>
            )}
          </div>
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <DialogClose asChild>
              <button aria-label="Close" type="button" style={{ background: 'none', border: '1px solid transparent', width: 32, height: 32, borderRadius: 16, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>×</button>
            </DialogClose>
          </div>
          {currentStep === 'help' ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {unconnectableWalletName ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Wallet not connectable</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    {getUnconnectableReason((wallets ?? []).find((w: any) => w.name === unconnectableWalletName))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>How to connect a wallet</div>
                  <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 13, lineHeight: 1.5 }}>
                    <li>Install a Solana wallet (e.g., Phantom, Backpack).</li>
                    <li>Return to this page and click the wallet to connect.</li>
                    <li>Approve the connection request in your wallet.</li>
                  </ul>
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 18, color: '#111827', fontWeight: 600 }}>Connect Your Wallet</div>
              <div style={{ marginBottom: 16, fontSize: 12, color: '#6b7280' }}>Select one of your available wallets.</div>

              {connectError ? (
                <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>
                  {connectError}
                </div>
              ) : null}

              {(wallets ?? []).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>No wallets found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Install a Solana wallet to get started</div>
                </div>
              ) : (
                <>
                  {connectableWallets.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: unconnectableWallets.length ? 12 : 0 }}>
                      {connectableWallets.map((w: any) => (
                        <button
                          key={w.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            backgroundColor: '#ffffff',
                            cursor: connecting ? 'not-allowed' : 'pointer',
                            opacity: connecting && connectingWalletName !== w.name ? 0.7 : 1,
                            transition: 'background-color 0.2s ease, transform 0.1s ease'
                          }}
                          disabled={Boolean(connecting)}
                          onClick={async () => {
                            try {
                              setConnectError(null)
                              setConnectingWalletName(w.name)
                              await select(w.name);
                            } catch (error: any) {
                              setConnectError(error?.message ?? 'Failed to connect wallet')
                            } finally {
                              setConnectingWalletName(null)
                            }
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={w.icon} alt={w.name} width={20} height={20} style={{ borderRadius: '50%' }} />
                            <span style={{ fontSize: 14, color: '#111827' }}>{w.name}</span>
                          </span>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>
                            {connecting && connectingWalletName === w.name ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Spinner size={14} color="#9ca3af" speedMs={900} />
                                Connecting…
                              </span>
                            ) : (
                              <>{w.installed ? 'Installed' : 'Not installed'}</>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {unconnectableWallets.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {unconnectableWallets.map((w: any) => (
                        <button
                          key={w.name}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', border: '1px dashed #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb', cursor: 'pointer'
                          }}
                          onClick={() => { setUnconnectableWalletName(w.name); setCurrentStep('help') }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={w.icon} alt={w.name} width={20} height={20} style={{ borderRadius: '50%' }} />
                            <span style={{ fontSize: 14, color: '#6b7280', textDecoration: 'line-through' }}>{w.name}</span>
                          </span>
                          <span aria-hidden style={{ fontSize: 12, color: '#f59e0b' }}>!</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})

ConnectButton.displayName = 'ConnectButton'


