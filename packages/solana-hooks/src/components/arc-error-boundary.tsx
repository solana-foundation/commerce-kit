/**
 * 🛡️ Arc Error Boundary - React Error Handling Component
 * 
 * Provides comprehensive error boundary functionality for Arc Solana applications.
 * Handles both JavaScript errors and Arc-specific blockchain errors with
 * user-friendly messages and recovery options.
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { 
  ArcError, 
  ArcErrorCode, 
  ArcErrorSeverity,
  formatErrorForUser,
  isArcError 
} from '../core/error-handler'

export interface ArcErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showErrorDetails?: boolean
  className?: string
}

interface ArcErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

/**
 * Arc Error Boundary Component
 * 
 * Catches and handles errors in the React component tree with specific
 * support for Arc blockchain errors and user-friendly error messages.
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ArcErrorBoundary
 *       onError={(error, errorInfo) => {
 *         console.error('Arc Error:', error, errorInfo)
 *         // Send to error reporting service
 *       }}
 *       showErrorDetails={process.env.NODE_ENV === 'development'}
 *     >
 *       <ArcProvider>
 *         <MyDApp />
 *       </ArcProvider>
 *     </ArcErrorBoundary>
 *   )
 * }
 * ```
 */
export class ArcErrorBoundary extends Component<ArcErrorBoundaryProps, ArcErrorBoundaryState> {
  private maxRetries = 3

  constructor(props: ArcErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ArcErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Call onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Log error for debugging
    console.error('Arc Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    const { retryCount } = this.state
    
    if (retryCount >= this.maxRetries) {
      console.warn('Max retry attempts reached')
      return
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  private renderErrorMessage(error: Error): ReactNode {
    const isArc = isArcError(error)
    const userMessage = formatErrorForUser(error)
    
    if (isArc) {
      const arcError = error as ArcError
      return this.renderArcError(arcError, userMessage)
    }
    
    return this.renderGenericError(error, userMessage)
  }

  private renderArcError(error: ArcError, userMessage: string): ReactNode {
    const { showErrorDetails } = this.props
    const { retryCount } = this.state
    const canRetry = error.isRetryable() && retryCount < this.maxRetries
    
    return (
      <div className="arc-error-boundary arc-error">
        <div className="error-header">
          <h2 className="error-title">
            {this.getErrorIcon(error.severity)} {this.getErrorTitle(error.code)}
          </h2>
        </div>
        
        <div className="error-content">
          <p className="error-message">{userMessage}</p>
          
          {error.recovery.canRecover && (
            <div className="error-recovery">
              <p className="recovery-message">{error.recovery.userMessage}</p>
            </div>
          )}
          
          {showErrorDetails && (
            <details className="error-details">
              <summary>Technical Details</summary>
              <div className="error-technical">
                <p><strong>Code:</strong> {error.code}</p>
                <p><strong>Severity:</strong> {error.severity}</p>
                <p><strong>Operation:</strong> {error.context.operation}</p>
                {error.context.address && (
                  <p><strong>Address:</strong> {error.context.address}</p>
                )}
                {error.context.signature && (
                  <p><strong>Signature:</strong> {error.context.signature}</p>
                )}
                <p><strong>Timestamp:</strong> {new Date(error.context.timestamp).toLocaleString()}</p>
                {error.originalError && (
                  <p><strong>Original Error:</strong> {error.originalError.message}</p>
                )}
              </div>
            </details>
          )}
        </div>
        
        <div className="error-actions">
          {canRetry && (
            <button 
              onClick={this.handleRetry}
              className="retry-button"
              type="button"
            >
              Retry ({this.maxRetries - retryCount} attempts left)
            </button>
          )}
          
          <button 
            onClick={this.handleReset}
            className="reset-button"
            type="button"
          >
            Reset
          </button>
        </div>
      </div>
    )
  }

  private renderGenericError(error: Error, userMessage: string): ReactNode {
    const { showErrorDetails } = this.props
    const { retryCount } = this.state
    const canRetry = retryCount < this.maxRetries
    
    return (
      <div className="arc-error-boundary generic-error">
        <div className="error-header">
          <h2 className="error-title">⚠️ Something went wrong</h2>
        </div>
        
        <div className="error-content">
          <p className="error-message">{userMessage}</p>
          
          {showErrorDetails && (
            <details className="error-details">
              <summary>Technical Details</summary>
              <div className="error-technical">
                <p><strong>Error:</strong> {error.name}</p>
                <p><strong>Message:</strong> {error.message}</p>
                {error.stack && (
                  <pre className="error-stack">{error.stack}</pre>
                )}
              </div>
            </details>
          )}
        </div>
        
        <div className="error-actions">
          {canRetry && (
            <button 
              onClick={this.handleRetry}
              className="retry-button"
              type="button"
            >
              Retry ({this.maxRetries - retryCount} attempts left)
            </button>
          )}
          
          <button 
            onClick={this.handleReset}
            className="reset-button"
            type="button"
          >
            Reset
          </button>
        </div>
      </div>
    )
  }

  private getErrorIcon(severity: ArcErrorSeverity): string {
    switch (severity) {
      case ArcErrorSeverity.LOW:
        return 'ℹ️'
      case ArcErrorSeverity.MEDIUM:
        return '⚠️'
      case ArcErrorSeverity.HIGH:
        return '❌'
      case ArcErrorSeverity.CRITICAL:
        return '🚨'
      default:
        return '⚠️'
    }
  }

  private getErrorTitle(code: ArcErrorCode): string {
    switch (code) {
      case ArcErrorCode.WALLET_NOT_CONNECTED:
        return 'Wallet Connection Required'
      case ArcErrorCode.INSUFFICIENT_FUNDS:
        return 'Insufficient Funds'
      case ArcErrorCode.NETWORK_ERROR:
        return 'Network Connection Error'
      case ArcErrorCode.RATE_LIMITED:
        return 'Rate Limit Exceeded'
      case ArcErrorCode.TRANSACTION_FAILED:
        return 'Transaction Failed'
      case ArcErrorCode.USER_REJECTED:
        return 'Transaction Cancelled'
      case ArcErrorCode.INVALID_ADDRESS:
        return 'Invalid Address'
      default:
        return 'Error Occurred'
    }
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback, className } = this.props
    
    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry)
      }
      
      // Use default error UI
      return (
        <div className={`arc-error-boundary-container ${className || ''}`}>
          {this.renderErrorMessage(error)}
        </div>
      )
    }
    
