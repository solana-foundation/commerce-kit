import type { CommerceClient } from "../client";
import { OrderRequest, PaymentVerificationResult } from "../types";
import { STABLECOINS } from "../types/stablecoin";

export async function verifyPayment(
  client: CommerceClient, 
  signature: string,
  expectedAmount?: number,
  expectedRecipient?: string
): Promise<PaymentVerificationResult> {
  try {
    // Get transaction details
    const transaction = await client.rpc.getTransaction(signature, {
      encoding: "jsonParsed",
      maxSupportedTransactionVersion: 0
    }).send();

    if (!transaction.value) {
      return {
        verified: false,
        signature,
        error: "Transaction not found"
      };
    }

    const txData = transaction.value;

    // Basic verification - transaction exists and is confirmed
    let verified = !!txData.blockTime;

    // Additional verification if expected values provided
    if (verified && expectedAmount && expectedRecipient) {
      // This is a simplified check - in production you'd parse the transaction
      // instructions to verify the actual transfer amount and recipient
      verified = true; // Placeholder - implement actual parsing
    }

    return {
      verified,
      signature,
      // These would be parsed from transaction in production
      amount: expectedAmount,
      recipient: expectedRecipient,
    };

  } catch (error) {
    console.error("Error verifying payment:", error);
    return {
      verified: false,
      signature,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function waitForConfirmation(
  client: CommerceClient,
  signature: string,
  timeoutMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await verifyPayment(client, signature);
      if (result.verified) {
        return true;
      }
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      // Continue polling on errors
    }
  }
  
  return false;
} 

/**
 * Create enhanced commerce payment request
 */
export function createCommercePaymentRequest(request: OrderRequest) {
    const { recipient, amount, currency, memo, reference, items, label, message } = request;
    
    // Calculate total if products are provided
    const totalAmount = items 
      ? items.reduce((sum, item) => sum + item.price, 0)
      : amount;
    
    // Use provided reference or create a simple one without timestamps for SSR safety
    const paymentReference = reference || `commerce-${Math.floor(Math.random() * 1000000)}`;
    
    // Create Solana Pay URL
    const baseUrl = 'solana:';
    const params = new URLSearchParams();
    
    params.append('recipient', recipient);
    params.append('amount', totalAmount.toString());
    
    if (currency && currency !== 'SOL') {
      params.append('spl-token', currency);
    }
    
    if (memo) {
      params.append('memo', memo);
    }
    
    params.append('reference', paymentReference);
    
    if (label) {
      params.append('label', label);
    }
    
    if (message) {
      params.append('message', message);
    }
  
    const url = baseUrl + recipient + '?' + params.toString();
    
    return {
      url,
      recipient,
      amount: totalAmount,
      currency: currency || 'SOL',
      reference: paymentReference,
      items,
      label,
      message,
      qrCode: url, // For QR code generation
      // Helper methods
      getAmountDisplay: () => {
        if (currency && STABLECOINS[currency]) {
          const stablecoin = STABLECOINS[currency];
          return `${(totalAmount / Math.pow(10, stablecoin.decimals)).toFixed(stablecoin.decimals)} ${stablecoin.symbol}`;
  }
        return `${totalAmount / 1000000000} SOL`;
      },
      getStablecoinConfig: () => currency ? STABLECOINS[currency] : null,
      // Generate a fresh reference with timestamp (client-side only)
      generateFreshReference: () => `commerce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
