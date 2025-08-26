'use client'

import { useQuery } from '@tanstack/react-query'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { 
  ArcError,
  createNetworkError,
  type ArcErrorContext
} from '../core/error-handler'
import type { Blockhash } from '@solana/rpc-types'

export interface UseLatestBlockhashOptions {
  refreshInterval?: number
  enabled?: boolean
}

export interface UseLatestBlockhashReturn {
  blockhash: Blockhash | null
  lastValidBlockHeight: bigint | null
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
}

export function useLatestBlockhash(options: UseLatestBlockhashOptions = {}): UseLatestBlockhashReturn {
  const { network } = useArcClient()
  
  const {
    refreshInterval = 10000,
    enabled = true,
  } = options

  const query = useQuery<{ blockhash: Blockhash; lastValidBlockHeight: bigint }, ArcError>({
    networkMode: "offlineFirst",
    queryKey: ['latestBlockhash', network.rpcUrl],
    queryFn: async ({ signal }) => {
      const context: ArcErrorContext = {
        operation: 'getLatestBlockhash',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      try {
        const transport = (useArcClient() as any).config.transport as Transport
        const response: any = await transport.request(
          { method: 'getLatestBlockhash', params: [] },
          { signal }
        )
        return response?.value
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch latest blockhash: ${errorMessage}`,
          context,
          error as Error
        )
      }
    },
    enabled: enabled,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
  })

  return {
    blockhash: query.data?.blockhash ?? null,
    lastValidBlockHeight: query.data?.lastValidBlockHeight ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}
