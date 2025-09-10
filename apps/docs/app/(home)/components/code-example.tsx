'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { Mode, CheckoutStyle, Customizations } from './types';
import { CopyButton } from '../../../components/ui/copy-button';

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
      return `import { PaymentButton } from '@solana-commerce/react-sdk';

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
    } else {
      return `// Cart modes removed for tip flow MVP
// Only tip mode is available in this version`;
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