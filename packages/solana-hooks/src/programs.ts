// Thin, opt-in helpers for typed program clients atop Kit's @solana-program/*
// Keep minimal to avoid bundle bloat; apps import their specific clients.

import { useQuery } from '@tanstack/react-query'
import type { Instruction } from './hooks/use-transaction'

export interface ProgramQueryOptions<TArgs, TData> {
  key: readonly unknown[]
  enabled?: boolean
  fetch: (ctx: { rpcUrl: string; commitment: 'processed' | 'confirmed' | 'finalized' }, args: TArgs) => Promise<TData>
  args: TArgs
  staleTimeMs?: number
  rpcUrl: string
}

export function useProgramQuery<TArgs, TData>(options: ProgramQueryOptions<TArgs, TData>) {
  return useQuery({
    queryKey: options.key,
    queryFn: () => options.fetch({ rpcUrl: options.rpcUrl, commitment: 'confirmed' }, options.args),
    enabled: options.enabled ?? true,
    staleTime: options.staleTimeMs ?? 30_000,
  })
}

export interface BuildAndSendOptions<TBuild> {
  build: (args: TBuild) => Promise<Instruction[]>
  sendTransaction: (params: { instructions: Instruction[] }) => Promise<any>
}

export function useProgramInstruction<TBuild>(opts: BuildAndSendOptions<TBuild>) {
  return {
    async buildAndSend(args: TBuild) {
      const instructions = await opts.build(args)
      return await opts.sendTransaction({ instructions })
    },
  }
}

// Backwards compatibility function that uses React context
export function useProgramInstructionWithContext<TBuild>(opts: Omit<BuildAndSendOptions<TBuild>, 'sendTransaction'>) {
  const { useTransaction } = require('./hooks/use-transaction')
  const { sendTransaction } = useTransaction({ confirmationStrategy: 'confirmed' })
  return useProgramInstruction({ ...opts, sendTransaction })
}

export interface ProgramCodec<T> {
  decode: (bytes: Uint8Array) => T
}

export interface UseAccountWithCodecOptions<T> {
  address: string | null | undefined
  codec: ProgramCodec<T>
  rpcUrl: string
}

export function useAccountWithCodec<T>(opts: UseAccountWithCodecOptions<T>) {
  return useQuery({
    queryKey: ['program-account', opts.address],
    enabled: !!opts.address,
    queryFn: async () => {
      const res = await fetch(`${opts.rpcUrl}`, { method: 'POST', body: '' })
      void res // placeholder; consumers should prefer their generated client fetchers
      throw new Error('useAccountWithCodec: provide a concrete fetcher via useProgramQuery')
    },
  })
}

// Backwards compatibility functions that use React context
export function useProgramQueryWithContext<TArgs, TData>(options: Omit<ProgramQueryOptions<TArgs, TData>, 'rpcUrl'>) {
  const { useArcClient } = require('./core/arc-client-provider')
  const { network } = useArcClient()
  return useProgramQuery({ ...options, rpcUrl: network.rpcUrl })
}

export function useAccountWithCodecWithContext<T>(opts: Omit<UseAccountWithCodecOptions<T>, 'rpcUrl'>) {
  const { useArcClient } = require('./core/arc-client-provider')
  const { network } = useArcClient()
  return useAccountWithCodec({ ...opts, rpcUrl: network.rpcUrl })
}


