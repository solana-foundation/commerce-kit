'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { 
  ArcError,
  createNetworkError,
  type ArcErrorContext
} from '../core/error-handler'
import type { Address } from '@solana/kit'

type PrioritizationFee = Readonly<{
  slot: bigint
  prioritizationFee: bigint
}>

export interface UseRecentPrioritizationFeesOptions {
  addresses?: Address[]
  refreshInterval?: number
  enabled?: boolean
}

export interface UseRecentPrioritizationFeesReturn {
  fees: readonly PrioritizationFee[] | null
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
  clear: () => void
}

export function useRecentPrioritizationFees(
  options: UseRecentPrioritizationFeesOptions = {}
): UseRecentPrioritizationFeesReturn {
  const { network } = useArcClient()
  
  const {
    addresses = [],
    refreshInterval,
    enabled = true,
  } = options

  const query = useQuery<readonly PrioritizationFee[], ArcError>({
    networkMode: "offlineFirst",
    queryKey: ['recentPrioritizationFees', network.rpcUrl, addresses],
    queryFn: async ({ signal }) => {
      const context: ArcErrorContext = {
        operation: 'getRecentPrioritizationFees',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      try {
        const transport = (useArcClient() as any).config.transport as Transport
        const result: any = await transport.request(
          { method: 'getRecentPrioritizationFees', params: [addresses] },
          { signal }
        )
        return result as readonly PrioritizationFee[]
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch recent prioritization fees: ${errorMessage}`,
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

  const clear = useCallback(() => {
    query.refetch()
  }, [query])

  return {
    fees: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
    clear,
  }
}
