'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback, useMemo } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import { releaseRpcConnection } from '../core/rpc-manager'
import type { Transport } from '../transports/types'
import { 
  address,
  type Address
} from '@solana/kit'
import { fetchMint } from '@solana-program/token'
import { 
  type Schema, 
  type ValidationResult,
  safeValidate,
  prepareAccountDataForValidation,
  MintAccountSchema
} from '../utils/schema-validation'
import { queryKeys } from '../utils/query-keys'

// ===== PROGRAM ADDRESS CONSTANTS =====

const STAKE_PROGRAM_ADDRESS = 'Stake11111111111111111111111111111111111112' as Address<'Stake11111111111111111111111111111111111112'>
const VOTE_PROGRAM_ADDRESS = 'Vote111111111111111111111111111111111111112' as Address<'Vote111111111111111111111111111111111111112'>

// ===== TYPES =====

export type BuiltInProgram = 'mint' | 'stake' | 'vote' | 'system'

export type CustomCodec<T> = (rpc: any, address: Address) => Promise<T>

export type ProgramAccountOptions<T> = 
  | { program: BuiltInProgram; codec?: undefined }
  | { program?: undefined; codec: CustomCodec<T> }

export interface UseProgramAccountOptions<T> {
  address?: string | Address
  enabled?: boolean
  refreshInterval?: number
  program?: BuiltInProgram
  codec?: CustomCodec<T>
  schema?: Schema<T>
  onValidationSuccess?: (data: T) => void
  onValidationError?: (error: Error) => void
  onUpdate?: (data: T) => void
}

export interface UseProgramAccountReturn<T> {
  data: T | null
  validatedData: T | null
  validation: ValidationResult<T> | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
  exists: boolean
  clear: () => void
}

// ===== BUILT-IN CODEC REGISTRY =====

const BUILT_IN_CODECS: Record<BuiltInProgram, CustomCodec<any>> = {
  mint: async (rpc, addr) => {
    const mintData = await fetchMint(rpc, addr as any)
    return mintData.data
  },
  
  stake: async (rpc, addr) => {
    const accountInfo = await rpc.getAccountInfo(addr).send()
    if (!accountInfo.value) {
      throw new Error('Stake account not found')
    }
    
    const account = accountInfo.value
    
    if (account.owner !== STAKE_PROGRAM_ADDRESS) {
      throw new Error('Account is not owned by the Stake program')
    }
    
    // Basic parsing of stake account structure
    // Note: This is a simplified implementation pending @solana-program/stake
    return {
      account: addr,
      lamports: account.lamports,
      owner: account.owner,
      executable: account.executable,
      rentEpoch: account.rentEpoch,
      data: {
        parsed: {
          type: 'stake',
          info: {
            // Basic stake account info (simplified)
            status: 'active', // Placeholder - would need proper parsing
            lamports: account.lamports,
            note: 'Enhanced stake parsing - full implementation pending @solana-program/stake'
          }
        }
      }
    }
  },
  
  vote: async (rpc, addr) => {
    const accountInfo = await rpc.getAccountInfo(addr).send()
    if (!accountInfo.value) {
      throw new Error('Vote account not found')
    }
    
    const account = accountInfo.value
    
    if (account.owner !== VOTE_PROGRAM_ADDRESS) {
      throw new Error('Account is not owned by the Vote program')
    }
    
    // Basic parsing of vote account structure
    // Note: This is a simplified implementation pending @solana-program/vote
    return {
      account: addr,
      lamports: account.lamports,
      owner: account.owner,
      executable: account.executable,
      rentEpoch: account.rentEpoch,
      data: {
        parsed: {
          type: 'vote',
          info: {
            // Basic vote account info (simplified)
            lamports: account.lamports,
            note: 'Basic vote parsing - full implementation pending @solana-program/vote'
          }
        }
      }
    }
  },
  
  system: async (rpc, addr) => {
    const accountInfo = await rpc.getAccountInfo(addr).send()
    return accountInfo
  }
}

// ===== MAIN HOOK =====

/**
 * 🚀 Arc Level 3: Generic Program Account Hook
 * 
 * The ultimate power user feature - parse ANY on-chain program account with proper typing.
 * Works with both built-in codec registry and custom codec functions.
 * 
 * @example
 * ```tsx
 * // 🔥 Built-in codec registry
 * const { data: stakeAccount } = useProgramAccount<StakeAccount>(
 *   { address: STAKE_PROGRAM_ADDRESS, program: 'stake' }
 * )
 * 
 * // 🚀 Custom codec for any program
 * const { data: customData } = useProgramAccount<MyCustomType>({
 *   address: 'MyProgramAccount111111111111111111111111',
 *   codec: async (rpc, addr) => parseMyCustomProgram(await rpc.getAccountInfo(addr))
 * })
 * 
 * if (stakeAccount) {
 *   console.log(`Staker: ${stakeAccount.meta.authorized.staker}`)
 *   console.log(`Delegated: ${Number(stakeAccount.stake?.delegation.stake || 0n) / 1e9} SOL`)
 * }
 * ```
 */
