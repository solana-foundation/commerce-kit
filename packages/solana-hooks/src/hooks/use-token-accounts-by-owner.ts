'use client'

import { useQuery } from '@tanstack/react-query'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { 
  ArcError,
  ArcErrorCode,
  createNetworkError,
  type ArcErrorContext
} from '../core/error-handler'
import { address, type Address } from '@solana/kit'

export interface UseTokenAccountsByOwnerOptions {
  owner?: Address | string
  mint?: Address
  programId?: Address
  refreshInterval?: number
  enabled?: boolean
  commitment?: 'processed' | 'confirmed' | 'finalized'
  encoding?: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed'
  excludeZeroBalances?: boolean
}

export interface TokenAccount {
  address: Address
  mint: Address
  owner: Address
  amount: bigint
  state: 'initialized' | 'uninitialized' | 'frozen'
  delegate?: Address
  delegatedAmount?: bigint
  closeAuthority?: Address
  isNative: boolean
  rentExemptReserve?: bigint
  createdAt?: Date
}

export interface UseTokenAccountsByOwnerReturn {
  tokenAccounts: TokenAccount[] | null
  isLoading: boolean
  error: ArcError | null
  refetch: () => void
  owner: string | null
}

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

export function useTokenAccountsByOwner(
  options: UseTokenAccountsByOwnerOptions = {}
): UseTokenAccountsByOwnerReturn {
  const { wallet, network } = useArcClient()
  
  const {
    owner: optionsOwner,
    mint,
    programId = TOKEN_PROGRAM_ID,
    refreshInterval = 30000,
    enabled = true,
    commitment = 'confirmed',
    encoding = 'jsonParsed',
    excludeZeroBalances = true,
  } = options

  const targetOwner = optionsOwner || wallet.address

  const query = useQuery<TokenAccount[], ArcError>({
    networkMode: "offlineFirst",
    queryKey: [
      'tokenAccountsByOwner', 
      network.rpcUrl, 
      targetOwner, 
      mint, 
      programId, 
      commitment, 
      encoding,
      excludeZeroBalances
    ],
    queryFn: async () => {
      const context: ArcErrorContext = {
        operation: 'getTokenAccountsByOwner',
        address: targetOwner || 'none',
        timestamp: Date.now(),
        rpcUrl: network.rpcUrl
      }

      if (!targetOwner) {
        throw new ArcError(
          'No owner address provided and no wallet connected',
          ArcErrorCode.WALLET_NOT_CONNECTED,
          context
        )
      }

      try {
        // Validate owner address
        let ownerAddress: Address
        try {
          ownerAddress = address(targetOwner)
        } catch (error) {
          throw new ArcError(
            `Invalid owner address format: ${targetOwner}`,
            ArcErrorCode.INVALID_ADDRESS,
            context,
            error as Error
          )
        }

        const transport = (useArcClient() as any).config.transport as Transport

        const filter = mint 
          ? { mint: address(mint) }
          : { programId: address(programId) }

        const rpcConfig = {
          commitment,
          encoding,
        }

        const response: any = await transport.request(
          { method: 'getTokenAccountsByOwner', params: [ownerAddress, filter, rpcConfig] }
        )

        const tokenAccounts: TokenAccount[] = (response.value as any[])
          .map((accountInfo: any) => {
            try {
              const accountAddress = address(accountInfo.pubkey)
              
              if (encoding === 'jsonParsed' && (accountInfo.account.data as any).parsed) {
                const parsed = (accountInfo.account.data as any).parsed
                const info = parsed.info
                
                const tokenAmount = BigInt(info.tokenAmount?.amount || '0')
                
                if (excludeZeroBalances && tokenAmount === 0n) {
                  return null
                }

                return {
                  address: accountAddress,
                  mint: address(info.mint),
                  owner: address(info.owner),
                  amount: tokenAmount,
                  state: info.state || 'initialized',
                  delegate: info.delegate ? address(info.delegate) : undefined,
                  delegatedAmount: info.delegatedAmount ? BigInt(info.delegatedAmount.amount) : undefined,
                  closeAuthority: info.closeAuthority ? address(info.closeAuthority) : undefined,
                  isNative: !!info.isNative,
                  rentExemptReserve: info.isNative ? BigInt(info.isNative) : undefined,
                } as TokenAccount
              } else {
                // Non-parsed token account data not yet supported
                return null
              }
            } catch (error) {
              return null
            }
          })
           .filter((account: any): account is TokenAccount => account !== null)
        return tokenAccounts

      } catch (error) {
        if (error instanceof ArcError) {
          throw error
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw createNetworkError(
          `Failed to fetch token accounts: ${errorMessage}`,
          context,
          error as Error
        )
      }
    },
    enabled: enabled && !!targetOwner,
    refetchInterval: refreshInterval,
    staleTime: 20000,
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
  })

  return {
    tokenAccounts: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
    owner: targetOwner,
  }
}