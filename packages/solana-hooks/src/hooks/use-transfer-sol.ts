'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import { releaseRpcConnection } from '../core/rpc-manager'
import { createTransactionBuilder, createTransactionContext } from '../core/transaction-builder'
import type { Transport } from '../transports/types'
import { 
  address,
  type Address,
  type TransactionSigner
} from '@solana/kit'
import { createInvalidator } from '../utils/invalidate'

export interface TransferSOLOptions {
  to: string | Address
  amount: bigint  
  from?: string | Address
}

export interface TransferSOLResult {
  signature: string
  amount: bigint
  from: Address
  to: Address
  blockTime?: number
  slot?: number
}

export interface UseTransferSOLReturn {
  transferSOL: (options: TransferSOLOptions) => Promise<TransferSOLResult>
  isLoading: boolean
  error: Error | null
  data: TransferSOLResult | null
  reset: () => void
  
  // UI INTERACTION HELPERS
  /** Input state for recipient address */
  toInput: string
  /** Input state for amount (in SOL) */
  amountInput: string
  /** Set recipient address input */
  setToInput: (value: string) => void
  /** Set amount input */
  setAmountInput: (value: string) => void
  /** onChange handler for recipient address input */
  handleToInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** onChange handler for amount input */
  handleAmountInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** Form submission handler that transfers SOL using current input values */
  handleSubmit: (event?: { preventDefault?: () => void }) => Promise<TransferSOLResult | undefined>
  /** Shortcut to transfer SOL using current input values */
  transferFromInputs: () => Promise<TransferSOLResult | undefined>
}

export function useTransferSOL(
  initialToInput: string = '', 
  initialAmountInput: string = ''
): UseTransferSOLReturn {
  const { wallet, network, config } = useArcClient()
  const queryClient = useQueryClient()
  
  const [toInput, setToInput] = useState(initialToInput)
  const [amountInput, setAmountInput] = useState(initialAmountInput)
  
  const stableOptionsRef = useRef({
    network: network.rpcUrl,
    commitment: config.commitment || 'confirmed',
  })
  
  useEffect(() => {
    stableOptionsRef.current = {
      network: network.rpcUrl,
      commitment: config.commitment || 'confirmed',
    }
  }, [network.rpcUrl, config.commitment])
  
  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])
  
  const mutation = useMutation({
    mutationFn: async (options: TransferSOLOptions): Promise<TransferSOLResult> => {
      const { to, amount, from: optionsFrom } = options
      
      const fromAddress = optionsFrom || wallet.address
      
      if (!fromAddress) {
        throw new Error('No sender address provided and no wallet connected')
      }
      
      if (!wallet.signer) {
        throw new Error('Wallet not connected or no signer available')
      }
      
      // Ensure latest blockhash retrieval uses transport via builder context
      const transactionBuilder = createTransactionBuilder(
        createTransactionContext(network.rpcUrl, config.commitment || 'confirmed', true)
      )
      
      // Use shared SOL transfer implementation
      return await transactionBuilder.transferSOL(to, amount, wallet.signer as TransactionSigner)
    },
    onSuccess: async (result) => {
      // Invalidate cache for both sender and recipient
      const invalidator = createInvalidator(queryClient)
      await invalidator.invalidateAfterTransfer(
        result.from.toString(), 
        result.to.toString(),
        { refetch: true }
      )
    },
    onError: () => {},
  })

  const handleToInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setToInput(event.target.value)
  }, [])
  
  const handleAmountInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountInput(event.target.value)
  }, [])
  
  const transferFromInputs = useCallback(async () => {
    if (!toInput || !amountInput) {
      throw new Error('Both recipient address and amount are required')
    }
    
    try {
      const amountInLamports = BigInt(Math.floor(parseFloat(amountInput) * 1_000_000_000))
      
      return await mutation.mutateAsync({
        to: toInput,
        amount: amountInLamports,
      })
    } catch (error) { throw error }
  }, [toInput, amountInput, mutation.mutateAsync])
  
  const handleSubmit = useCallback(async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    return toInput && amountInput ? transferFromInputs() : undefined
  }, [toInput, amountInput, transferFromInputs])

  return {
    transferSOL: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data ?? null,
    reset: mutation.reset,
    toInput,
    amountInput,
    setToInput,
    setAmountInput,
    handleToInputChange,
    handleAmountInputChange,
    handleSubmit,
    transferFromInputs,
  }
}