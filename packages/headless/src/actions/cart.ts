export function createCartRequest(
    recipient: string,
    products: any[],
    options: {
        memo?: string;
        label?: string;
        message?: string;
        currency?: string;
    } = {},
) {
    const totalAmount = products.reduce((sum, product) => sum + product.price, 0);

    return {
        recipient,
        amount: totalAmount,
        currency: options.currency,
        products,
        memo: options.memo || `Cart purchase (${products.length} items)`,
        label: options.label || 'Cart Checkout',
        message: options.message || 'Thank you for your purchase!',
    };
}
