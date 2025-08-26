'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import { getSharedRpc, getSharedWebSocket, releaseRpcConnection } from '../core/rpc-manager'
import type { Transport } from '../transports/types'
import { 
  sendAndConfirmTransactionFactory,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  pipe,
  type Instruction, 
  type TransactionSigner
} from '@solana/kit'
import { 
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction 
} from '@solana-program/compute-budget'
import { getTransactionDecoder, getBase64EncodedWireTransaction } from '@solana/transactions'
import type { UseTransactionOptions } from '../types'

export { type Instruction } from '@solana/kit'
export type { UseTransactionOptions }

export interface TransactionConfig {
  feePayer?: TransactionSigner 
  computeUnitLimit?: number
  computeUnitPrice?: number
  skipPreflight?: boolean
  maxRetries?: number
}

export interface TransactionResult {
  signature: string
  confirmed: boolean
}

export interface SendTransactionParams {
  instructions: Instruction[]
  config?: TransactionConfig
}

export interface UseTransactionReturn {
  sendTransaction: (params: SendTransactionParams) => Promise<TransactionResult>
  sendPrebuilt: (tx: { wireTransaction: Uint8Array }, config?: TransactionConfig) => Promise<TransactionResult>
  buildTransaction: (instructions: Instruction[], config?: TransactionConfig) => Promise<string>
  isLoading: boolean
  error: Error | null
  data: TransactionResult | null
  reset: () => void
}

export class ArcTransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'ArcTransactionError'
  }
}

export class TransactionSimulationError extends ArcTransactionError {
  constructor(message: string, cause?: Error) {
    super(message, 'SIMULATION_FAILED', cause)
  }
}

export class TransactionSendError extends ArcTransactionError {
  constructor(message: string, cause?: Error) {
    super(message, 'SEND_FAILED', cause)
  }
}

export class TransactionConfirmationError extends ArcTransactionError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIRMATION_FAILED', cause)
  }
}