    return children
  }
}

/**
 * Default Error Fallback Component
 * 
 * A simple error fallback that can be used with React Error Boundary
 * or as a standalone component for error states.
 */
export function ArcErrorFallback({ 
  error, 
  retry, 
  showDetails = false 
}: { 
  error: Error
  retry?: () => void
  showDetails?: boolean 
}) {
  const userMessage = formatErrorForUser(error)
  const isArc = isArcError(error)
  
  return (
    <div className="arc-error-fallback">
      <div className="error-content">
        <h3>{isArc ? 'Blockchain Error' : 'Application Error'}</h3>
        <p>{userMessage}</p>
        
        {showDetails && (
          <details>
            <summary>Error Details</summary>
            <pre>{error.message}</pre>
            {error.stack && <pre>{error.stack}</pre>}
          </details>
        )}
      </div>
      
      {retry && (
        <button onClick={retry}>Try Again</button>
      )}
    </div>
  )
}

// Default styles (can be overridden by applications)
const defaultStyles = `
.arc-error-boundary {
  padding: 24px;
  border: 1px solid #e53e3e;
  border-radius: 8px;
  background: #fed7d7;
  margin: 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.arc-error-boundary.arc-error {
  border-color: #e53e3e;
  background: #fed7d7;
}

.arc-error-boundary.generic-error {
  border-color: #ed8936;
  background: #feebc8;
}

.error-header {
  margin-bottom: 16px;
}

.error-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.error-message {
  margin: 8px 0;
  color: #2d3748;
  line-height: 1.5;
}

.error-details {
  margin: 16px 0;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.error-technical {
  font-size: 14px;
  line-height: 1.4;
}

.error-technical p {
  margin: 4px 0;
}

.error-stack {
  font-size: 12px;
  background: #f7fafc;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.error-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.retry-button, .reset-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button {
  background: #4299e1;
  color: white;
}

.retry-button:hover {
  background: #3182ce;
}

.reset-button {
  background: #a0aec0;
  color: white;
}

.reset-button:hover {
  background: #718096;
}
`

// Inject default styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('arc-error-boundary-styles')) {
  const style = document.createElement('style')
  style.id = 'arc-error-boundary-styles'
  style.textContent = defaultStyles
  document.head.appendChild(style)
}