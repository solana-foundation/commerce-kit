// This is the iframe-safe version of WalletPaymentContent
// It's the same as the original but without any ui-primitives dependencies

export { WalletPaymentContent } from '../tip-modal/wallet-payment-content';

// Patch WalletConnectList inside iframe to call parent for connect since sandbox blocks providers
if (typeof window !== 'undefined') {
  (window as any).__IFRAME_WALLET_CONNECT__ = async function (walletName: string) {
    return new Promise((resolve) => {
      const listener = (event: MessageEvent) => {
        const data = event.data as any
        if (!data || data.type !== 'walletConnectResult' || data.walletName !== walletName) return
        window.removeEventListener('message', listener)
        resolve(data)
      }
      window.addEventListener('message', listener)
      window.parent.postMessage({ type: 'walletConnect', walletName }, '*')
    })
  }
  // Provide wallets passed from parent (if any) for initial rendering without local discovery
  ;(window as any).__IFRAME_WALLETS__ = [] as Array<{ name: string; icon?: string; installed: boolean; connectable?: boolean }>
}

// The WalletPaymentContent component doesn't use DialogClose or any ui-primitives
// so we can just re-export it directly
