'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { OrderItem } from '@solana-commerce/headless-sdk';
import type { Mode, CheckoutStyle, Customizations } from './types';
import { CopyButton } from '../../../components/ui/copy-button';

interface CartItem extends OrderItem {
  quantity: number;
}

interface CodeExampleProps {
  selectedMode: Mode;
  checkoutStyle: CheckoutStyle;
  customizations: Customizations;
}

export function CodeExample({ selectedMode, checkoutStyle, customizations }: CodeExampleProps) {
  
  const getCartItems = (): CartItem[] => {
    // Use customizations for cart items
    return [{
      id: 'product-1',
      name: customizations.productName,
      description: customizations.productDescription,
      price: Number(customizations.productPrice),
      currency: 'USDC',
      quantity: 1,
      ...(customizations.imageUrl && { image: customizations.imageUrl })
    }];
  };

  const getCodeExample = () => {
    if (checkoutStyle === 'page') {
      if (selectedMode === 'buyNow') {
        return `import { SingleItemCart } from '@solana-commerce/react-sdk';

function App() {
  return (
    <SingleItemCart
      products={[{
        id: 'product-1',
        name: '${customizations.productName}',
        description: '${customizations.productDescription}',
        price: ${customizations.productPrice},
        currency: 'USDC'${customizations.imageUrl ? `,\n        image: '${customizations.imageUrl}'` : ''}
      }]}
      merchant={{
        name: '${customizations.merchantName}',
        wallet: '${customizations.walletAddress}'${customizations.merchantDescription ? `,\n        description: '${customizations.merchantDescription}'` : ''}
      }}
      theme={{
        primaryColor: '${customizations.primaryColor}',
        secondaryColor: '${customizations.secondaryColor}',
        backgroundColor: '${customizations.backgroundColor}',
        textColor: '${customizations.textColor}',
        borderRadius: '${customizations.borderRadius}',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      allowedMints={${JSON.stringify(customizations.supportedCurrencies)}}
      defaultCurrency="${customizations.supportedCurrencies[0]}"
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
        name: '${customizations.merchantName}',
        wallet: '${customizations.walletAddress}'${customizations.merchantDescription ? `,\n        description: '${customizations.merchantDescription}'` : ''}
      }}
      theme={{
        primaryColor: '${customizations.primaryColor}',
        secondaryColor: '${customizations.secondaryColor}',
        backgroundColor: '${customizations.backgroundColor}',
        textColor: '${customizations.textColor}',
        borderRadius: '${customizations.borderRadius}',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      allowedMints={${JSON.stringify(customizations.supportedCurrencies)}}
      defaultCurrency="${customizations.supportedCurrencies[0]}"
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
    const products = selectedMode === 'tip' ? [] : [{
      id: 'product-1',
      name: customizations.productName,
      description: customizations.productDescription,
      price: Number(customizations.productPrice),
      currency: 'USDC',
      ...(customizations.imageUrl && { image: customizations.imageUrl })
    }];

    return `import { SolanaCommerceSDK } from '@solana-commerce/react-sdk';

function App() {
  return (
    <SolanaCommerceSDK
      config={{
        mode: '${selectedMode}',
        position: '${customizations.position}',
        buttonVariant: '${customizations.buttonVariant}',
        merchant: {
          name: '${customizations.merchantName}',
          wallet: '${customizations.walletAddress}'${customizations.merchantDescription ? `,\n          description: '${customizations.merchantDescription}'` : ''}
        },
        theme: {
          primaryColor: '${customizations.primaryColor}',
          secondaryColor: '${customizations.secondaryColor}',
          backgroundColor: '${customizations.backgroundColor}',
          textColor: '${customizations.textColor}',
          borderRadius: '${customizations.borderRadius}',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        },
        products: ${JSON.stringify(products, null, 8).replace(/\n/g, '\n        ')},
        allowedMints: ${JSON.stringify(customizations.supportedCurrencies)},
        network: 'mainnet-beta',
        showQR: ${customizations.showQR},
        enableWalletConnect: true,
        showProductDetails: ${customizations.showProductDetails},
        showMerchantInfo: ${customizations.showMerchantInfo},
        allowCustomAmount: ${customizations.allowCustomAmount}
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