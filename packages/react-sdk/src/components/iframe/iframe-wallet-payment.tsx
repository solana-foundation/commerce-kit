// This is the iframe-safe version of WalletPaymentContent
// It's the same as the original but without any ui-primitives dependencies

export { WalletPaymentContent } from '../tip-modal/wallet-payment-content';

// Patch WalletConnectList inside iframe to call parent for connect since sandbox blocks providers
if (typeof window !== 'undefined') {
  // Store allowed origins (should be configurable)
  //const ALLOWED_ORIGINS = [window.location.origin, /* add other trusted origins */];

  (window as any).__IFRAME_WALLET_CONNECT__ = async function (walletName: string) {
    return new Promise((resolve) => {
      const listener = (event: MessageEvent) => {
        // Validate source and origin: must be from the parent, and origin must match known parent or same-origin.
        const parentOrigin: unknown = (window as any).__IFRAME_PARENT_ORIGIN__;
        const knownParentOrigin = typeof parentOrigin === 'string' && parentOrigin !== '*' ? parentOrigin : null;
        const sourceIsParent = event.source === window.parent;
        const isValidOrigin =
          sourceIsParent &&
          (event.origin === knownParentOrigin || event.origin === window.location.origin);

        if (!isValidOrigin) {
          console.warn('[IframeWalletConnect] Rejected message from invalid origin:', event.origin, 'Expected:', parentOrigin);
          return;
        }

        const data = event.data as any;
        if (!data || data.type !== 'walletConnectResult' || data.walletName !== walletName) return;
        
        console.log('[IframeWalletConnect] Received wallet connect result:', data);
        window.removeEventListener('message', listener);
        resolve(data);
      };

      window.addEventListener('message', listener);

      // Use targetOrigin from parent or fallback to same origin
      const targetOrigin = (window as any).__IFRAME_PARENT_ORIGIN__ || window.location.origin;
      window.parent.postMessage({ type: 'walletConnect', walletName }, targetOrigin);
    });
  };

  // Provide wallets passed from parent (if any) for initial rendering without local discovery
  ;(window as any).__IFRAME_WALLETS__ = [] as Array<{
    name: string;
    icon?: string;
    installed: boolean;
    connectable?: boolean;
  }>;
}

// The WalletPaymentContent component doesn't use DialogClose or any ui-primitives
// so we can just re-export it directly
