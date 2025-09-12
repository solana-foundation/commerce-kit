import React from 'react'
import type { ThemeConfig, MerchantConfig, Currency } from '../../types'
import { TokenIcon, SuccessIcon } from '../icons'

interface TransactionSuccessProps {
  theme: Required<ThemeConfig>
  config: { merchant: MerchantConfig; rpcUrl?: string }
  selectedCurrency: Currency
  displayAmount?: string
  amount?: number
  currency?: Currency
  signature?: string
  recipient?: string
  onClose?: () => void
  onViewTransaction?: (signature: string) => void
}

export function TransactionSuccess({
  theme,
  config,
  selectedCurrency,
  displayAmount,
  amount,
  currency = selectedCurrency,
  signature,
  recipient,
  onClose,
  onViewTransaction,
}: TransactionSuccessProps) {
  const explorerUrl = signature 
    ? `https://explorer.solana.com/tx/${signature}${config.rpcUrl?.includes('devnet') ? '?cluster=devnet' : ''}`
    : null

  // Format address/signature for display (first 4 + ... + last 4)
  const formatAddress = (address: string): string => {
    if (!address || address.length <= 10) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="ck-transaction-success ck-transaction-success-container" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      {/* Success Checkmark */}
      <div className="ck-transaction-success-icon">
        <SuccessIcon size={32} color="#10b981" />
      </div>
      
      {/* Success Message with Token */}
      <div className="ck-transaction-success-content">
        <div>
            <div className="ck-transaction-success-title" style={{ color: theme.textColor }}>
              Successfully sent
            </div>
            <div className="ck-transaction-success-message" style={{ color: theme.textColor }}>
            {config.merchant.name} has received your
            <div className="ck-transaction-token-info">
                {amount !== undefined ? `${amount} ${currency || selectedCurrency}` : `${displayAmount} in ${selectedCurrency}`}
            </div>
            {recipient && (
              <div>to {formatAddress(recipient)}</div>
            )}
            {signature && (
              <div>Transaction: {formatAddress(signature)}</div>
            )}            
        </div>
        </div>
        
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ck-transaction-explorer-link"
            style={{ color: theme.textColor }}
            onClick={() => onViewTransaction?.(signature!)}
          >
            See Transaction
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.52575 1.1665H5.83317C6.15534 1.1665 6.4165 1.42767 6.4165 1.74984C6.4165 2.072 6.15534 2.33317 5.83317 2.33317H4.54984C4.05017 2.33317 3.7105 2.33363 3.44794 2.35508C3.1922 2.37597 3.06142 2.41384 2.97018 2.46033C2.75066 2.57218 2.57218 2.75066 2.46033 2.97018C2.41384 3.06142 2.37597 3.1922 2.35508 3.44794C2.33362 3.7105 2.33317 4.05017 2.33317 4.54984V9.44984C2.33317 9.94951 2.33362 10.2892 2.35508 10.5517C2.37597 10.8075 2.41384 10.9383 2.46033 11.0295C2.57218 11.249 2.75066 11.4275 2.97018 11.5393C3.06142 11.5858 3.1922 11.6237 3.44794 11.6446C3.7105 11.666 4.05017 11.6665 4.54984 11.6665H9.44984C9.94951 11.6665 10.2892 11.666 10.5517 11.6446C10.8075 11.6237 10.9383 11.5858 11.0295 11.5393C11.249 11.4275 11.4275 11.249 11.5393 11.0295C11.5858 10.9383 11.6237 10.8075 11.6446 10.5517C11.666 10.2892 11.6665 9.94951 11.6665 9.44984V8.1665C11.6665 7.84434 11.9277 7.58317 12.2498 7.58317C12.572 7.58317 12.8332 7.84434 12.8332 8.1665V9.47394C12.8332 9.9435 12.8332 10.331 12.8074 10.6467C12.7806 10.9746 12.7231 11.276 12.5789 11.5591C12.3551 11.9982 11.9982 12.3551 11.5591 12.5789C11.276 12.7231 10.9746 12.7806 10.6467 12.8074C10.331 12.8332 9.9435 12.8332 9.47394 12.8332H4.52573C4.05617 12.8332 3.66863 12.8332 3.35294 12.8074C3.02505 12.7806 2.72364 12.7231 2.44053 12.5789C2.00148 12.3551 1.64453 11.9982 1.42082 11.5591C1.27657 11.276 1.21907 10.9746 1.19228 10.6467C1.16649 10.331 1.1665 9.9435 1.1665 9.47394V4.52575C1.1665 4.05618 1.16649 3.66863 1.19228 3.35294C1.21907 3.02505 1.27657 2.72364 1.42082 2.44053C1.64453 2.00148 2.00148 1.64453 2.44053 1.42082C2.72364 1.27657 3.02505 1.21907 3.35294 1.19228C3.66863 1.16649 4.05618 1.1665 4.52575 1.1665Z" fill="currentColor" fillOpacity="0.72"/>
              <path d="M8.1665 1.74984C8.1665 1.42767 8.42767 1.1665 8.74984 1.1665H12.2498C12.572 1.1665 12.8332 1.42767 12.8332 1.74984L12.8332 5.24984C12.8332 5.572 12.572 5.83317 12.2498 5.83317C11.9277 5.83317 11.6665 5.572 11.6665 5.24984L11.6665 3.15813L7.41232 7.41232C7.18451 7.64012 6.81516 7.64012 6.58736 7.41232C6.35955 7.18451 6.35955 6.81516 6.58736 6.58736L10.8415 2.33317H8.74984C8.42767 2.33317 8.1665 2.072 8.1665 1.74984Z" fill="currentColor" fillOpacity="0.72"/>
            </svg>
          </a>
        )}
        
        <button
          type="button"
          onClick={onClose}
          className="ck-transaction-close-button"
          style={{ color: theme.textColor }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

TransactionSuccess.displayName = 'TransactionSuccess'
