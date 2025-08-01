'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { OrderItem } from '@solana-commerce/headless-sdk';
import type { Mode, CheckoutStyle, Customizations, DemoConfig } from './types';
import { CopyButton } from '../../../components/ui/copy-button';

interface CodeExampleProps {
  selectedMode: Mode;
  checkoutStyle: CheckoutStyle;
  customizations: Customizations;
  config: DemoConfig;
  demoProducts: OrderItem[];
}

export function CodeExample({ selectedMode, checkoutStyle, customizations, config, demoProducts }: CodeExampleProps) {
  
  const getCartItems = (): OrderItem[] => {
    return demoProducts.map(product => ({
      ...product,
      quantity: 1
    }));
  };

  const getCodeExample = () => {
    if (checkoutStyle === 'page') {
      if (selectedMode === 'buyNow') {
        return `import { SingleItemCart } from '@solana-commerce/react-sdk';

function App() {
  return (
    <SingleItemCart
      products={[{
        id: '${config.products[0].id}',
        name: '${config.products[0].name}',
        description: '${config.products[0].description}',
        price: ${config.products[0].price},
        currency: '${config.products[0].currency}'${config.products[0].image ? `,\n        image: '${config.products[0].image}'` : ''}
      }]}
      merchant={{
        name: '${config.merchant.name}',
        wallet: '${config.merchant.wallet}'${config.merchant.description ? `,\n        description: '${config.merchant.description}'` : ''}
      }}
      theme={{
        primaryColor: '${config.theme.primaryColor}',
        secondaryColor: '${config.theme.secondaryColor}',
        backgroundColor: '${config.theme.backgroundColor}',
        textColor: '${config.theme.textColor}',
        borderRadius: '${config.theme.borderRadius}',
        fontFamily: '${config.theme.fontFamily || 'system-ui, -apple-system, sans-serif'}'
      }}
      allowedMints={${JSON.stringify(config.allowedMints)}}
      defaultCurrency="${config.allowedMints[0]}"
      showTransactionFee={true}
      onPayment={(amount, currency, paymentMethod, formData) => {
        console.log('Payment:', { amount, currency, paymentMethod, formData });
      }}
      onCancel={() => {
        console.log('Payment cancelled');
      }}
      onEmailChange={(email) => {
        console.log('Email updated:', email);
      }}
    />
  );
}`;
      } else if (selectedMode === 'cart') {
        return `import { MultiItemCart, type CartItem } from '@solana-commerce/react-sdk';

const cartItems: CartItem[] = ${JSON.stringify(getCartItems(), null, 2)};

function App() {
  return (
    <MultiItemCart
      initialItems={cartItems}
      merchant={{
        name: '${config.merchant.name}',
        wallet: '${config.merchant.wallet}'${config.merchant.description ? `,\n        description: '${config.merchant.description}'` : ''}
      }}
      theme={{
        primaryColor: '${config.theme.primaryColor}',
        secondaryColor: '${config.theme.secondaryColor}',
        backgroundColor: '${config.theme.backgroundColor}',
        textColor: '${config.theme.textColor}',
        borderRadius: '${config.theme.borderRadius}',
        fontFamily: '${config.theme.fontFamily || 'system-ui, -apple-system, sans-serif'}'
      }}
      allowedMints={${JSON.stringify(config.allowedMints)}}
      defaultCurrency="${config.allowedMints[0]}"
      showTransactionFee={true}
      enableItemEditing={true}
      maxQuantityPerItem={10}
      onPayment={(amount, currency, paymentMethod, formData) => {
        console.log('Payment:', { amount, currency, paymentMethod, formData });
      }}
      onCancel={() => {
        console.log('Payment cancelled');
      }}
      onEmailChange={(email) => {
        console.log('Email updated:', email);
      }}
      onItemQuantityChange={(itemId, newQuantity) => {
        console.log('Quantity changed:', { itemId, newQuantity });
      }}
      onItemRemove={(itemId) => {
        console.log('Item removed:', itemId);
      }}
    />
  );
}`;
      } else {
        return `// Tip mode is only available with modal checkout
// Page checkout uses SingleItemCart or MultiItemCart components
// Switch to Modal checkout to see tip functionality`;
      }
    }
    
    // Modal code example (existing)
    return `import { SolanaCommerceSDK } from '@solana-commerce/react-sdk';

function App() {
  return (
    <SolanaCommerceSDK
      config={{
        mode: '${config.mode}',
        position: '${customizations.position}',
        merchant: {
          name: '${config.merchant.name}',
          wallet: '${config.merchant.wallet}'${config.merchant.description ? `,\n          description: '${config.merchant.description}'` : ''}
        },
        theme: {
          primaryColor: '${config.theme.primaryColor}',
          secondaryColor: '${config.theme.secondaryColor}',
          backgroundColor: '${config.theme.backgroundColor}',
          textColor: '${config.theme.textColor}',
          borderRadius: '${config.theme.borderRadius}',
          fontFamily: '${config.theme.fontFamily || 'system-ui, -apple-system, sans-serif'}'
        },
        products: ${JSON.stringify(config.products, null, 8).replace(/\n/g, '\n        ')},
        allowedMints: ${JSON.stringify(config.allowedMints)},
        network: 'mainnet-beta',
        showQR: ${config.showQR},
        enableWalletConnect: true,
        showProductDetails: ${config.showProductDetails},
        showMerchantInfo: ${config.showMerchantInfo}
      }}
      onPayment={(amount, currency, products, paymentMethod) => {
        console.log('Payment:', { amount, currency, products, paymentMethod });
      }}
      onSuccess={(signature, orderId) => {
        console.log('Payment successful:', { signature, orderId });
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
      onClose={() => {
        console.log('Modal closed');
      }}
    />
  );
}`;
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