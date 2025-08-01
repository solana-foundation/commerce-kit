use pinocchio::pubkey::Pubkey;

pub const POLICY_SIZE: usize = 100;
pub const SECONDS_PER_HOUR: i64 = 3600;
pub const MAX_BPS: u64 = 10_000;

// Seeds and PDAs
pub const MERCHANT_SEED: &[u8] = b"merchant";
pub const MERCHANT_OPERATOR_CONFIG_SEED: &[u8] = b"merchant_operator_config";
pub const OPERATOR_SEED: &[u8] = b"operator";
pub const PAYMENT_SEED: &[u8] = b"payment";

// Default Token Mint Addresses
pub const USDC_MINT: Pubkey = [
    198, 250, 122, 243, 190, 219, 173, 58, 61, 101, 243, 106, 171, 201, 116, 49, 177, 187, 228,
    194, 210, 246, 224, 228, 124, 166, 2, 3, 69, 47, 93, 97,
];
pub const USDT_MINT: Pubkey = [
    206, 1, 14, 96, 175, 237, 178, 39, 23, 189, 99, 25, 47, 84, 20, 90, 63, 150, 90, 51, 187, 130,
    210, 199, 2, 158, 178, 206, 30, 32, 130, 100,
];
