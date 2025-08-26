// Thin, opt-in helpers for typed program clients atop Kit's @solana-program/*
// Keep minimal to avoid bundle bloat; apps import their specific clients.

import { useQuery } from '@tanstack/react-query'
import { useArcClient } from './core/arc-client-provider'
import { useTransaction, type Instruction } from './hooks/use-transaction'

export interface ProgramQueryOptions<TArgs, TData> {
  key: readonly unknown[]
  enabled?: boolean
  fetch: (ctx: { rpcUrl: string; commitment: 'processed' | 'confirmed' | 'finalized' }, args: TArgs) => Promise<TData>
  args: TArgs
  staleTimeMs?: number
}

export function useProgramQuery<TArgs, TData>(options: ProgramQueryOptions<TArgs, TData>) {
  const { network } = useArcClient()
  return useQuery({
    queryKey: options.key,
    queryFn: () => options.fetch({ rpcUrl: network.rpcUrl, commitment: 'confirmed' }, options.args),
    enabled: options.enabled ?? true,
    staleTime: options.staleTimeMs ?? 30_000,
  })
}

export interface BuildAndSendOptions<TBuild> {
  build: (args: TBuild) => Promise<Instruction[]>
}

export function useProgramInstruction<TBuild>(opts: BuildAndSendOptions<TBuild>) {
  const { sendTransaction } = useTransaction({ confirmationStrategy: 'confirmed' })
  return {
    async buildAndSend(args: TBuild) {
      const instructions = await opts.build(args)
      return await sendTransaction({ instructions })
    },
  }
}

export interface ProgramCodec<T> {
  decode: (bytes: Uint8Array) => T
}

export interface UseAccountWithCodecOptions<T> {
  address: string | null | undefined
  codec: ProgramCodec<T>
}

export function useAccountWithCodec<T>(opts: UseAccountWithCodecOptions<T>) {
  const { network } = useArcClient()
  return useQuery({
    queryKey: ['program-account', opts.address],
    enabled: !!opts.address,
    queryFn: async () => {
      const res = await fetch(`${network.rpcUrl}`, { method: 'POST', body: '' })
      void res // placeholder; consumers should prefer their generated client fetchers
      throw new Error('useAccountWithCodec: provide a concrete fetcher via useProgramQuery')
    },
  })
}


