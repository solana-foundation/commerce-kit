'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CopyButton } from '../../../components/ui/copy-button';
import type { CheckoutStyle, Customizations, Mode } from './types';

interface CodeExampleProps {
  selectedMode: Mode;
  checkoutStyle: CheckoutStyle;
  customizations: Customizations;
}

export function CodeExample({ selectedMode, checkoutStyle, customizations }: CodeExampleProps) {

  const getCodeExample = () => {
    if (checkoutStyle === 'page') {
      return `// Page-level cart components removed for tip flow MVP
// Only modal checkout is available with tip functionality  
// Switch to Modal checkout to see the tip flow in action`;
    } else if (selectedMode === 'tip') {
      return `import { PaymentButton } from '@solana-commerce/react';

function App() {
  return (
    <PaymentButton
      config={{
        mode: 'tip',
        merchant: {
          name: '${customizations.merchantName}',
          wallet: '${customizations.walletAddress}',${customizations.merchantDescription ? `
          description: '${customizations.merchantDescription}',` : ''}
        },
        theme: {
          primaryColor: '${customizations.primaryColor}',
          secondaryColor: '${customizations.secondaryColor}',
          backgroundColor: '${customizations.backgroundColor}',
          textColor: '${customizations.textColor}',
          borderRadius: '${customizations.borderRadius}',${customizations.buttonShadow ? `
          buttonShadow: '${customizations.buttonShadow}',` : ''}${customizations.buttonBorder ? `
          buttonBorder: '${customizations.buttonBorder}',` : ''}
        },
        allowedMints: ${JSON.stringify(customizations.supportedCurrencies)},${customizations.showQR ? '' : `
        showQR: false,`}
        position: '${customizations.position}',
      }}
      onPayment={(amount, currency) => {
        console.log('Payment:', { amount, currency });
      }}
      onPaymentSuccess={(signature) => {
        console.log('Payment successful:', signature);
      }}
      onCancel={() => {
        console.log('Payment cancelled');
      }}
    />
  );
}`;
    } else if (selectedMode === 'buyNow') {
      return `import { PaymentButton } from '@solana-commerce/react';

function App() {
  return (
    <PaymentButton
      config={{
        mode: 'buyNow',
        merchant: {
          name: '${customizations.merchantName}',
          wallet: '${customizations.walletAddress}',${customizations.merchantDescription ? `
          description: '${customizations.merchantDescription}',` : ''}
        },
        theme: {
          primaryColor: '${customizations.primaryColor}',
          secondaryColor: '${customizations.secondaryColor}',
          backgroundColor: '${customizations.backgroundColor}',
          textColor: '${customizations.textColor}',
          borderRadius: '${customizations.borderRadius}',${customizations.buttonShadow ? `
          buttonShadow: '${customizations.buttonShadow}',` : ''}${customizations.buttonBorder ? `
          buttonBorder: '${customizations.buttonBorder}',` : ''}
        },
        allowedMints: ${JSON.stringify(customizations.supportedCurrencies)},${customizations.showQR ? '' : `
        showQR: false,`}
        position: '${customizations.position}',
      }}
      paymentConfig={{
        products: [
          {
            id: 'product-1',
            name: '${customizations.productName || 'Digital Product'}',
            description: '${customizations.productDescription || 'Instant delivery'}',
            price: ${customizations.productPrice || 0.1},
            quantity: 1
          }
        ]
      }}
      onPaymentSuccess={(signature) => {
        console.log('Order successful:', signature);
      }}
    />
  );
}`;
    } else if (selectedMode === 'cart') {
      return `import { PaymentButton } from '@solana-commerce/react';

function App() {
  return (
    <PaymentButton
      config={{
        mode: 'cart',
        merchant: {
          name: '${customizations.merchantName}',
          wallet: '${customizations.walletAddress}',
        },
        theme: {
          primaryColor: '${customizations.primaryColor}',
          secondaryColor: '${customizations.secondaryColor}',
        },
      }}
      paymentConfig={{
        products: [
          {
            id: 'item-1',
            name: 'Premium T-Shirt',
            price: 25.00,
            quantity: 2
          },
          {
            id: 'item-2',
            name: 'Digital Gift Card',
            price: 50.00,
            quantity: 1
          }
        ]
      }}
      onPaymentSuccess={(signature) => {
        console.log('Cart checkout successful:', signature);
      }}
    />
  );
}`;
    } else {
      return `// Select a mode to see code example`;
    }

    // Note: Simplified for tip flow MVP
  };

  return (
    <div className="">
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <CopyButton
            textToCopy={getCodeExample()}
            displayText="Copy"
            className="px-3 py-1 text-xs bg-zinc-700 text-white rounded hover:bg-zinc-800 transition-colors shadow-lg"
            showText={true}
          />
        </div>
        <SyntaxHighlighter
          language="typescript"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.4',
          }}
          codeTagProps={{
            style: {
              fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
            }
          }}
        >
          {getCodeExample()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}