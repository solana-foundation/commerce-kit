'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useArcClient } from '../core/arc-client-provider'
import { getSharedRpc, getSharedWebSocket, releaseRpcConnection } from '../core/rpc-manager'
import type { Transport } from '../transports/types'
import { 
  sendAndConfirmTransactionFactory,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  address,
  type Address,
  type TransactionSigner,
  type Instruction
} from '@solana/kit'
import { 
  TOKEN_PROGRAM_ADDRESS, 
  findAssociatedTokenPda,
  getTransferInstruction,
  getCreateAssociatedTokenInstruction
} from '@solana-program/token'
import { createInvalidator } from '../utils/invalidate'

export interface TransferTokenOptions {
  mint: string | Address  // mint address
  to: string | Address    // recipient wallet address
  amount: bigint  // amount in token's smallest unit (considering decimals)
  from?: string | Address  // auto: Uses connected wallet if not provided
  createAccountIfNeeded?: boolean  // auto-create recipient's ATA if it doesn't exist
}

export interface TransferTokenResult {
  signature: string
  mint: Address
  amount: bigint
  from: Address
  to: Address
  fromTokenAccount: Address
  toTokenAccount: Address
  createdAccount?: boolean 
  blockTime?: number
  slot?: number
}

export interface UseTransferTokenReturn {
  transferToken: (options: TransferTokenOptions) => Promise<TransferTokenResult>
  isLoading: boolean
  error: Error | null
  data: TransferTokenResult | null
  reset: () => void
  
  // UI INTERACTION HELPERS
  /** Input state for token mint address */
  mintInput: string
  /** Input state for recipient address */
  toInput: string
  /** Input state for amount (in token units) */
  amountInput: string
  /** Set mint input */
  setMintInput: (value: string) => void
  /** Set recipient address input */
  setToInput: (value: string) => void
  /** Set amount input */
  setAmountInput: (value: string) => void
  /** onChange handler for mint input */
  handleMintInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** onChange handler for recipient address input */
  handleToInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** onChange handler for amount input */
  handleAmountInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** Form submission handler that transfers tokens using current input values */
  handleSubmit: (event?: { preventDefault?: () => void }) => Promise<TransferTokenResult | undefined>
  /** Shortcut to transfer tokens using current input values */
  transferFromInputs: () => Promise<TransferTokenResult | undefined>
}

export function useTransferToken(
  initialMintInput: string = '',
  initialToInput: string = '',
  initialAmountInput: string = ''
): UseTransferTokenReturn {
  const { wallet, network, config } = useArcClient()
  const queryClient = useQueryClient()
  
  const [mintInput, setMintInput] = useState(initialMintInput)
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
    mutationFn: async (options: TransferTokenOptions): Promise<TransferTokenResult> => {
      const { 
        mint, 
        to, 
        amount, 
        from: optionsFrom,
        createAccountIfNeeded = true 
      } = options
      
      const fromAddress = optionsFrom || wallet.address
      
      if (!fromAddress) {
        throw new Error('No sender address provided and no wallet connected')
      }
      
      if (!wallet.signer) {
        throw new Error('Wallet not connected or no signer available')
      }
      
      
      
      const rpc = getSharedRpc(network.rpcUrl)
      const transport = (useArcClient() as any).config.transport as Transport
      
      const [fromTokenAccount] = await findAssociatedTokenPda({
        mint: address(mint),
        owner: address(fromAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
      
      const [toTokenAccount] = await findAssociatedTokenPda({
        mint: address(mint),
        owner: address(to),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
      
      
      
      const toAccountInfo: any = await transport.request(
        { method: 'getAccountInfo', params: [toTokenAccount] }
      )
      const needsToCreateAccount = !toAccountInfo.value && createAccountIfNeeded
      
      if (!toAccountInfo.value && !createAccountIfNeeded) {
        throw new Error('Recipient token account does not exist and createAccountIfNeeded is false')
      }
      
      
      
      const { value: latestBlockhash }: any = await transport.request(
        { method: 'getLatestBlockhash', params: [] }
      )
      
      
      const instructions: Instruction[] = []
      
      if (needsToCreateAccount) {
        const createAccountInstruction = getCreateAssociatedTokenInstruction({
          payer: wallet.signer as TransactionSigner,
          ata: toTokenAccount,
          owner: address(to),
          mint: address(mint),
        })
        instructions.push(createAccountInstruction)
      
      }
      
      const transferInstruction = getTransferInstruction({
        source: fromTokenAccount,
        destination: toTokenAccount,
        authority: address(fromAddress),
        amount,
      })
      instructions.push(transferInstruction)
      
      
      const rpcSubscriptions = getSharedWebSocket(network.rpcUrl)
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc: rpc as any, rpcSubscriptions: rpcSubscriptions as any })
      
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(wallet.signer as TransactionSigner, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        tx => appendTransactionMessageInstructions(instructions, tx),
      )
      
      
      
      const signedTransaction = await signTransactionMessageWithSigners(transactionMessage)
      const signature = getSignatureFromTransaction(signedTransaction)
      
      
      
      await sendAndConfirmTransaction(signedTransaction, { 
        commitment: 'confirmed',
        skipPreflight: false
      })
      
      
      
      const result: TransferTokenResult = {
        signature,
        mint: address(mint),
        amount,
        from: address(fromAddress),
        to: address(to),
        fromTokenAccount,
        toTokenAccount,
        createdAccount: needsToCreateAccount
      }
      
      return result
    },
    onSuccess: async (result) => {
      // Invalidate cache for both sender and recipient token accounts
      const invalidator = createInvalidator(queryClient)
      await invalidator.invalidateAfterTokenTransfer(
        result.from.toString(),
        result.to.toString(),
        result.mint.toString(),
        { refetch: true }
      )
    },
    onError: () => {}
  })

  const handleMintInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMintInput(event.target.value)
  }, [])
  
  const handleToInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setToInput(event.target.value)
  }, [])
  
  const handleAmountInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountInput(event.target.value)
  }, [])
  
  const transferFromInputs = useCallback(async () => {
    if (!mintInput || !toInput || !amountInput) {
      throw new Error('Mint address, recipient address, and amount are all required')
    }
    
    try {
      // Parse amount as BigInt (assume token has standard decimals handling)
      const amountBigInt = BigInt(amountInput)
      
      return await mutation.mutateAsync({
        mint: mintInput,
        to: toInput,
        amount: amountBigInt,
        createAccountIfNeeded: true, // Default to auto-create
      })
    } catch (error) { throw error }
  }, [mintInput, toInput, amountInput, mutation.mutateAsync])
  
  const handleSubmit = useCallback(async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    return mintInput && toInput && amountInput ? transferFromInputs() : undefined
  }, [mintInput, toInput, amountInput, transferFromInputs])

  return {
    transferToken: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset,
    mintInput,
    toInput,
    amountInput,
    setMintInput,
    setToInput,
    setAmountInput,
    handleMintInputChange,
    handleToInputChange,
    handleAmountInputChange,
    handleSubmit,
    transferFromInputs,
  }
}