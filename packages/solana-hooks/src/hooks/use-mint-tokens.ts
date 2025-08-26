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
  getMintToInstruction,
  getCreateAssociatedTokenInstruction
} from '@solana-program/token'
import { createInvalidator } from '../utils/invalidate'

export interface MintTokensOptions {
  mint: string | Address
  to: string | Address
  amount: bigint
  mintAuthority?: string | Address
  createAccountIfNeeded?: boolean
}

export interface MintTokensResult {
  signature: string
  mint: Address
  amount: bigint
  to: Address
  toTokenAccount: Address
  mintAuthority: Address
  createdAccount?: boolean
  blockTime?: number
  slot?: number
}

export interface UseMintTokensReturn {
  mintTokens: (options: MintTokensOptions) => Promise<MintTokensResult>
  isLoading: boolean
  error: Error | null
  data: MintTokensResult | null
  reset: () => void
  
  mintInput: string
  toInput: string
  amountInput: string
  setMintInput: (value: string) => void
  setToInput: (value: string) => void
  setAmountInput: (value: string) => void
  handleMintInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleToInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleAmountInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (event?: { preventDefault?: () => void }) => Promise<MintTokensResult | undefined>
  mintFromInputs: () => Promise<MintTokensResult | undefined>
}

export function useMintTokens(
  initialMintInput: string = '',
  initialToInput: string = '',
  initialAmountInput: string = ''
): UseMintTokensReturn {
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
    mutationFn: async (options: MintTokensOptions): Promise<MintTokensResult> => {
      const { 
        mint, 
        to, 
        amount, 
        mintAuthority: optionsMintAuthority,
        createAccountIfNeeded = true 
      } = options
      
      const mintAuthority = optionsMintAuthority || wallet.address
      
      if (!mintAuthority) {
        throw new Error('No mint authority provided and no wallet connected')
      }
      
      if (!wallet.signer) {
        throw new Error('Wallet not connected or no signer available')
      }
      
      
      
      const rpc = getSharedRpc(network.rpcUrl)
      const rpcSubscriptions = getSharedWebSocket(network.rpcUrl)
      const transport = (useArcClient() as any).config.transport as Transport
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc: rpc as any, rpcSubscriptions: rpcSubscriptions as any })
      
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
      
      const mintInstruction = getMintToInstruction({
        mint: address(mint),
        token: toTokenAccount,
        amount,
        mintAuthority: address(mintAuthority)
      })
      instructions.push(mintInstruction)
      
      
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
      
      
      
      const result: MintTokensResult = {
        signature,
        mint: address(mint),
        amount,
        to: address(to),
        toTokenAccount,
        mintAuthority: address(mintAuthority),
        createdAccount: needsToCreateAccount
      }
      
      return result
    },
    onSuccess: async (result) => {
      // Invalidate cache for mint and recipient
      const invalidator = createInvalidator(queryClient)
      await invalidator.invalidateAfterMint(
        result.mint.toString(),
        result.to.toString(),
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
  
  const mintFromInputs = useCallback(async () => {
    if (!mintInput || !toInput || !amountInput) {
      throw new Error('Mint address, recipient address, and amount are all required')
    }
    
    try {
      const amountBigInt = BigInt(amountInput)
      
      return await mutation.mutateAsync({
        mint: mintInput,
        to: toInput,
        amount: amountBigInt,
        createAccountIfNeeded: true,
      })
    } catch (error) { throw error }
  }, [mintInput, toInput, amountInput, mutation.mutateAsync])
  
  const handleSubmit = useCallback(async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    return mintInput && toInput && amountInput ? mintFromInputs() : undefined
  }, [mintInput, toInput, amountInput, mintFromInputs])

  return {
    mintTokens: mutation.mutateAsync,
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
    mintFromInputs,
  }
}