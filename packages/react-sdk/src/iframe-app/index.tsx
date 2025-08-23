import React from 'react';
import ReactDOM from 'react-dom/client';
import type { SolanaCommerceConfig, ThemeConfig } from '../types';

// Import and setup dialog shims before importing modal components
import * as DialogShim from './dialog-shim';

// Monkey patch the module system to intercept ui-primitives imports
if (typeof window !== 'undefined') {
  (window as any).__UI_PRIMITIVES_SHIM__ = DialogShim;
}

// Now import the iframe-safe modal components
import { IframeTipModalContent } from '../components/iframe/iframe-tip-modal';
import { PaymentModalContent } from '../components/ui/payment-modal-content';
import '../styles/index.css';
import { getBorderRadius, getModalBorderRadius, getButtonShadow, getButtonBorder } from '../utils';

// Global types for the iframe window
declare global {
  interface Window {
    parentOrigin?: string;
  }
}

// Message types
interface InitMessage {
  type: 'init';
  config: SolanaCommerceConfig;
  theme: Required<ThemeConfig>;
  totalAmount?: number;
  paymentUrl?: string;
  wallets?: Array<{ name: string; icon?: string; installed: boolean; connectable?: boolean }>
}

interface OutgoingMessage {
  type: 'resize' | 'close' | 'payment' | 'paymentStart' | 'paymentSuccess' | 'paymentError';
  height?: number;
  amount?: number;
  currency?: string;
  products?: any[];
  signature?: string;
  error?: string;
}

// Helper to send messages to parent
function sendToParent(message: OutgoingMessage) {
  const targetOrigin = (window as any).__IFRAME_PARENT_ORIGIN__ || '*';
  window.parent.postMessage(message, targetOrigin);
}

// Main app component
function IframeApp({ config, theme, totalAmount, paymentUrl }: { 
  config: SolanaCommerceConfig; 
  theme: Required<ThemeConfig>;
  totalAmount?: number;
  paymentUrl?: string;
}) {
  // Handlers that communicate with parent
  const handlePayment = React.useCallback((amount: number, currency: string, products?: any[]) => {
    sendToParent({ 
      type: 'payment', 
      amount, 
      currency, 
      products 
    });
  }, []);

  const handleTipPayment = React.useCallback((amount: number, currency: string, paymentMethod: any) => {
    sendToParent({ 
      type: 'payment', 
      amount, 
      currency, 
      products: [{ id: 'tip', name: 'Tip', price: amount, currency }] 
    });
  }, []);

  const handleCancel = React.useCallback(() => {
    sendToParent({ type: 'close' });
  }, []);

  // Render appropriate modal content
  if (config.mode === 'tip') {
    return (
      <IframeTipModalContent
        config={config}
        theme={theme}
        onPayment={handleTipPayment}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <PaymentModalContent
      config={config}
      theme={theme}
      totalAmount={totalAmount || 0}
      paymentUrl={paymentUrl || ''}
      onPayment={() => handlePayment(totalAmount || 0, config.allowedMints?.[0] || 'SOL', config.products ? [...config.products] : undefined)}
      onCancel={handleCancel}
    />
  );
}

// Initialize the app
function init() {
  let root: ReactDOM.Root | null = null;

  function applyThemeCSSVars(theme: Required<ThemeConfig>) {
    const rootEl = document.documentElement;
    rootEl.style.setProperty('--primary-color', theme.primaryColor);
    rootEl.style.setProperty('--secondary-color', theme.secondaryColor);
    rootEl.style.setProperty('--background-color', theme.backgroundColor);
    rootEl.style.setProperty('--text-color', theme.textColor);
    // derived vars
    rootEl.style.setProperty('--border-radius', getBorderRadius(theme.borderRadius));
    rootEl.style.setProperty('--modal-border-radius', getModalBorderRadius(theme.borderRadius));
    rootEl.style.setProperty('--font-family', theme.fontFamily);
    rootEl.style.setProperty('--button-shadow', getButtonShadow(theme.buttonShadow));
    rootEl.style.setProperty('--button-border', getButtonBorder(theme));
  }

  // Add error handler
  window.addEventListener('error', (event) => {
    console.error('[IframeApp] Error:', event.error);
    sendToParent({ 
      type: 'paymentError' as any, 
      error: event.error?.message || 'Unknown error' 
    });
  });

  // Listen for messages from parent
  window.addEventListener('message', (event) => {
    // Validate origin if needed
    if (event.source !== window.parent) return;

    const message = event.data as InitMessage;
    
    if (message.type === 'init') {
      console.log('[IframeApp] Received init message', message);
      // Store parent origin for secure messaging
      (window as any).__IFRAME_PARENT_ORIGIN__ = event.origin || '*';

      // Mount the app
      const rootElement = document.getElementById('root');
      if (!rootElement) return;

      if (!root) {
        root = ReactDOM.createRoot(rootElement);
      }

      try {
        // Apply theme CSS variables before rendering
        applyThemeCSSVars(message.theme);
        // Provide parent-provided wallets to window for consumers inside iframe
        if (Array.isArray((message as any).wallets)) {
          (window as any).__IFRAME_WALLETS__ = (message as any).wallets
        }
        root.render(
          <React.StrictMode>
            <DialogShim.DialogProvider>
              <IframeApp 
                config={message.config}
                theme={message.theme}
                totalAmount={message.totalAmount}
                paymentUrl={message.paymentUrl}
              />
            </DialogShim.DialogProvider>
          </React.StrictMode>
        );
      } catch (error) {
        console.error('[IframeApp] Failed to render:', error);
        // Try to render a fallback UI
        root.render(
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>Error loading payment modal</h3>
            <p>Please refresh and try again</p>
            <pre style={{ fontSize: '12px', textAlign: 'left' }}>{error?.toString()}</pre>
          </div>
        );
      }

      // Set up resize observer
      const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
          const height = entry.contentRect.height;
          sendToParent({ type: 'resize', height });
        }
      });
      resizeObserver.observe(rootElement);

      // Set up escape key handler
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          sendToParent({ type: 'close' });
        }
      };
      document.addEventListener('keydown', handleKeydown);

      // Focus the modal for keyboard accessibility
      const focusableElement = rootElement.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElement?.focus();
    }
  });

  // Signal ready to parent
  window.parent.postMessage({ type: 'ready' }, '*');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
