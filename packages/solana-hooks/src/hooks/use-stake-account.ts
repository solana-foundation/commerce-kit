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
import { 
  getCreateAccountInstruction,
  SYSTEM_PROGRAM_ADDRESS
} from '@solana-program/system'

// Note: This is a basic implementation. Full staking would require @solana-program/stake
// For now, we'll implement basic stake account creation as a foundation

export interface CreateStakeAccountOptions {
  amount: bigint 
  staker?: string | Address
  withdrawer?: string | Address
  payer?: string | Address
}

export interface StakeAccountResult {
  signature: string
  stakeAccount: Address
  amount: bigint
  staker: Address
  withdrawer: Address
  payer: Address
  blockTime?: number
  slot?: number
}

export interface UseStakeAccountReturn {
  createStakeAccount: (options: CreateStakeAccountOptions) => Promise<StakeAccountResult>
  isLoading: boolean
  error: Error | null
  data: StakeAccountResult | null
  reset: () => void
}

export function useStakeAccount(): UseStakeAccountReturn {
  const { wallet, network } = useArcClient()
  
  useEffect(() => {
    return () => {
      releaseRpcConnection(network.rpcUrl)
    }
  }, [network.rpcUrl])
  
  const mutation = useMutation({
    mutationFn: async (options: CreateStakeAccountOptions): Promise<StakeAccountResult> => {
      const { 
        amount,
        staker: optionsStaker,
        withdrawer: optionsWithdrawer,
        payer: optionsPayer
      } = options
      
      const stakerAddress = optionsStaker || wallet.address
      const withdrawerAddress = optionsWithdrawer || wallet.address
      const payerAddress = optionsPayer || wallet.address
      
      if (!stakerAddress) {
        throw new Error('No staker address provided and no wallet connected')
      }
      
      if (!withdrawerAddress) {
        throw new Error('No withdrawer address provided and no wallet connected')
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
      
      const stakeAccount = await generateKeyPairSigner()
      
      
      const stakeAccountSpace = BigInt(200)
      
      const stakeAccountRent: any = await transport.request(
        { method: 'getMinimumBalanceForRentExemption', params: [stakeAccountSpace] }
      )
      
      
      const totalAmount = stakeAccountRent + amount
      
      
      const { value: latestBlockhash }: any = await transport.request(
        { method: 'getLatestBlockhash', params: [] }
      )
      
      
      // Build instruction to create stake account
      // Note: This creates a basic account. Full staking requires additional instructions
      // that would be added in future iterations (initialize stake, delegate, etc.)
      const createAccountInstruction = getCreateAccountInstruction({
        payer: wallet.signer as TransactionSigner,
        newAccount: stakeAccount,
        lamports: totalAmount,
        space: stakeAccountSpace,
        programAddress: SYSTEM_PROGRAM_ADDRESS, // Basic account creation
      })
      
      
      
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
        { method: 'getAccountInfo', params: [stakeAccount.address] }
      )
      if (!newAccount.value) {
        throw new Error('Stake account creation failed - account not found after transaction')
      }
      
      
      
      const result: StakeAccountResult = {
        signature,
        stakeAccount: stakeAccount.address,
        amount,
        staker: address(stakerAddress),
        withdrawer: address(withdrawerAddress),
        payer: address(payerAddress)
      }
      
      return result
    },
    onSuccess: () => {},
    onError: () => {}
  })

  return {
    createStakeAccount: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset
  }
}