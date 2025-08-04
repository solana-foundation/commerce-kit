import { createSolanaClient, SolanaClient } from "gill";

export interface SolanaClientConfig {
  network: "mainnet" | "devnet" | "localnet";
  rpcUrl?: string;
}

export interface CommerceClient {
  rpc: SolanaClient['rpc'];
  sendAndConfirmTransaction: SolanaClient['sendAndConfirmTransaction'];
  network: string;
}

export function createCommerceClient(config: SolanaClientConfig): CommerceClient {
  const urlOrMoniker = config.rpcUrl || config.network;
  
  const client = createSolanaClient({
    urlOrMoniker,
  });

  return {
    rpc: client.rpc,
    sendAndConfirmTransaction: client.sendAndConfirmTransaction,
    network: config.network,
  };
}
