// Enhanced subscription helpers built on pooled websockets; opt-in

import { useEffect, useRef, useState } from 'react'
import { getSharedWebSocket } from './core/rpc-manager'
import { address } from '@solana/kit'

export interface UseAccountSubscribeOptions {
  address: string | null | undefined
  commitment?: 'processed' | 'confirmed' | 'finalized'
  rpcUrl: string
}

export function useAccountSubscribe(opts: UseAccountSubscribeOptions) {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [connecting, setConnecting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!opts.address) return
    let cancelled = false
    let retries = 0
    const maxRetries = 3
    const commit = opts.commitment ?? 'confirmed'

    async function start() {
      setConnecting(true)
      try {
        const ws = getSharedWebSocket(opts.rpcUrl, commit)
        abortRef.current?.abort()
        abortRef.current = new AbortController()
        const sub = await ws
          .accountNotifications(address(opts.address as string), { commitment: commit })
          .subscribe({ abortSignal: abortRef.current.signal })
        for await (const notif of sub) {
          if (cancelled) break
          setData(notif.value)
        }
      } catch (e: any) {
        if (cancelled) return
        setError(e)
        if (retries++ < maxRetries) {
          setTimeout(start, Math.min(250 * retries, 1500))
        }
      } finally {
        setConnecting(false)
      }
    }

    start()
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
  }, [opts.address, opts.commitment, opts.rpcUrl])

  return { data, error, connecting }
}

// Hook that uses React context for backwards compatibility
export function useAccountSubscribeWithContext(opts: Omit<UseAccountSubscribeOptions, 'rpcUrl'>) {
  const { useArcClient } = require('./core/arc-client-provider')
  const { network } = useArcClient()
  return useAccountSubscribe({ ...opts, rpcUrl: network.rpcUrl })
}


