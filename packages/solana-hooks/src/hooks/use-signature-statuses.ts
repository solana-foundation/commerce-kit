'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { 
  ArcError,
  createNetworkError,
  type ArcErrorContext
} from '../core/error-handler'
import type { Signature } from '@solana/keys'

type SignatureStatus = Readonly<{
    slot: bigint;
    confirmations: bigint | null;
    confirmationStatus: 'processed' | 'confirmed' | 'finalized' | null;
    err: unknown | null;
}> | null;


export interface UseSignatureStatusesOptions {
  signatures: Signature[]
  refreshInterval?: number
  enabled?: boolean
}

export interface UseSignatureStatusesReturn {
  statuses: readonly SignatureStatus[] | null
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
  clear: () => void
}

export function useSignatureStatuses(
  options: UseSignatureStatusesOptions
): UseSignatureStatusesReturn {
  const { network } = useArcClient()
  const queryClient = useQueryClient()
  
  const {
    signatures,
    refreshInterval,
    enabled = true,
  } = options

  const query = useQuery<readonly SignatureStatus[], ArcError>({
    networkMode: "offlineFirst",
    queryKey: ['signatureStatuses', network.rpcUrl, signatures],
    queryFn: async ({ signal }) => {
      const context: ArcErrorContext = {
        operation: 'getSignatureStatuses',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      try {
        const transport = (useArcClient() as any).config.transport as Transport
        const response: any = await transport.request(
          { method: 'getSignatureStatuses', params: [signatures] },
          { signal }
        )
        return response?.value
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch signature statuses: ${errorMessage}`,
          context,
          error as Error
        )
      }
    },
    enabled: enabled && signatures.length > 0,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
  })

  const clear = useCallback(() => {
    const key = ['signatureStatuses', network.rpcUrl, signatures] as const
    queryClient.cancelQueries({ queryKey: key, exact: true }).finally(() => {
      queryClient.removeQueries({ queryKey: key, exact: true })
    })
  }, [network.rpcUrl, signatures, queryClient])

  return {
    statuses: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
    clear,
  }
}
