'use client'

import { useQuery } from '@tanstack/react-query'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { queryKeys } from '../utils/query-keys'
import { 
  ArcError,
  createNetworkError,
  type ArcErrorContext
} from '../core/error-handler'

export interface UseBlockHeightOptions {
  refreshInterval?: number
  enabled?: boolean
  commitment?: 'processed' | 'confirmed' | 'finalized'
}

export interface UseBlockHeightReturn {
  blockHeight: bigint | null
  /** Block height as a regular number for easier math */
  blockHeightNumber: number
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
}

/**
 * Get the current block height (number of confirmed blocks).
 *
 * Block height is often a better timing primitive than slot because:
 * - It only counts confirmed blocks, not all slots
 * - It's more stable and predictable for timing logic
 * - It's better for calculating finality and confirmation depths
 * 
 * Use this for:
 * - Transaction confirmation counting
 * - Finality calculations (e.g., "wait 32 blocks")
 * - Time-based logic that needs confirmed state
 */
export function useBlockHeight(
  options: UseBlockHeightOptions = {}
): UseBlockHeightReturn {
  const { network } = useArcClient()
  
  const {
    refreshInterval = 15000,
    enabled = true,
    commitment = 'confirmed',
  } = options

  const query = useQuery<bigint, ArcError>({
    networkMode: "offlineFirst",
    queryKey: [...queryKeys.blockHeight(network.rpcUrl), commitment],
    queryFn: async ({ signal }) => {
      const context: ArcErrorContext = {
        operation: 'getBlockHeight',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      try {
        const transport = (useArcClient() as any).config.transport as Transport
        const result: any = await transport.request(
          { method: 'getBlockHeight', params: [ { commitment } ] },
          { signal }
        )
        const raw = result
        return typeof raw === 'bigint' ? raw : BigInt(raw ?? 0)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch block height: ${errorMessage}`,
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

  const blockHeight = query.data ?? null
  const blockHeightNumber = blockHeight ? Number(blockHeight) : 0

  return {
    blockHeight,
    blockHeightNumber,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}