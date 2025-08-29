// Minimal GraphQL helper over @solana/kit rpc-graphql; opt-in

import { useQuery } from '@tanstack/react-query'
import type { Commitment } from '@solana/kit'

export interface GraphQLQueryOptions<TVars, TData> {
  key: readonly unknown[]
  source: string
  variables?: TVars
  commitment?: Commitment
  enabled?: boolean
  rpcUrl: string
}

export function useGraphQL<TVars = unknown, TData = unknown>(opts: GraphQLQueryOptions<TVars, TData>) {
  return useQuery({
    queryKey: opts.key,
    enabled: opts.enabled ?? true,
    queryFn: async () => {
      const { createDefaultRpcTransport, createRpcGraphQL }: any = await import('@solana/kit')
      const transport = createDefaultRpcTransport({ url: opts.rpcUrl })
      const rpcGraphQL = createRpcGraphQL({ transport })
      const result = await rpcGraphQL.query(opts.source, opts.variables ?? {}, opts.commitment)
      return result as TData
    },
    staleTime: 10_000,
  })
}

// Hook that uses React context for backwards compatibility
export function useGraphQLWithContext<TVars = unknown, TData = unknown>(opts: Omit<GraphQLQueryOptions<TVars, TData>, 'rpcUrl'>) {
  const { useArcClient } = require('./core/arc-client-provider')
  const { network } = useArcClient()
  return useGraphQL({ ...opts, rpcUrl: network.rpcUrl })
}


