'use client';

import { Input } from '../../../components/ui/input';
import type { Mode } from './types';

interface ConfigurationInputsProps {
  mode: Mode;
  merchantName: string;
  walletAddress: string;
  imageUrl: string;
  productName: string;
  productDescription: string;
  productPrice: string;
  onMerchantNameChange: (value: string) => void;
  onWalletAddressChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onProductDescriptionChange: (value: string) => void;
  onProductPriceChange: (value: string) => void;
}

export function ConfigurationInputs({ 
  merchantName,
  walletAddress,
  imageUrl,

  onMerchantNameChange,
  onWalletAddressChange,
  onImageUrlChange,

}: ConfigurationInputsProps) {
  return (
    <div className="space-y-4 mb-8">
      {/* Common inputs for all modes */}
      <div>
        <label className="block text-sm font-medium mb-2">Merchant Name</label>
        <Input
          value={merchantName}
          onChange={(e) => onMerchantNameChange(e.target.value)}
          placeholder="Your store name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Recipient Wallet Address</label>
        <Input
          value={walletAddress}
          onChange={(e) => onWalletAddressChange(e.target.value)}
          placeholder="Your Solana wallet address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Logo/Image URL</label>
        <Input
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>

      {/* Note: Product inputs removed for tip flow MVP */}
    </div>
  );
}