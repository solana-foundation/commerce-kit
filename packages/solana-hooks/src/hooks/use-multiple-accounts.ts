'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { 
  ArcError,
  ArcErrorCode,
  createNetworkError,
  type ArcErrorContext
} from '../core/error-handler'
import { address, type Address } from '@solana/kit'

async function fetchMultipleAccountsCore(
  addresses: Address[],
  transport: Transport,
  config: {
    commitment: 'processed' | 'confirmed' | 'finalized'
    encoding: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed'
    dataSlice?: { offset: number; length: number }
  }
): Promise<AccountInfo[]> {
  // transport-based implementation
  const validAddresses = addresses.map(addr => {
    try {
      return address(addr)
    } catch (error) {
      throw new Error(`Invalid address format: ${addr}`)
    }
  })

  const rpcConfig: any = {
    commitment: config.commitment,
    encoding: config.encoding,
  }
  
  if (config.dataSlice) {
    rpcConfig.dataSlice = config.dataSlice
  }

  const response: any = await transport.request(
    { method: 'getMultipleAccounts', params: [validAddresses, rpcConfig] }
  )
  
  const accounts: AccountInfo[] = response.value.map((account: any, index: number) => {
    const addr = validAddresses[index]
    
    if (!account) {
      return {
        address: addr,
        data: null,
        exists: false,
        executable: false,
        lamports: 0n,
        owner: null,
        rentEpoch: 0n,
      }
    }

    return {
      address: addr,
      data: account.data ? (
        config.encoding === 'base64' ? 
          new Uint8Array(Buffer.from(account.data[0], 'base64')) : 
          account.data instanceof Uint8Array ? account.data : null
      ) : null,
      exists: true,
      executable: account.executable,
      lamports: account.lamports,
      owner: account.owner ? address(account.owner) : null,
      rentEpoch: account.rentEpoch,
    }
  })

  
  return accounts
}

export interface UseMultipleAccountsOptions {
  addresses: Address[]
  refreshInterval?: number
  enabled?: boolean
  commitment?: 'processed' | 'confirmed' | 'finalized'
  encoding?: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed'
  dataSlice?: {
    offset: number
    length: number
  }
}

export interface AccountInfo {
  address: Address
  data: Uint8Array | null
  exists: boolean
  executable: boolean
  lamports: bigint
  owner: Address | null
  rentEpoch: bigint
}

export interface UseMultipleAccountsReturn {
  accounts: AccountInfo[] | null
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
  clear: () => void
}

/**
 * Fetch multiple accounts in a single RPC call for optimal performance.
 */
export function useMultipleAccounts(
  options: UseMultipleAccountsOptions
): UseMultipleAccountsReturn {
  const { network, config } = useArcClient()
  const queryClient = useQueryClient()
  
  const {
    addresses,
    refreshInterval,
    enabled = true,
    commitment = 'confirmed',
    encoding = 'base64',
    dataSlice,
  } = options

  const query = useQuery<AccountInfo[], ArcError>({
    queryKey: ['multipleAccounts', network.rpcUrl, addresses, commitment, encoding, dataSlice],
    queryFn: async () => {
      const context: ArcErrorContext = {
        operation: 'getMultipleAccounts',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      if (!addresses.length) {
        return []
      }

      try {
        return await fetchMultipleAccountsCore(addresses, (config as any).transport, {
          commitment,
          encoding,
          dataSlice,
        })
      } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid address format')) {
          throw new ArcError(
            error.message,
            ArcErrorCode.INVALID_ADDRESS,
            context,
            error
          )
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch multiple accounts: ${errorMessage}`,
          context,
          error as Error
        )
      }
    },
    enabled: enabled && addresses.length > 0,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
  })

  const clear = useCallback(() => {
    const key = ['multipleAccounts', network.rpcUrl, addresses, commitment, encoding, dataSlice] as const
    queryClient.cancelQueries({ queryKey: key, exact: true }).finally(() => {
      queryClient.removeQueries({ queryKey: key, exact: true })
    })
  }, [addresses, commitment, dataSlice, encoding, network.rpcUrl, queryClient])

  return {
    accounts: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
    clear,
  }
}