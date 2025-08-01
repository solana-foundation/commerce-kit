import { createSolanaClient } from "gill";

export interface SolanaClientConfig {
  network: "mainnet" | "devnet" | "localnet";
  rpcUrl?: string;
}

export interface CommerceClient {
  rpc: any;
  sendAndConfirmTransaction: any;
  network: string;
}

export function createCommerceClient(config: SolanaClientConfig): CommerceClient {
  const urlOrMoniker = config.rpcUrl || config.network;
  
  const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker,
  });

  return {
    rpc,
    sendAndConfirmTransaction,
    network: config.network,
  };
}
