'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import { releaseRpcConnection } from '../core/rpc-manager'
import type { Transport } from '../transports/types'
import { 
  address,
  type Address
} from '@solana/kit'
import { TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda } from '@solana-program/token'
import { queryKeys } from '../utils/query-keys'

export interface TokenBalance {
  mint: Address
  amount: bigint
  decimals: number
  uiAmount: number
  uiAmountString: string
  tokenAccount: Address
}

export interface UseTokenBalanceOptions {
  mint: string | Address
  owner?: string | Address
  tokenAccount?: string | Address
  refreshInterval?: number
  enabled?: boolean
  onUpdate?: (balance: TokenBalance) => void
}

export interface UseTokenBalanceReturn {
  balance: bigint | null
  uiAmount: number | null
  decimals: number | null
  tokenAccount: Address | null
  tokenBalance: TokenBalance | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
  clear: () => void
}

export function useTokenBalance(options: UseTokenBalanceOptions): UseTokenBalanceReturn {
  const { wallet, network } = useArcClient()
  const queryClient = useQueryClient()
  
  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])
  
  const {
    mint,
    owner: optionsOwner,
    tokenAccount: explicitTokenAccount,
    refreshInterval = 30000,
    enabled = true,
    onUpdate,
  } = options

  const targetOwner = optionsOwner || wallet.address
  
  const { data, isLoading, error, refetch } = useQuery({
    networkMode: "offlineFirst", // 🚀 BETTER UX: Work with cached data when offline
    queryKey: [...queryKeys.tokenBalance(explicitTokenAccount || undefined), mint, targetOwner, network.rpcUrl],
    queryFn: async ({ signal }): Promise<TokenBalance | null> => {
      if (!targetOwner) {
        throw new Error('No owner provided and no wallet connected')
      }
      
      let tokenAccountAddress: Address
      
      if (explicitTokenAccount) {
        tokenAccountAddress = address(explicitTokenAccount)
      } else {
        const [ata] = await findAssociatedTokenPda({
          mint: address(mint),
          owner: address(targetOwner),
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        })
        tokenAccountAddress = ata
      }
      
      const transport = (useArcClient() as any).config.transport as Transport
      const response: any = await transport.request(
        { method: 'getTokenAccountBalance', params: [tokenAccountAddress] },
        { signal }
      )
      
      if (!response.value) {
        return null
      }
      
      const balanceInfo = response.value
      
      const result: TokenBalance = {
        mint: address(mint),
        amount: BigInt(balanceInfo.amount),
        decimals: balanceInfo.decimals,
        uiAmount: balanceInfo.uiAmount || 0,
        uiAmountString: balanceInfo.uiAmountString || '0',
        tokenAccount: tokenAccountAddress
      }
      
      if (onUpdate) {
        onUpdate(result)
      }
      
      return result
    },
    enabled: enabled && !!targetOwner && !!mint,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error'],
  })

  const clear = useCallback(() => {
    const key = [...queryKeys.tokenBalance(explicitTokenAccount || undefined), mint, targetOwner, network.rpcUrl]
    queryClient.removeQueries({ queryKey: key })
  }, [queryClient, explicitTokenAccount, mint, targetOwner, network.rpcUrl])

  return {
    balance: data?.amount || null,
    uiAmount: data?.uiAmount || null,
    decimals: data?.decimals || null,
    tokenAccount: data?.tokenAccount || null,
    tokenBalance: data || null,
    isLoading,
    error,
    refetch,
    clear,
  }
}