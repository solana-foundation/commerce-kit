export type PaymentMethod = 'SOL' | 'USDC' | 'USDT';

export interface TokenConfig {
    mint?: string; // SOL doesn't have a mint address
    symbol: string;
    decimals: number;
    name: string;
    icon?: string;
}

// Token configurations for all supported payment methods
export const TOKENS: Record<PaymentMethod, TokenConfig> = {
    SOL: {
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    },
    USDC: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
    USDT: {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        decimals: 6,
        name: 'Tether USD',
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    },
};

// Legacy export for backward compatibility
export interface StablecoinConfig extends TokenConfig {
    mint: string; // Stablecoins always have mint addresses
}

export const STABLECOINS: Record<string, StablecoinConfig> = {
    USDC: TOKENS.USDC as StablecoinConfig,
    USDT: TOKENS.USDT as StablecoinConfig,
};
