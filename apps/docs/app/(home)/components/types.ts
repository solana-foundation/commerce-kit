import { OrderItem } from "@solana-commerce/headless-sdk";

export interface Customizations {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  buttonVariant: 'default' | 'icon-only';
  showQR: boolean;
  showProductDetails: boolean;
  showMerchantInfo: boolean;
  allowCustomAmount: boolean;
  position: string;
  supportedCurrencies: string[];
  merchantName: string;
  merchantDescription: string;
  walletAddress: string;
  imageUrl: string;
  productName: string;
  productDescription: string;
  productPrice: string;
}

export type Mode = 'tip' | 'buyNow' | 'cart';
export type CheckoutStyle = 'modal' | 'page';

export interface ColorPreset {
  name: string;
  value: string;
}

export interface Option {
  name: string;
  value: string;
}

export interface DemoConfig {
  mode: Mode;
  merchant: {
    name: string;
    wallet: string;
    description: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    fontFamily?: string;
  };
  showQR: boolean;
  showProductDetails: boolean;
  showMerchantInfo: boolean;
  position: 'overlay' | 'inline';
  allowedMints: string[];
  products: OrderItem[];
}