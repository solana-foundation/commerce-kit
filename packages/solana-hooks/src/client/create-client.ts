import type { Lamports, TransactionSigner } from '@solana/kit'
import { address as toAddress, createSolanaRpc } from '@solana/kit'
import { fetchMint, TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda } from '@solana-program/token'
import { createTransactionBuilder, createTransactionContext, type TransactionBuilder, type SOLTransferResult, type TokenTransferResult, type TokenCreationResult, type TokenMintResult, type TokenBurnResult, type TokenAccountCreationResult } from '../core/transaction-builder'
import { createHttpTransport } from '../transports/http'
import type { Transport } from '../transports/types'

export interface CreateClientParams {
  transport?: Transport
  rpcUrl?: string
  cluster?: 'mainnet' | 'devnet' | 'testnet'
  commitment?: 'processed' | 'confirmed' | 'finalized'
  debug?: boolean
}

export interface Client {
  getBalance(address: string, opts?: { signal?: AbortSignal }): Promise<Lamports>
  getAccountInfo(address: string, opts?: { signal?: AbortSignal }): Promise<any>
  getMint(mint: string, opts?: { signal?: AbortSignal }): Promise<any>
  getTokenAccount(mint: string, owner: string, opts?: { signal?: AbortSignal }): Promise<any | null>
  getTokenBalance(mint: string, owner: string, opts?: { signal?: AbortSignal }): Promise<any | null>
  transferSOL(to: string, amount: bigint, signer: TransactionSigner): Promise<SOLTransferResult>
  transferToken(mint: string, to: string, amount: bigint, signer: TransactionSigner, createAccountIfNeeded?: boolean): Promise<TokenTransferResult>
  createToken(decimals: number, payer: TransactionSigner, options?: { mintAuthority?: string; freezeAuthority?: string | null }): Promise<TokenCreationResult>
  mintTokens(mint: string, to: string, amount: bigint, mintAuthority: TransactionSigner): Promise<TokenMintResult>
  burnTokens(mint: string, amount: bigint, decimals: number, owner: TransactionSigner): Promise<TokenBurnResult>
  createTokenAccount(mint: string, owner: string, payer: TransactionSigner): Promise<TokenAccountCreationResult>
}

function inferRpcUrl(cluster?: 'mainnet' | 'devnet' | 'testnet'): string {
  if (cluster === 'mainnet') return 'https://api.mainnet-beta.solana.com'
  if (cluster === 'testnet') return 'https://api.testnet.solana.com'
  return 'https://api.devnet.solana.com'
}

export function createClient(params: CreateClientParams = {}): Client {
  const rpcUrl = params.rpcUrl ?? inferRpcUrl(params.cluster)
  const transport = params.transport ?? createHttpTransport({ url: rpcUrl, timeoutMs: 15_000, retry: { attempts: 2, strategy: 'exponential', baseDelayMs: 300, jitter: true } })
  const commitment = params.commitment ?? 'confirmed'
  const solanaRpc = createSolanaRpc(rpcUrl)
  let builder: TransactionBuilder | undefined
  function getBuilder(): TransactionBuilder {
    if (!builder) builder = createTransactionBuilder(createTransactionContext(rpcUrl, commitment, params.debug))
    return builder
  }

  async function getBalance(addr: string, opts?: { signal?: AbortSignal }): Promise<Lamports> {
    const { value } = await solanaRpc.getBalance(toAddress(addr)).send()
    return value
  }

  async function getAccountInfo(addr: string, opts?: { signal?: AbortSignal }): Promise<any> {
    const { value } = await solanaRpc.getAccountInfo(toAddress(addr)).send()
    return value
  }

  async function getMint(mint: string): Promise<any> {
    const data = await fetchMint(solanaRpc, toAddress(mint))
    return data.data
  }

  async function getTokenAccount(mint: string, owner: string): Promise<any | null> {
    const [ata] = await findAssociatedTokenPda({ mint: toAddress(mint), owner: toAddress(owner), tokenProgram: TOKEN_PROGRAM_ADDRESS })
    const { value: accountInfo } = await solanaRpc.getAccountInfo(ata, { encoding: 'jsonParsed' }).send()
    if (!accountInfo) return null
    if (!accountInfo.data || typeof accountInfo.data === 'string') throw new Error('Account data not parsed')
    const parsed: any = accountInfo.data
    if (!parsed.program || parsed.program !== 'spl-token' || !parsed.parsed || parsed.parsed.type !== 'account') throw new Error('Not an SPL Token account')
    const info = parsed.parsed.info
    return {
      address: ata,
      mint: toAddress(info.mint),
      owner: toAddress(info.owner),
      amount: BigInt(info.tokenAmount.amount),
      decimals: info.tokenAmount.decimals,
      uiAmount: info.tokenAmount.uiAmount || 0,
      uiAmountString: info.tokenAmount.uiAmountString,
      state: info.state as 'initialized' | 'uninitialized' | 'frozen',
      isNative: info.isNative || false,
      closeAuthority: info.closeAuthority ? toAddress(info.closeAuthority) : null,
      delegate: info.delegate ? toAddress(info.delegate) : null,
      delegatedAmount: info.delegatedAmount ? BigInt(info.delegatedAmount.amount) : undefined,
      lamports: BigInt(accountInfo.lamports),
      rentEpoch: Number(accountInfo.rentEpoch) || 0,
    }
  }

  async function getTokenBalance(mint: string, owner: string): Promise<any | null> {
    const account = await getTokenAccount(mint, owner)
    if (!account) return null
    return {
      mint: account.mint,
      amount: account.amount,
      decimals: account.decimals,
      uiAmount: account.uiAmount,
      uiAmountString: account.uiAmountString,
      tokenAccount: account.address,
    }
  }

  return {
    getBalance,
    getAccountInfo,
    getMint,
    getTokenAccount,
    getTokenBalance,
    transferSOL: (to, amount, signer) => getBuilder().transferSOL(to, amount, signer),
    transferToken: (mint, to, amount, signer, createAccountIfNeeded) => getBuilder().transferToken(mint, to, amount, signer, createAccountIfNeeded),
    createToken: (decimals, payer, options) => getBuilder().createToken(decimals, payer, options),
    mintTokens: (mint, to, amount, mintAuthority) => getBuilder().mintTokens(mint, to, amount, mintAuthority),
    burnTokens: (mint, amount, decimals, owner) => getBuilder().burnTokens(mint, amount, decimals, owner),
    createTokenAccount: (mint, owner, payer) => getBuilder().createTokenAccount(mint, owner, payer),
  }
}