export function useTransaction(options: UseTransactionOptions = {}): UseTransactionReturn {
  const { wallet, network, config } = useArcClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])

  const getRpcClient = useCallback(() => {
    const { rpcUrl } = network
    
    const rpc = getSharedRpc(rpcUrl)
    const rpcSubscriptions = getSharedWebSocket(rpcUrl)
    
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ 
      rpc: rpc as any, 
      rpcSubscriptions: rpcSubscriptions as any
    })
    
    return { rpc, rpcSubscriptions, sendAndConfirmTransaction, rpcUrl }
  }, [network])

  const buildTransaction = useCallback(async (
    instructions: Instruction[], 
    txConfig: TransactionConfig = {}
  ): Promise<string> => {
    try {
      const transport = config.transport as Transport
      const { value: latestBlockhash }: any = await transport.request({ method: 'getLatestBlockhash', params: [] })
      
      const feePayer = txConfig.feePayer || wallet.signer
      
      if (!feePayer) {
        throw new ArcTransactionError(
          'No wallet connected. Please connect a wallet to send transactions.',
          'NO_WALLET_CONNECTED'
        )
      }
      
      const computeBudgetInstructions: Instruction[] = []
      
      if (txConfig?.computeUnitLimit) {
        computeBudgetInstructions.push(
          getSetComputeUnitLimitInstruction({ units: txConfig.computeUnitLimit }) as any
        )
      }
      
      if (txConfig?.computeUnitPrice) {
        computeBudgetInstructions.push(
          getSetComputeUnitPriceInstruction({ microLamports: txConfig.computeUnitPrice }) as any
        )
      }
      
      const allInstructions = [...computeBudgetInstructions, ...instructions]
      
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions(allInstructions, tx),
      )
      
      const signedTransaction = await signTransactionMessageWithSigners(transactionMessage)
      return getSignatureFromTransaction(signedTransaction)
      
    } catch (error) {
      if (error instanceof ArcTransactionError) {
        throw error
      }
      if (error instanceof Error) {
        throw new ArcTransactionError('Failed to build transaction', 'BUILD_FAILED', error)
      }
      throw new ArcTransactionError('Unknown error building transaction', 'BUILD_FAILED')
    }
  }, [getRpcClient, wallet.signer])

  const mutation = useMutation({
    mutationKey: ['transaction'],
    mutationFn: async ({ instructions, config: txConfig = {} }: SendTransactionParams): Promise<TransactionResult> => {
      try {
        const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = getRpcClient()
        const transport = config.transport as Transport
        const { value: latestBlockhash }: any = await transport.request({ method: 'getLatestBlockhash', params: [] })
        
        const feePayer = txConfig.feePayer || wallet.signer
        
        if (!feePayer) {
          throw new ArcTransactionError(
            'No wallet connected. Please connect a wallet to send transactions.',
            'NO_WALLET_CONNECTED'
          )
        }
        
        
        const transactionMessage = pipe(
          createTransactionMessage({ version: 0 }),
          (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
          (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
          (tx) => appendTransactionMessageInstructions(instructions, tx),
        )
        
        const signedTransaction = await signTransactionMessageWithSigners(transactionMessage)
        const signature = getSignatureFromTransaction(signedTransaction)
        
        const targetCommitment = (options.confirmationStrategy || 'confirmed') as 'confirmed' | 'finalized'
        try {
          await sendAndConfirmTransaction(signedTransaction, { 
            commitment: targetCommitment,
            skipPreflight: txConfig.skipPreflight || false
          })
        } catch (sendErr) {
          // Fallback: poll signature status to recover successful confirmations
          const timeoutMs = 60_000
          const start = Date.now()
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { value }: any = await (rpc as any).getSignatureStatuses([signature]).send()
            const status = value?.[0]
            const conf = status?.confirmationStatus
            if (conf === 'finalized' || (conf === 'confirmed' && targetCommitment === 'confirmed')) {
              break
            }
            if (Date.now() - start > timeoutMs) {
              throw new TransactionConfirmationError('Timed out waiting for confirmation', sendErr as Error)
            }
            await new Promise((r) => setTimeout(r, 1000))
          }
        }
        
        return {
          signature,
          confirmed: true
        }
        
      } catch (error) {
        queryClient.invalidateQueries({ queryKey: ['balance'] })
        queryClient.invalidateQueries({ queryKey: ['account'] })
        
        if (error instanceof ArcTransactionError) {
          throw error
        }
        
        if (error instanceof Error) {
          // Categorize error types based on message content
          if (error.message.includes('simulation')) {
            throw new TransactionSimulationError(error.message, error)
          } else if (error.message.includes('send')) {
            throw new TransactionSendError(error.message, error)
          } else if (error.message.includes('confirm')) {
            throw new TransactionConfirmationError(error.message, error)
          }
          
          throw new ArcTransactionError('Transaction failed', 'UNKNOWN_ERROR', error)
        }
        
        throw new ArcTransactionError('Unknown transaction error', 'UNKNOWN_ERROR')
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['account'] })
      
      const hasTokenInstructions = variables.instructions.some(ix => 
        ix.programAddress === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' || // Token Program
        ix.programAddress === 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'   // ATA Program
      )
      
      if (hasTokenInstructions) {
        queryClient.invalidateQueries({ queryKey: ['tokenAccount'] })
        queryClient.invalidateQueries({ queryKey: ['tokenBalance'] })
        queryClient.invalidateQueries({ queryKey: ['mint'] })
      }
      
      const hasStakeInstructions = variables.instructions.some(ix =>
        ix.programAddress === 'Stake11111111111111111111111111111111111112'
      )
      
      if (hasStakeInstructions) {
        queryClient.invalidateQueries({ queryKey: ['stakeAccount'] })
      }
    }
  })

  const sendTransaction = useCallback(
    (params: SendTransactionParams) => mutation.mutateAsync(params),
    [mutation.mutateAsync]
  )

  const sendPrebuilt = useCallback(async (tx: { wireTransaction: Uint8Array }, txConfig: TransactionConfig = {}) => {
    try {
      const { rpc, rpcSubscriptions } = getRpcClient()
      const feePayer = txConfig.feePayer || wallet.signer
      if (!feePayer) {
        throw new ArcTransactionError(
          'No wallet connected. Please connect a wallet to send transactions.',
          'NO_WALLET_CONNECTED'
        )
      }

      // Decode wire bytes into a Transaction
      const decoder = getTransactionDecoder()
      const decodedTransaction = decoder.decode(tx.wireTransaction)

      // Ensure fee payer signature via wallet signer (WalletStandardKitSigner implements modifyAndSignTransactions)
      const [signedTransaction] = await (feePayer as any).modifyAndSignTransactions([decodedTransaction])
      // Get base64-encoded wire transaction using Kit's utility
      const base64Transaction = getBase64EncodedWireTransaction(signedTransaction as any)
      const sentSignature: string = await (rpc as any).sendTransaction(base64Transaction, {
        encoding: 'base64',
        skipPreflight: txConfig.skipPreflight || false,
      }).send()

      // Use WebSocket subscription for faster confirmation
      const targetCommitment = (options.confirmationStrategy || 'confirmed') as 'confirmed' | 'finalized'
      const timeoutMs = 60_000
      
      try {
        // Create AbortController for subscription
        const abortController = new AbortController()
        
        // Subscribe to signature updates via WebSocket
        const subscription = await (rpcSubscriptions as any).signatureNotifications(
          sentSignature,
          { commitment: targetCommitment }
        ).subscribe({ abortSignal: abortController.signal })
        let removeListener: (() => void) | null = null
        const safeCleanup = () => {
          try {
            abortController.abort()
            const sub: any = subscription as any
            removeListener?.()
            sub.unsubscribe?.()
            sub.abort?.()
            sub.close?.()
          } catch {}
        }
        
        // Race between subscription and timeout
        const confirmed = await Promise.race([
          new Promise<boolean>((resolve, reject) => {
            const timeout = setTimeout(() => {
              safeCleanup()
              reject(new TransactionConfirmationError('Timed out waiting for confirmation'))
            }, timeoutMs)
            
            const onData = (notification: any) => {
              if (notification.value?.err) {
                clearTimeout(timeout)
                safeCleanup()
                reject(new TransactionConfirmationError(`Transaction failed: ${JSON.stringify(notification.value.err)}`))
              } else if (notification.value?.confirmationStatus === targetCommitment || 
                        notification.value?.confirmationStatus === 'finalized') {
                clearTimeout(timeout)
                safeCleanup()
                resolve(true)
              }
            }
            subscription.on('data', onData)
            removeListener = () => subscription.off?.('data', onData)
          }),
          // Fallback polling in case WebSocket fails
          (async () => {
            await new Promise(r => setTimeout(r, 2000)) // Give WS 2s head start
            const start = Date.now()
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { value } = await (rpc as any).getSignatureStatuses([sentSignature]).send()
              const status = value?.[0]
              const conf = status?.confirmationStatus
              if (conf === 'finalized' || (conf === 'confirmed' && targetCommitment === 'confirmed')) {
                return true
              }
              if (Date.now() - start > timeoutMs - 2000) {
                throw new TransactionConfirmationError('Timed out waiting for confirmation')
              }
              await new Promise((r) => setTimeout(r, 3000)) // Poll less frequently as backup
            }
          })()
        ])
      } catch (wsError) {
        // If WebSocket fails, fall back to polling
        console.warn('[Arc] WebSocket confirmation failed, using polling:', wsError)
        const start = Date.now()
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value } = await (rpc as any).getSignatureStatuses([sentSignature]).send()
          const status = value?.[0]
          const conf = status?.confirmationStatus
          if (conf === 'finalized' || (conf === 'confirmed' && targetCommitment === 'confirmed')) {
            break
          }
          if (Date.now() - start > timeoutMs) {
            throw new TransactionConfirmationError('Timed out waiting for confirmation')
          }
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      // Invalidate common queries after confirmation
      try {
        queryClient.invalidateQueries({ queryKey: ['balance'] })
        queryClient.invalidateQueries({ queryKey: ['account'] })
        queryClient.invalidateQueries({ queryKey: ['tokenAccount'] })
        queryClient.invalidateQueries({ queryKey: ['tokenBalance'] })
        queryClient.invalidateQueries({ queryKey: ['mint'] })
      } catch {}

      return { signature: sentSignature, confirmed: true }
    } catch (error) {
      // Surface underlying error more clearly
      if (error instanceof ArcTransactionError) throw error
      
      // Check for user rejection/cancellation
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isUserRejection = errorMessage.toLowerCase().includes('reject') || 
                             errorMessage.toLowerCase().includes('cancel') ||
                             errorMessage.toLowerCase().includes('denied') ||
                             errorMessage.toLowerCase().includes('user')
      
      if (isUserRejection) {
        throw new ArcTransactionError('Transaction cancelled by user', 'USER_CANCELLED', error as Error)
      }
      
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('[Arc/useTransaction] sendPrebuilt failed:', error)
        throw new ArcTransactionError(`Failed to send prebuilt transaction: ${error.message}`,'SEND_FAILED', error)
      }
      
      // eslint-disable-next-line no-console
      console.error('[Arc/useTransaction] sendPrebuilt unknown error:', error)
      throw new ArcTransactionError('Unknown error sending prebuilt transaction', 'SEND_FAILED')
    }
  }, [getRpcClient, wallet.signer])

  return {
    sendTransaction,
    sendPrebuilt,
    buildTransaction,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset
  }
}