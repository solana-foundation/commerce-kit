import {
  createJsonRpcApi,
  createRpc,
  createDefaultRpcTransport,
  Transaction,
  RpcRequest,
  getBase64EncodedWireTransaction,
  Base64EncodedWireTransaction,
} from "gill";

// Kora RPC API type definitions
type KoraRpcApi = {
  signTransactionIfPaid(transaction: string): SignTransactionIfPaidResponse;
  liveness(): LivenessResponse;
};

interface SignTransactionIfPaidRequest {
  transaction: string;
  // Add payment proof fields
}

interface SignTransactionIfPaidResponse {
  result: {
    transaction: string;
    signed_transaction: string;
  };
}

interface LivenessResponse {
  status: string;
}

// Create Kora RPC client
function createKoraRpc(koraEndpoint: string) {
  const koraApi = createJsonRpcApi<KoraRpcApi>({
    requestTransformer: (request: RpcRequest) => {
      const { params } = request;

      // For methods without parameters, return empty array
      if (!params) {
        return {
          methodName: request.methodName,
          params: [],
        };
      }
      // For methods with parameters, ensure they're properly formatted
      return {
        methodName: request.methodName,
        params,
      };
    },
    responseTransformer: (response) => response,
  });

  const transport = createDefaultRpcTransport({
    url: koraEndpoint,
  });

  return createRpc({
    api: koraApi,
    transport,
  });
}

// Sign a transaction using Kora RPC
async function signTransactionIfPaidWithKora({
  koraEndpoint,
  transaction,
}: {
  koraEndpoint: string;
  transaction: Transaction;
}): Promise<{ signedTransaction: Base64EncodedWireTransaction }> {
  try {
    const koraRpc = createKoraRpc(koraEndpoint);

    const serializedTx = getBase64EncodedWireTransaction(transaction);
    const response = await koraRpc.signTransactionIfPaid(serializedTx).send();

    return {
      signedTransaction: response.result
        .signed_transaction as Base64EncodedWireTransaction,
    };
  } catch (error) {
    console.error("❌ Error calling Kora:", error);
    throw error;
  }
}

// Helper function to call any Kora RPC method
async function callKoraRpc<TMethod extends keyof KoraRpcApi>(
  koraEndpoint: string,
  method: TMethod,
  params?: Parameters<KoraRpcApi[TMethod]>[0]
): Promise<ReturnType<KoraRpcApi[TMethod]>> {
  const koraRpc = createKoraRpc(koraEndpoint);

  // @ts-ignore - TypeScript has trouble with dynamic method calls
  const rpcMethod = koraRpc[method];

  if (params) {
    return await rpcMethod(params).send();
  } else {
    return await rpcMethod().send();
  }
}

export {
  createKoraRpc,
  signTransactionIfPaidWithKora,
  callKoraRpc,
  type KoraRpcApi,
  type SignTransactionIfPaidRequest,
  type SignTransactionIfPaidResponse,
};