export function useProgramAccount<T>(
  options: UseProgramAccountOptions<T>
): UseProgramAccountReturn<T> {
  const arcClient = useArcClient()
  const { network } = arcClient
  const queryClient = useQueryClient()
  
  // Extract transport outside the query to avoid hooks rule violation
  const transport = useMemo(() => 
    (arcClient as any).config.transport as Transport, 
    [arcClient]
  )
  
  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])
  
  const {
    address: accountAddress,
    enabled = true,
    refreshInterval = 60000,
    program,
    codec,
    schema,
    onValidationSuccess,
    onValidationError,
    onUpdate
  } = options

  const validateData = useCallback((rawData: T): ValidationResult<T> | null => {
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

  const resolvedCodec: CustomCodec<T> | null = codec || 
    (program ? (BUILT_IN_CODECS[program as BuiltInProgram] as CustomCodec<T>) : null)

  const query = useQuery({
    queryKey: [...queryKeys.programAccount(program || 'custom', accountAddress || undefined), network.rpcUrl, schema ? 'schema' : 'raw'],
    queryFn: async (): Promise<{ data: T | null; validation: ValidationResult<T> | null }> => {
      if (!accountAddress) {
        throw new Error('Account address is required')
      }

      if (!resolvedCodec) {
        throw new Error('Either program or codec must be provided')
      }
      
      const rpcShim = {
        getAccountInfo: (addr: any, opts?: any) => ({
          send: () => transport.request({ method: 'getAccountInfo', params: [addr, opts] })
        })
      } as any
      
      try {
        const parsedData = await resolvedCodec(rpcShim, address(accountAddress))
        
        const validation = validateData(parsedData)
        
        if (onUpdate) {
          if (validation?.success) {
            onUpdate(validation.data!)
          } else {
            onUpdate(parsedData)
          }
        }
        
        return { data: parsedData, validation }
      } catch (error) {
        console.error('❌ [useProgramAccount] Failed to fetch/parse account data:', error)
        throw error
      }
    },
    enabled: enabled && !!accountAddress && !!resolvedCodec,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    notifyOnChangeProps: ['data', 'error'],
  })

  const clear = useCallback(() => {
    const key = [...queryKeys.programAccount(program || 'custom', accountAddress || undefined), network.rpcUrl, schema ? 'schema' : 'raw']
    queryClient.cancelQueries({ queryKey: key, exact: true }).finally(() => {
      queryClient.removeQueries({ queryKey: key, exact: true })
    })
  }, [accountAddress, network.rpcUrl, program, schema, queryClient])

  return {
    data: query.data?.data || null,
    validatedData: query.data?.validation?.success ? query.data.validation.data! : null,
    validation: query.data?.validation || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    exists: !!query.data?.data,
    clear,
  }
}

// ===== UTILITY TYPE EXPORTS =====

export interface MintAccount {
  mintAuthority: { __option: 'Some'; value: Address } | { __option: 'None' }
  supply: bigint
  decimals: number
  isInitialized: boolean
  freezeAuthority: { __option: 'Some'; value: Address } | { __option: 'None' }
}

export interface StakeAccount {
  account: Address
  lamports: bigint
  owner: string
  executable: boolean
  rentEpoch: number
  data: {
    parsed: {
      type: 'stake'
      info: {
        status: string
        lamports: bigint
        note: string
        // Extended fields will be added when @solana-program/stake is available:
        // meta?: {
        //   rentExemptReserve: bigint
        //   authorized: {
        //     staker: Address
        //     withdrawer: Address
        //   }
        //   lockup: {
        //     unixTimestamp: bigint
        //     epoch: bigint
        //     custodian: Address
        //   }
        // }
        // stake?: {
        //   delegation: {
        //     voterPubkey: Address
        //     stake: bigint
        //     activationEpoch: bigint
        //     deactivationEpoch: bigint
        //     warmupCooldownRate: number
        //   }
        //   creditsObserved: bigint
        // }
      }
    }
  }
}

export interface SystemAccount {
  lamports: bigint
  data: Uint8Array
  owner: Address
  executable: boolean
  rentEpoch: bigint
}