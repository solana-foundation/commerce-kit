export function createTipRequest(
  recipient: string,
  amount: number,
  options: {
    currency?: string;
    memo?: string;
    label?: string;
    message?: string;
  } = {}
) {
  return {
    recipient,
    amount,
    memo: options.memo || 'Thank you for your support!',
    label: options.label || 'Tip',
    message: options.message || 'Thanks for the tip!',
    currency: options.currency
  };
}

