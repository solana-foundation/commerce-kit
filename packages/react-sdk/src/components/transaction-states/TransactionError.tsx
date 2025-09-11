import React from 'react'
import type { ThemeConfig, MerchantConfig, Currency } from '../../types'
import { TokenIcon, ErrorIcon } from '../icons'

interface TransactionErrorProps {
  theme: Required<ThemeConfig>
  config: { merchant: MerchantConfig; rpcUrl?: string }
  selectedCurrency: Currency
  displayAmount: string
  onRetry: () => void
}

export function TransactionError({
  theme,
  config,
  selectedCurrency,
  displayAmount,
  onRetry,
}: TransactionErrorProps) {
  return (
    <div className="ck-transaction-error-container">
      {/* Error Icon */}
      <div className="ck-transaction-error-icon">
        <ErrorIcon size={32} />
      </div>
      
      {/* Error Message with Token */}
      <div className="ck-transaction-error-content">
        <div className="ck-transaction-error-message" style={{ color: theme.textColor }}>
          Failed to send 
          <div className="ck-transaction-token-info">
            ${displayAmount} in <TokenIcon symbol={selectedCurrency} size={20} />{selectedCurrency}
          </div>
          to {config.merchant.name || 'Merchant'}
        </div>
        
        <button
          onClick={onRetry}
          className="ck-transaction-try-again-button"
          style={{ color: theme.textColor }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

TransactionError.displayName = 'TransactionError'
