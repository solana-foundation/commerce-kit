'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import { releaseRpcConnection } from '../core/rpc-manager' // 🚀 PERFORMANCE FIX
import type { Transport } from '../transports/types'
import { 
  address,
  type Address
} from '@solana/kit'
import { TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda } from '@solana-program/token'
import { 
  type Schema, 
  type ValidationResult,
  safeValidate,
  prepareAccountDataForValidation
} from '../utils/schema-validation'
import { queryKeys } from '../utils/query-keys'

export interface TokenAccountInfo {
  address: Address
  mint: Address
  owner: Address
  amount: bigint
  decimals: number
  uiAmount: number
  uiAmountString: string
  state: 'initialized' | 'uninitialized' | 'frozen'
  isNative: boolean
  closeAuthority?: Address | null
  delegate?: Address | null
  delegatedAmount?: bigint
  lamports: bigint
  rentEpoch: number
}

export interface UseTokenAccountOptions<T = TokenAccountInfo> {
  mint: string | Address
  owner?: string | Address
  findAssociated?: boolean
  refreshInterval?: number
  enabled?: boolean
  onUpdate?: (tokenAccount: T) => void
  schema?: Schema<T>
  onValidationSuccess?: (data: T) => void
  onValidationError?: (error: Error) => void
}

export interface UseTokenAccountReturn<T = TokenAccountInfo> {
  tokenAccount: TokenAccountInfo | null
  data: T | null
  validation: ValidationResult<T> | null
  associatedAddress: Address | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
  clear: () => void
}

/**
 * Hook to fetch and monitor a token account by mint and owner.
 * 
 * By default, it finds the associated token account (ATA) for the given mint/owner pair.
 * 
 * @example
 * ```tsx
 * const { tokenAccount, isLoading } = useTokenAccount({
 *   mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
 *   owner: wallet.address
 * })
 * 
 * if (tokenAccount) {
 *   console.log(`Balance: ${tokenAccount.uiAmount} USDC`)
 * }
 * ```
 */
export function useTokenAccount<T = TokenAccountInfo>(options: UseTokenAccountOptions<T>): UseTokenAccountReturn<T> {
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
    findAssociated = true,
    refreshInterval = 30000,
    enabled = true,
    onUpdate,
    schema,
    onValidationSuccess,
    onValidationError,
  } = options

  const validateData = useCallback((rawData: TokenAccountInfo): ValidationResult<T> | null => {
    if (!schema || !rawData) return null
    
    const preparedData = prepareAccountDataForValidation(rawData)
    const result = safeValidate(preparedData, schema)
    
    if (result.success && onValidationSuccess) {
      onValidationSuccess(result.data!)
    } else if (!result.success && onValidationError) {
      onValidationError(result.error!)
    }
    
    return result
  }, [schema, onValidationSuccess, onValidationError])

  const targetOwner = optionsOwner || wallet.address
  
  const associatedQueryKey = [...queryKeys.tokenAccount(targetOwner || undefined, mint || undefined), 'associated']
  const associatedQuery = useQuery({
    queryKey: associatedQueryKey,
    queryFn: async (): Promise<Address | null> => {
      if (!targetOwner || !findAssociated) return null
      
      const [ata] = await findAssociatedTokenPda({
        mint: address(mint) as any,
        owner: address(targetOwner) as any,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
      return address(ata.toString())
    },
    enabled: enabled && !!targetOwner && !!mint && findAssociated,
    staleTime: 5 * 60 * 1000, // ATA addresses don't change - cache for 5 minutes
  })

  const tokenAccountAddress = associatedQuery.data
  const dataQueryKey = [...queryKeys.tokenAccount(targetOwner || undefined, mint || undefined), 'data', tokenAccountAddress, network.rpcUrl, schema ? 'schema' : 'raw']

  const { data: queryData, isLoading, error, refetch } = useQuery({
    networkMode: "offlineFirst",
    queryKey: dataQueryKey,
    queryFn: async ({ signal }): Promise<{ tokenAccount: TokenAccountInfo | null; validation: ValidationResult<T> | null }> => {
      if (!tokenAccountAddress) {
        throw new Error('No token account address computed')
      }
      
      const transport = (useArcClient() as any).config.transport as Transport
      
      // TODO: Future optimization - convert to base64 encoding with SPL token decoders
      // for better performance. Currently using jsonParsed for simplicity.
      const accountInfo: any = await transport.request(
        { method: 'getAccountInfo', params: [tokenAccountAddress, { encoding: 'jsonParsed' }] },
        { signal }
      )
      
      if (!accountInfo.value) {
        return { tokenAccount: null, validation: null }
      }
      
      if (!accountInfo.value.data || typeof accountInfo.value.data !== 'object' || !('parsed' in accountInfo.value.data)) {
        throw new Error('Invalid token account data format')
      }
      
      const parsed = accountInfo.value.data.parsed as any
      const info = parsed.info
      
      const result: TokenAccountInfo = {
        address: tokenAccountAddress,
        mint: address(info.mint),
        owner: address(info.owner),
        amount: BigInt(info.tokenAmount.amount),
        decimals: info.tokenAmount.decimals,
        uiAmount: info.tokenAmount.uiAmount || 0,
        uiAmountString: info.tokenAmount.uiAmountString || '0',
        state: info.state,
        isNative: info.isNative || false,
        closeAuthority: info.closeAuthority ? address(info.closeAuthority) : null,
        delegate: info.delegate ? address(info.delegate) : null,
        delegatedAmount: info.delegatedAmount ? BigInt(info.delegatedAmount.amount) : undefined,
        lamports: BigInt(accountInfo.value.lamports),
        rentEpoch: Number(accountInfo.value.rentEpoch) || 0
      }
      
      const validation = validateData(result)
      
      if (onUpdate) {
        if (validation?.success) {
          onUpdate(validation.data!)
        } else {
          onUpdate(result as T)
        }
      }
      
      return { tokenAccount: result, validation }
    },
    enabled: enabled && !!tokenAccountAddress && !!targetOwner,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error'],
  })
  
  const clear = useCallback(() => {
    queryClient.removeQueries({ queryKey: dataQueryKey })
    queryClient.removeQueries({ queryKey: associatedQueryKey })
  }, [queryClient, dataQueryKey, associatedQueryKey])

  return {
    tokenAccount: queryData?.tokenAccount || null,
    data: queryData?.validation?.success ? queryData.validation.data! : null,
    validation: queryData?.validation || null,
    associatedAddress: tokenAccountAddress || null,
    isLoading: associatedQuery.isLoading || isLoading,
    error: associatedQuery.error || error,
    refetch: () => {
      associatedQuery.refetch()
      refetch()
    },
    clear
  }
}