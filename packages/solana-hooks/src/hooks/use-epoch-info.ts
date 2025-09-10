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

export interface UseEpochInfoOptions {
  refreshInterval?: number
  enabled?: boolean
  commitment?: 'processed' | 'confirmed' | 'finalized'
}

export interface EpochInfo {
  epoch: bigint
  slotIndex: bigint
  slotsInEpoch: bigint
  absoluteSlot: bigint
  blockHeight: bigint
  epochProgress: number
  estimatedTimeRemainingMs: number
  estimatedEpochEndTime: Date
}

export interface UseEpochInfoReturn {
  epochInfo: EpochInfo | null
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
}

export function useEpochInfo(
  options: UseEpochInfoOptions = {}
): UseEpochInfoReturn {
  const { network } = useArcClient()
  
  const {
    refreshInterval = 30000,
    enabled = true,
    commitment = 'confirmed',
  } = options

  const query = useQuery<EpochInfo, ArcError>({
    networkMode: "offlineFirst",
    queryKey: [...queryKeys.epochInfo(network.rpcUrl), commitment],
    queryFn: async ({ signal }) => {
      const context: ArcErrorContext = {
        operation: 'getEpochInfo',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      try {
        const transport = (useArcClient() as any).config.transport as Transport
        const response: any = await transport.request(
          { method: 'getEpochInfo', params: [ { commitment } ] },
          { signal }
        )
        
        const {
          epoch,
          slotIndex,
          slotsInEpoch,
          absoluteSlot,
          blockHeight,
        } = response

        // Calculate progress and timing estimates
        const epochProgress = Number(slotIndex) / Number(slotsInEpoch)
        const slotsRemaining = Number(slotsInEpoch) - Number(slotIndex)
        
        const avgSlotTime = 400
        const estimatedTimeRemainingMs = slotsRemaining * avgSlotTime
        const estimatedEpochEndTime = new Date(Date.now() + estimatedTimeRemainingMs)

        const epochInfo: EpochInfo = {
          epoch,
          slotIndex,
          slotsInEpoch,
          absoluteSlot,
          blockHeight,
          epochProgress,
          estimatedTimeRemainingMs,
          estimatedEpochEndTime,
        }

        return epochInfo

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch epoch info: ${errorMessage}`,
          context,
          error as Error
        )
      }
    },
    enabled: enabled,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 20_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
  })

  return {
    epochInfo: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}