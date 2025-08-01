
export function createBuyNowRequest(
  recipient: string,
  product: any,
  options: {
    memo?: string;
    label?: string;
    message?: string;
  } = {}
) {
  return {
    recipient,
    amount: product.price,
    currency: product.currency,
    products: [product],
    memo: options.memo || `Purchase: ${product.name}`,
    label: options.label || product.name,
    message: options.message || `Thank you for purchasing ${product.name}!`
  };
}