import type { CommerceClient } from "../client";
import { OrderRequest, PaymentVerificationResult } from "../types";
import { STABLECOINS } from "../types/stablecoin";
import { signature, type Signature, address } from "gill";
import { getAssociatedTokenAccountAddress, TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS } from "gill/programs/token";

export async function verifyPayment(
  client: CommerceClient,
  signatureString: string,
  expectedAmount?: number,
  expectedRecipient?: string,
  expectedMint?: string
): Promise<PaymentVerificationResult> {
  try {
    // Convert string to Signature type
    const txSignature: Signature = signature(signatureString);
    
    // Get transaction details
    const transaction = await client.rpc.getTransaction(txSignature, {
      encoding: "jsonParsed",
      maxSupportedTransactionVersion: 0
    }).send();

    if (!transaction) {
      return {
        verified: false,
        signature: signatureString,
        error: "Transaction not found"
      };
    }

    const txData = transaction;

    // Basic verification - transaction exists and is confirmed
    let verified = !!txData.blockTime;

    // Additional verification if expected values provided
    if (verified && expectedRecipient && expectedAmount != null) {
      const recipientAddr = address(expectedRecipient);

      // If SOL transfer (no mint), check lamports delta at recipient index
      const acctIndex = txData.transaction.message.accountKeys.findIndex(k => k.pubkey.toString() === recipientAddr.toString());
      if (acctIndex >= 0 && txData.meta?.preBalances && txData.meta?.postBalances && !expectedMint) {
        const post = Number(txData.meta.postBalances[acctIndex] ?? 0);
        const pre = Number(txData.meta.preBalances[acctIndex] ?? 0);
        const delta = post - pre;
        verified = delta >= expectedAmount;
      }

      // If SPL transfer, check postTokenBalances for recipient ATA across Token and Token-2022
      if (!verified && expectedMint) {
        try {
          const mintAddr = address(expectedMint);
          const ataV1 = await getAssociatedTokenAccountAddress(mintAddr, recipientAddr, TOKEN_PROGRAM_ADDRESS).catch(() => null as any);
          const ataV2 = await getAssociatedTokenAccountAddress(mintAddr, recipientAddr, TOKEN_2022_PROGRAM_ADDRESS).catch(() => null as any);
          const isMatch = (acc: any) => acc && txData.meta?.postTokenBalances?.some(tb => {
            const key = txData.transaction.message.accountKeys[tb.accountIndex]?.pubkey?.toString();
            const amount = Number(tb.uiTokenAmount?.amount ?? '0');
            return key === acc.toString() && tb.mint === mintAddr.toString() && amount >= expectedAmount;
          });
          verified = isMatch(ataV1) || isMatch(ataV2) || false;
        } catch {
          verified = false;
        }
      }
    }

    return {
      verified,
      signature: signatureString,
      // These would be parsed from transaction in production
      amount: expectedAmount,
      recipient: expectedRecipient,
    };

  } catch (error) {
    return {
      verified: false,
      signature: signatureString,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function waitForConfirmation(
  client: CommerceClient,
  signatureStr: string,
  timeoutMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const sig = signature(signatureStr);
      const statuses = await client.rpc.getSignatureStatuses([sig], {
        searchTransactionHistory: true,
      }).send();
      const status = statuses.value?.[0];
      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
        return true;
      }
    } catch {
      // continue
    }
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
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
