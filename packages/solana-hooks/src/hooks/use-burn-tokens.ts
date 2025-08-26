'use client'

import { useMutation } from '@tanstack/react-query'
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
  getBurnCheckedInstruction
} from '@solana-program/token'

export interface BurnTokensOptions {
  mint: string | Address
  from?: string | Address
  tokenAccount?: string | Address
  amount: bigint
  decimals: number
}

export interface BurnTokensResult {
  signature: string
  mint: Address
  amount: bigint
  decimals: number
  from: Address
  fromTokenAccount: Address
  blockTime?: number
  slot?: number
}

export interface UseBurnTokensReturn {
  burnTokens: (options: BurnTokensOptions) => Promise<BurnTokensResult>
  isLoading: boolean
  error: Error | null
  data: BurnTokensResult | null
  reset: () => void
  
  mintInput: string
  amountInput: string
  decimalsInput: string
  setMintInput: (value: string) => void
  setAmountInput: (value: string) => void
  setDecimalsInput: (value: string) => void
  handleMintInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleAmountInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleDecimalsInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (event?: { preventDefault?: () => void }) => Promise<BurnTokensResult | undefined>
  burnFromInputs: () => Promise<BurnTokensResult | undefined>
}

export function useBurnTokens(
  initialMintInput: string = '',
  initialAmountInput: string = '',
  initialDecimalsInput: string = '9'
): UseBurnTokensReturn {
  const { wallet, network, config } = useArcClient()
  
  const [mintInput, setMintInput] = useState(initialMintInput)
  const [amountInput, setAmountInput] = useState(initialAmountInput)
  const [decimalsInput, setDecimalsInput] = useState(initialDecimalsInput)
  
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
    mutationFn: async (options: BurnTokensOptions): Promise<BurnTokensResult> => {
      const { 
        mint, 
        from: optionsFrom, 
        tokenAccount: explicitTokenAccount,
        amount,
        decimals
      } = options
      
      const fromAddress = optionsFrom || wallet.address
      
      if (!fromAddress) {
        throw new Error('No owner address provided and no wallet connected')
      }
      
      if (!wallet.signer) {
        throw new Error('Wallet not connected or no signer available')
      }
      
      console.log('🔥 Starting token burning...')
      console.log('📡 RPC URL:', network.rpcUrl)
      console.log('🏦 Mint:', mint)
      console.log('📤 From wallet:', fromAddress)
      console.log('💰 Amount:', amount.toString())
      console.log('🔢 Decimals:', decimals)
      
      const rpc = getSharedRpc(network.rpcUrl)
      const rpcSubscriptions = getSharedWebSocket(network.rpcUrl)
      const transport = (useArcClient() as any).config.transport as Transport
      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc: rpc as any, rpcSubscriptions: rpcSubscriptions as any })
      
      let fromTokenAccount: Address
      
      if (explicitTokenAccount) {
        fromTokenAccount = address(explicitTokenAccount)
        console.log('🎯 Using explicit token account:', fromTokenAccount)
      } else {
        console.log('🔍 Finding associated token account...')
        const [ata] = await findAssociatedTokenPda({
          mint: address(mint),
          owner: address(fromAddress),
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        })
        fromTokenAccount = ata
        console.log('✅ Found associated token account:', fromTokenAccount)
      }
      
      const accountInfo: any = await transport.request(
        { method: 'getAccountInfo', params: [fromTokenAccount] }
      )
      if (!accountInfo.value) {
        throw new Error(`Token account does not exist: ${fromTokenAccount}`)
      }
      
      console.log('✅ Token account verified')
      
      const { value: latestBlockhash }: any = await transport.request(
        { method: 'getLatestBlockhash', params: [] }
      )
      console.log('🔗 Latest blockhash:', latestBlockhash.blockhash)
      
      const burnInstruction = getBurnCheckedInstruction({
        account: fromTokenAccount,
        mint: address(mint),
        authority: address(fromAddress),
        amount,
        decimals,
      }, {
        programAddress: TOKEN_PROGRAM_ADDRESS
      })
      
      console.log('📋 Burn instruction created')
      
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayerSigner(wallet.signer as TransactionSigner, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        tx => appendTransactionMessageInstructions([burnInstruction], tx),
      )
      
      console.log('🔨 Transaction message built')
      
      const signedTransaction = await signTransactionMessageWithSigners(transactionMessage)
      const signature = getSignatureFromTransaction(signedTransaction)
      
      console.log('📡 Sending transaction, signature:', signature)
      
      await sendAndConfirmTransaction(signedTransaction, { 
        commitment: 'confirmed',
        skipPreflight: false
      })
      
      console.log('✅ Tokens burned successfully!')
      
      const result: BurnTokensResult = {
        signature,
        mint: address(mint),
        amount,
        decimals,
        from: address(fromAddress),
        fromTokenAccount
      }
      
      return result
    },
    onSuccess: (data) => {
      console.log('🎉 Token burning successful:', data)
    },
    onError: (error) => {
      console.error('❌ Token burning failed:', error)
    }
  })

  const handleMintInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMintInput(event.target.value)
  }, [])
  
  const handleAmountInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountInput(event.target.value)
  }, [])

  const handleDecimalsInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDecimalsInput(event.target.value)
  }, [])
  
  const burnFromInputs = useCallback(async () => {
    if (!mintInput || !amountInput || !decimalsInput) {
      throw new Error('Mint address, amount, and decimals are all required')
    }
    
    try {
      const amountBigInt = BigInt(amountInput)
      const decimals = parseInt(decimalsInput, 10)

      if (isNaN(decimals)) {
        throw new Error('Invalid decimals value')
      }
      
      return await mutation.mutateAsync({
        mint: mintInput,
        amount: amountBigInt,
        decimals,
      })
    } catch (error) {
      console.error('Failed to parse inputs or burn tokens:', error)
      throw error
    }
  }, [mintInput, amountInput, decimalsInput, mutation.mutateAsync])
  
  const handleSubmit = useCallback(async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    return mintInput && amountInput && decimalsInput ? burnFromInputs() : undefined
  }, [mintInput, amountInput, decimalsInput, burnFromInputs])

  return {
    burnTokens: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset,
    mintInput,
    amountInput,
    decimalsInput,
    setMintInput,
    setAmountInput,
    setDecimalsInput,
    handleMintInputChange,
    handleAmountInputChange,
    handleDecimalsInputChange,
    handleSubmit,
    burnFromInputs,
  }
}