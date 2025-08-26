// Minimal GraphQL helper over @solana/kit rpc-graphql; opt-in

import { useQuery } from '@tanstack/react-query'
import { useArcClient } from './core/arc-client-provider'
import type { Commitment } from '@solana/kit'

export interface GraphQLQueryOptions<TVars, TData> {
  key: readonly unknown[]
  source: string
  variables?: TVars
  commitment?: Commitment
  enabled?: boolean
}

export function useGraphQL<TVars = unknown, TData = unknown>(opts: GraphQLQueryOptions<TVars, TData>) {
  const { network } = useArcClient()
  return useQuery({
    queryKey: opts.key,
    enabled: opts.enabled ?? true,
    queryFn: async () => {
      const { createDefaultRpcTransport, createRpcGraphQL }: any = await import('@solana/kit')
      const transport = createDefaultRpcTransport({ url: network.rpcUrl })
      const rpcGraphQL = createRpcGraphQL({ transport })
      const result = await rpcGraphQL.query(opts.source, opts.variables ?? {}, opts.commitment)
      return result as TData
    },
    staleTime: 10_000,
  })
}


