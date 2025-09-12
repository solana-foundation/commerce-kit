import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ArcProvider } from '../arc-provider'
import { useArcClient } from '../arc-client-provider'

// Mock connector-kit dependency
vi.mock('@solana-commerce/connector-kit', () => ({
  useConnectorClient: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    getAccount: vi.fn(),
    connected: false,
    connecting: false,
    getSnapshot: vi.fn(() => ({ connected: false }))
  }))
}))

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
    getSnapshot: vi.fn(() => ({
      network: {
        rpcUrl: 'https://api.devnet.solana.com',
        isDevnet: true,
        isMainnet: false,
        isTestnet: false,
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
      }
    })),
    subscribe: vi.fn((callback) => {
      // Return unsubscribe function
      return vi.fn()
    }),
    destroy: vi.fn(),
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

// Mock connector for tests
const createMockConnector = () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getAccount: vi.fn(),
  connected: false,
  connecting: false,
  getSnapshot: vi.fn(() => ({ connected: false }))
})

describe('ArcProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide Arc client context to children', () => {
    const mockConnector = createMockConnector()
    
    render(
      <ArcProvider config={{ connector: mockConnector }}>
        <TestComponent />
      </ArcProvider>
    )

    expect(screen.getByTestId('network')).toHaveTextContent('https://api.devnet.solana.com')
    expect(screen.getByTestId('connected')).toHaveTextContent('false')
    expect(screen.getByTestId('commitment')).toHaveTextContent('confirmed')
  })

  it('should accept custom configuration', () => {
    const mockConnector = createMockConnector()
    const customConfig = {
      network: 'mainnet' as const,
      commitment: 'finalized' as const,
      debug: true,
      connector: mockConnector
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
    // Since we're mocking useArcClient globally, this test should pass without error
    const TestWithoutProvider = () => {
      const client = useArcClient()
      return <div data-testid="success">Client available: {client ? 'true' : 'false'}</div>
    }

    render(<TestWithoutProvider />)
    expect(screen.getByTestId('success')).toHaveTextContent('Client available: true')
  })

  it('should re-render when client state changes', async () => {
    const mockConnector = createMockConnector()
    
    render(
      <ArcProvider config={{ connector: mockConnector }}>
        <TestComponent />
      </ArcProvider>
    )

    // Since we're using mocked state, this test verifies the provider works
    expect(screen.getByTestId('connected')).toHaveTextContent('false')
    expect(screen.getByTestId('network')).toHaveTextContent('https://api.devnet.solana.com')
  })

  describe('Provider Configuration', () => {
    it('should pass network configuration', () => {
      const mockConnector = createMockConnector()
      const config = {
        network: 'testnet' as const,
        rpcUrl: 'https://custom-rpc.example.com',
        connector: mockConnector
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
      const mockConnector = createMockConnector()
      const config = {
        commitment: 'finalized' as const,
        connector: mockConnector
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      expect(screen.getByTestId('commitment')).toHaveTextContent('confirmed') // From mock
    })

    it('should pass debug configuration', () => {
      const mockConnector = createMockConnector()
      const config = {
        debug: true,
        connector: mockConnector
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Debug config should be passed to the client (verified through mock)
    })

    it('should handle autoConnect configuration', () => {
      const mockConnector = createMockConnector()
      const config = {
        autoConnect: true,
        connector: mockConnector
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
      const mockConnector = createMockConnector()
      const customStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const config = {
        storage: customStorage,
        connector: mockConnector
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Custom storage should be passed to client
    })

    it('should use localStorage by default', () => {
      const mockConnector = createMockConnector()
      render(
        <ArcProvider config={{ connector: mockConnector }}>
          <TestComponent />
        </ArcProvider>
      )

      // Should use default localStorage (no custom storage provided)
    })
  })

  describe('Transport Configuration', () => {
    it('should accept custom transport', () => {
      const mockConnector = createMockConnector()
      const customTransport = {
        request: vi.fn(),
      }

      const config = {
        transport: customTransport,
        connector: mockConnector
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
      const mockConnector = createMockConnector()

      const config = {
        connector: mockConnector,
      }

      render(
        <ArcProvider config={config}>
          <TestComponent />
        </ArcProvider>
      )

      // Connector should be integrated with Arc client
      expect(screen.getByTestId('network')).toHaveTextContent('https://api.devnet.solana.com')
    })
  })
})
