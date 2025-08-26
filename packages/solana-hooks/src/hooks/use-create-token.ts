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
  generateKeyPairSigner,
  address,
  type Address,
  type TransactionSigner,
  type Instruction
} from '@solana/kit'
import { getCreateAccountInstruction } from '@solana-program/system'
import { 
  getInitializeMintInstruction, 
  getMintSize, 
  TOKEN_PROGRAM_ADDRESS 
} from '@solana-program/token'

export interface CreateTokenOptions {
  decimals?: number
  mintAuthority?: string | Address
  freezeAuthority?: string | Address | null
  payer?: string | Address
}

export interface CreateTokenResult {
  signature: string
  mint: Address
  decimals: number
  mintAuthority: Address
  freezeAuthority?: Address | null
  payer: Address
  blockTime?: number
  slot?: number
}

export interface UseCreateTokenReturn {
  createToken: (options?: CreateTokenOptions) => Promise<CreateTokenResult>
  isLoading: boolean
  error: Error | null
  data: CreateTokenResult | null
  reset: () => void
}

export function useCreateToken(): UseCreateTokenReturn {
  const { wallet, network } = useArcClient()
  
  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])
  
  const mutation = useMutation({
    mutationFn: async (options: CreateTokenOptions = {}): Promise<CreateTokenResult> => {
      const { 
        decimals = 9,
        mintAuthority: optionsMintAuthority,
        freezeAuthority = null,
        payer: optionsPayer
      } = options
      
      const mintAuthority = optionsMintAuthority || wallet.address
      const payerAddress = optionsPayer || wallet.address
      
      if (!mintAuthority) {
        throw new Error('No mint authority provided and no wallet connected')
      }
      
      if (!payerAddress) {
        throw new Error('No payer address provided and no wallet connected')
      }
      
      if (!wallet.signer) {
        throw new Error('Wallet not connected or no signer available')
      }
      
      
      
      const rpc = getSharedRpc(network.rpcUrl)
      const rpcSubscriptions = getSharedWebSocket(network.rpcUrl)
      const transport = (useArcClient() as any).config.transport as Transport
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc: rpc as any, rpcSubscriptions: rpcSubscriptions as any })
      
      const mint = await generateKeyPairSigner()
      
      
      const mintSpace = BigInt(getMintSize())
      const mintRent: any = await transport.request(
        { method: 'getMinimumBalanceForRentExemption', params: [mintSpace] }
      )
      
      
      const { value: latestBlockhash }: any = await transport.request(
        { method: 'getLatestBlockhash', params: [] }
      )
      
      
      const instructions: Instruction[] = [
        getCreateAccountInstruction({
          payer: wallet.signer as TransactionSigner,
          newAccount: mint,
          lamports: mintRent,
          space: mintSpace,
          programAddress: TOKEN_PROGRAM_ADDRESS,
        }),
        getInitializeMintInstruction({
          mint: mint.address,
          decimals,
          mintAuthority: address(mintAuthority),
          freezeAuthority: freezeAuthority ? address(freezeAuthority) : null
        }),
      ]
      
      
      
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
      
      
      
      const mintAccount: any = await transport.request(
        { method: 'getAccountInfo', params: [mint.address] }
      )
      if (!mintAccount.value) {
        throw new Error('Token creation failed - mint account not found after transaction')
      }
      
      
      
      const result: CreateTokenResult = {
        signature,
        mint: mint.address,
        decimals,
        mintAuthority: address(mintAuthority),
        freezeAuthority: freezeAuthority ? address(freezeAuthority) : null,
        payer: address(payerAddress)
      }
      
      return result
    },
    onSuccess: () => {},
    onError: () => {}
  })

  return {
    createToken: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset
  }
}