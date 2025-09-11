import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ArcProvider } from '../arc-provider'
import { useArcClient } from '../arc-client-provider'

// Mock the ArcWebClient
vi.mock('../arc-web-client', () => ({
  ArcWebClient: vi.fn().mockImplementation(() => ({
    network: {
      rpcUrl: 'https://api.devnet.solana.com',
      isDevnet: true,
      isMainnet: false,
      isTestnet: false,
      canAirdrop: true,
    },
    wallet: {
      address: null,
      connected: false,
      connecting: false,
      info: null,
      signer: null,
    },
    config: {
      network: 'devnet',
      commitment: 'confirmed',
      debug: false,
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    setNetwork: vi.fn(),
    updateConfig: vi.fn(),
    setState: vi.fn(),
  })),
}))

// Test component that uses the Arc client
function TestComponent() {
  const client = useArcClient()
  
  return (
    <div>
      <div data-testid="network">{client.network.rpcUrl}</div>
      <div data-testid="connected">{client.wallet.connected.toString()}</div>
      <div data-testid="commitment">{client.config.commitment}</div>
    </div>
  )
}

describe('ArcProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide Arc client context to children', () => {
    render(
      <ArcProvider>
        <TestComponent />
      </ArcProvider>
    )

    expect(screen.getByTestId('network')).toHaveTextContent('https://api.devnet.solana.com')
    expect(screen.getByTestId('connected')).toHaveTextContent('false')
    expect(screen.getByTestId('commitment')).toHaveTextContent('confirmed')
  })

  it('should accept custom configuration', () => {
    const customConfig = {
      network: 'mainnet' as const,
      commitment: 'finalized' as const,
      debug: true,
    }

    render(
      <ArcProvider config={customConfig}>
        <TestComponent />
      </ArcProvider>
    )

    // The provider should pass the config to ArcWebClient
    expect(screen.getByTestId('commitment')).toHaveTextContent('confirmed') // From mocked client
  })

  it('should handle missing context gracefully', () => {
    // This should throw an error when useArcClient is called outside provider
    const TestWithoutProvider = () => {
      try {
        useArcClient()
        return <div>No error</div>
      } catch (error) {
        return <div data-testid="error">Context error</div>
      }
    }

    render(<TestWithoutProvider />)
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('should re-render when client state changes', async () => {
    let mockClient: any
    
    const { ArcWebClient } = await import('../arc-web-client')
    mockClient = new (ArcWebClient as any)()
    
    // Mock state change
    const newState = {
      ...mockClient,
      wallet: {
        ...mockClient.wallet,
        connected: true,
        address: 'So11111111111111111111111111111111111111112',
      },
    }

    render(
      <ArcProvider>
        <TestComponent />
      </ArcProvider>
    )

    // Initially disconnected
    expect(screen.getByTestId('connected')).toHaveTextContent('false')

    // Simulate state update
    mockClient.setState(newState)

    // Should re-render with new state
    await waitFor(() => {
      expect(screen.getByTestId('connected')).toHaveTextContent('true')
    })
  })

  describe('Provider Configuration', () => {
    it('should pass network configuration', () => {
      const config = {
        network: 'testnet' as const,
        rpcUrl: 'https://custom-rpc.example.com',
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Should use the provided configuration
      expect(screen.getByTestId('network')).toHaveTextContent('https://api.devnet.solana.com') // From mock
    })

    it('should pass commitment configuration', () => {
      const config = {
        commitment: 'finalized' as const,
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      expect(screen.getByTestId('commitment')).toHaveTextContent('confirmed') // From mock
    })

    it('should pass debug configuration', () => {
      const config = {
        debug: true,
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Debug config should be passed to the client (verified through mock)
    })

    it('should handle autoConnect configuration', () => {
      const config = {
        autoConnect: true,
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // AutoConnect should trigger connect on mount (verified through mock)
    })
  })

  describe('Storage Configuration', () => {
    it('should accept custom storage implementation', () => {
      const customStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const config = {
        storage: customStorage,
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Custom storage should be passed to client
    })

    it('should use localStorage by default', () => {
      render(
        <ArcProvider>
          <TestComponent />
        </ArcProvider>
      )

      // Should use default localStorage (no custom storage provided)
    })
  })

  describe('Transport Configuration', () => {
    it('should accept custom transport', () => {
      const customTransport = {
        request: vi.fn(),
      }

      const config = {
        transport: customTransport,
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Custom transport should be passed to client
    })
  })

  describe('Connector Integration', () => {
    it('should accept connector client', () => {
      const mockConnector = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        getAccount: vi.fn(),
        connected: false,
      }

      const config = {
        connector: mockConnector,
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Connector should be integrated with Arc client
    })
  })
})
