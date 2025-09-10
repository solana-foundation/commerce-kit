'use client'

import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
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
  getCreateAssociatedTokenInstruction
} from '@solana-program/token'

export interface CreateTokenAccountOptions {
  mint: string | Address
  owner?: string | Address
  payer?: string | Address
}

export interface CreateTokenAccountResult {
  signature: string
  mint: Address
  owner: Address
  tokenAccount: Address
  payer: Address
  blockTime?: number
  slot?: number
}

export interface UseCreateTokenAccountReturn {
  createTokenAccount: (options: CreateTokenAccountOptions) => Promise<CreateTokenAccountResult>
  isLoading: boolean
  error: Error | null
  data: CreateTokenAccountResult | null
  reset: () => void
}

export function useCreateTokenAccount(): UseCreateTokenAccountReturn {
  const { wallet, network } = useArcClient()
  
  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])
  
  const mutation = useMutation({
    mutationFn: async (options: CreateTokenAccountOptions): Promise<CreateTokenAccountResult> => {
      const { 
        mint, 
        owner: optionsOwner,
        payer: optionsPayer
      } = options
      
      const ownerAddress = optionsOwner || wallet.address
      const payerAddress = optionsPayer || wallet.address
      
      if (!ownerAddress) {
        throw new Error('No owner address provided and no wallet connected')
      }
      
      if (!payerAddress) {
        throw new Error('No payer address provided and no wallet connected')
      }
      
      if (!wallet.signer) {
        throw new Error('Wallet not connected or no signer available')
      }
      
      
      
      const rpc = getSharedRpc(network.rpcUrl)
      const transport = (useArcClient() as any).config.transport as Transport
      
      const [tokenAccount] = await findAssociatedTokenPda({
        mint: address(mint),
        owner: address(ownerAddress),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })
      
      
      
      const existingAccount: any = await transport.request(
        { method: 'getAccountInfo', params: [tokenAccount] }
      )
      if (existingAccount.value) {
        throw new Error(`Token account already exists: ${tokenAccount}`)
      }
      
      
      
      const { value: latestBlockhash }: any = await transport.request(
        { method: 'getLatestBlockhash', params: [] }
      )
      
      
      const createAccountInstruction = getCreateAssociatedTokenInstruction({
        payer: wallet.signer as TransactionSigner,
        ata: tokenAccount,
        owner: address(ownerAddress),
        mint: address(mint),
      })
      
      
      
      const rpcSubscriptions = getSharedWebSocket(network.rpcUrl)
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc: rpc as any, rpcSubscriptions: rpcSubscriptions as any })
      
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(wallet.signer as TransactionSigner, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        tx => appendTransactionMessageInstructions([createAccountInstruction], tx),
      )
      
      
      
      const signedTransaction = await signTransactionMessageWithSigners(transactionMessage)
      const signature = getSignatureFromTransaction(signedTransaction)
      
      
      
      await sendAndConfirmTransaction(signedTransaction, { 
        commitment: 'confirmed',
        skipPreflight: false
      })
      
      
      
      const newAccount: any = await transport.request(
        { method: 'getAccountInfo', params: [tokenAccount] }
      )
      if (!newAccount.value) {
        throw new Error('Token account creation failed - account not found after transaction')
      }
      
      
      
      const result: CreateTokenAccountResult = {
        signature,
        mint: address(mint),
        owner: address(ownerAddress),
        tokenAccount,
        payer: address(payerAddress)
      }
      
      return result
    },
    onSuccess: () => {},
    onError: () => {}
  })

  return {
    createTokenAccount: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset
  }
}