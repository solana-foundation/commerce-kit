'use client'

import { useQuery } from '@tanstack/react-query'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { 
  ArcError,
  createNetworkError,
  type ArcErrorContext
} from '../core/error-handler'

export interface UseSlotOptions {
  refreshInterval?: number
  enabled?: boolean
}

export interface UseSlotReturn {
  slot: bigint | null
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
}

export function useSlot(options: UseSlotOptions = {}): UseSlotReturn {
  const { network } = useArcClient()
  
  const {
    refreshInterval = 10000, // Default to 10 seconds
    enabled = true,
  } = options

  const query = useQuery<bigint, ArcError>({
    networkMode: "offlineFirst",
    queryKey: ['slot', network.rpcUrl],
    queryFn: async ({ signal }): Promise<bigint> => {
      const context: ArcErrorContext = {
        operation: 'getSlot',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      try {
        const transport = (useArcClient() as any).config.transport as Transport
        const result: any = await transport.request(
          { method: 'getSlot', params: [] },
          { signal }
        )
        return typeof result === 'bigint' ? result : BigInt(result ?? 0)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch slot: ${errorMessage}`,
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
    slot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}
