'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import type { Transport } from '../transports/types'
import { address, type Address } from '@solana/kit'
import { Buffer } from 'buffer'
import { 
  type Schema, 
  type ValidationResult,
  safeValidate,
  prepareAccountDataForValidation
} from '../utils/schema-validation'
import { queryKeys } from '../utils/query-keys'

export interface AccountInfo {
  address: Address
  lamports: bigint
  owner: Address
  executable: boolean
  rentEpoch: number
  data: Uint8Array | null
  space: number
}

export interface UseAccountOptions<T = AccountInfo> {
  address?: string | Address
  refreshInterval?: number
  enabled?: boolean
  onUpdate?: (account: T) => void
  schema?: Schema<T>
  onValidationSuccess?: (data: T) => void
  onValidationError?: (error: Error) => void
}

export interface UseAccountReturn<T = AccountInfo> {
  account: AccountInfo | null
  data: T | null
  validation: ValidationResult<T> | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
  clear: () => void
}

export function useAccount<T = AccountInfo>(options: UseAccountOptions<T> = {}): UseAccountReturn<T> {
  const { wallet, network, config } = useArcClient()
  
  const queryClient = useQueryClient()
  
  const {
    address: optionsAddress,
    refreshInterval = 30000,
    enabled = true,
    onUpdate,
    schema,
    onValidationSuccess,
    onValidationError,
  } = options

  const targetAddress = optionsAddress || wallet.address
  const queryKey = [...queryKeys.account(targetAddress || undefined), schema ? 'schema' : 'raw']
  
  const validateData = useCallback((rawData: AccountInfo): ValidationResult<T> | null => {
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

  const { data: queryData, isLoading, error, refetch } = useQuery({
    networkMode: "offlineFirst",
    queryKey: queryKey,
    queryFn: async ({ signal }): Promise<{ account: AccountInfo | null; validation: ValidationResult<T> | null }> => {
      if (!targetAddress) {
        throw new Error('No address provided and no wallet connected')
      }
      const transport = (config as any).transport as Transport
      const response: any = await transport.request(
        { method: 'getAccountInfo', params: [address(targetAddress), { encoding: 'base64' }] },
        { signal }
      )
      
      if (!response.value) {
        return { account: null, validation: null }
      }
      
      const accountInfo = response.value
      
      let data: Uint8Array | null = null
      if (accountInfo.data && Array.isArray(accountInfo.data) && accountInfo.data[0]) {
        data = new Uint8Array(Buffer.from(accountInfo.data[0], 'base64'))
      }
      
      const result: AccountInfo = {
        address: address(targetAddress),
        lamports: BigInt(accountInfo.lamports),
        owner: accountInfo.owner as Address,
        executable: accountInfo.executable,
        rentEpoch: Number(accountInfo.rentEpoch) || 0,
        data,
        space: Number(accountInfo.space) || (data ? data.length : 0)
      }
      
      const validation = validateData(result)
      
      if (onUpdate) {
        if (validation?.success) {
          onUpdate(validation.data!)
        } else {
          onUpdate(result as T)
        }
      }
      
      return { account: result, validation }
    },
    enabled: enabled && !!targetAddress,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error'],
  })

  const clear = useCallback(() => {
    queryClient.removeQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    account: queryData?.account || null,
    data: queryData?.validation?.success ? queryData.validation.data! : null,
    validation: queryData?.validation || null,
    isLoading,
    error,
    refetch,
    clear
  }
}