'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import { releaseRpcConnection } from '../core/rpc-manager'
import { fetchMint } from '@solana-program/token'
import { 
  address,
  type Address
} from '@solana/kit'
import { queryKeys } from '../utils/query-keys'

export interface MintAccount {
  mintAuthority: { __option: 'Some'; value: Address } | { __option: 'None' }
  supply: bigint
  decimals: number
  isInitialized: boolean
  freezeAuthority: { __option: 'Some'; value: Address } | { __option: 'None' }
}

export interface UseMintOptions {
  mintAddress?: string | Address
  enabled?: boolean
  refreshInterval?: number
}

export interface UseMintReturn {
  mint: MintAccount | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
  clear: () => void
  exists: boolean
}

/**
 * 🎉 Arc Level 2: Typed Mint Account Data
 * 
 * Fetches and deserializes mint account data using Kit's fetchMint codec.
 * Returns properly typed mint information including supply, decimals, and authorities.
 * 
 * @example
 * ```tsx
 * // Simple usage with explicit mint address
 * const { mint, isLoading } = useMint({ 
 *   mintAddress: 'So11111111111111111111111111111111111111112' // Wrapped SOL
 * })
 * 
 * if (mint) {
 *   console.log(`Supply: ${mint.supply}`)
 *   console.log(`Decimals: ${mint.decimals}`) 
 *   console.log(`Mint Authority: ${mint.mintAuthority.__option}`)
 * }
 * ```
 */
export function useMint(options: UseMintOptions = {}): UseMintReturn {
  const { network } = useArcClient()
  const queryClient = useQueryClient()
  
  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])
  
  const {
    mintAddress,
    enabled = true,
    refreshInterval = 60000,
  } = options

  const query = useQuery({
    queryKey: queryKeys.mint(mintAddress || undefined),
    queryFn: async (): Promise<MintAccount | null> => {
      if (!mintAddress) {
        throw new Error('Mint address is required')
      }
      
      try {
        const { transport } = (useArcClient() as any).config
        // fetchMint accepts an rpc-like interface; wrap transport minimally
        const rpcShim = {
          getAccountInfo: (addr: any, opts?: any) => ({
            send: () => transport.request({ method: 'getAccountInfo', params: [addr, opts] })
          })
        } as any
        const mintData = await fetchMint(rpcShim, address(mintAddress))
        
        return mintData.data as MintAccount
      } catch (error) {
        throw error
      }
    },
    enabled: enabled && !!mintAddress,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error'],
  })

  const clear = useCallback(() => {
    queryClient.removeQueries({ queryKey: queryKeys.mint(mintAddress || undefined) })
  }, [queryClient, mintAddress])

  return {
    mint: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    clear,
    exists: !!query.data,
  }
}