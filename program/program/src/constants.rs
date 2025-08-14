use crate::ID as COMMERCE_PROGRAM_ID;
use const_crypto::ed25519;
use pinocchio::pubkey::Pubkey;

pub const POLICY_SIZE: usize = 100;
pub const SECONDS_PER_HOUR: i64 = 3600;
pub const SECONDS_PER_DAY: i64 = 86400;
pub const MAX_BPS: u64 = 10_000;

// Seeds and PDAs
pub const MERCHANT_SEED: &[u8] = b"merchant";
pub const MERCHANT_OPERATOR_CONFIG_SEED: &[u8] = b"merchant_operator_config";
pub const OPERATOR_SEED: &[u8] = b"operator";
pub const PAYMENT_SEED: &[u8] = b"payment";
pub const EVENT_AUTHORITY_SEED: &[u8] = b"event_authority";

// Anchor Compatitable Discriminator: Sha256(anchor:event)[..8]
pub const EVENT_IX_TAG: u64 = 0x1d9acb512ea545e4;
pub const EVENT_IX_TAG_LE: &[u8] = EVENT_IX_TAG.to_le_bytes().as_slice();

// Default Token Mint Addresses
#[cfg(not(feature = "devnet"))]
pub const USDC_MINT: Pubkey = [
    198, 250, 122, 243, 190, 219, 173, 58, 61, 101, 243, 106, 171, 201, 116, 49, 177, 187, 228,
    194, 210, 246, 224, 228, 124, 166, 2, 3, 69, 47, 93, 97,
];

#[cfg(not(feature = "devnet"))]
pub const USDT_MINT: Pubkey = [
    206, 1, 14, 96, 175, 237, 178, 39, 23, 189, 99, 25, 47, 84, 20, 90, 63, 150, 90, 51, 187, 130,
    210, 199, 2, 158, 178, 206, 30, 32, 130, 100,
];

// Devnet Token Mint Addresses
#[cfg(feature = "devnet")]
pub const USDC_MINT: Pubkey = [
    59, 68, 44, 179, 145, 33, 87, 241, 58, 147, 61, 1, 52, 40, 45, 3, 43, 95, 254, 205, 1, 162,
    219, 241, 183, 121, 6, 8, 223, 0, 46, 167,
];

#[cfg(feature = "devnet")]
pub const USDT_MINT: Pubkey = [
    13, 138, 253, 12, 76, 80, 19, 33, 40, 144, 36, 51, 181, 40, 102, 228, 219, 211, 252, 141, 178,
    28, 220, 208, 221, 148, 254, 151, 94, 90, 199, 185,
];

// Event Authority PDA
pub mod event_authority_pda {

    use super::*;

    const EVENT_AUTHORITY_AND_BUMP: ([u8; 32], u8) =
        ed25519::derive_program_address(&[EVENT_AUTHORITY_SEED], &COMMERCE_PROGRAM_ID);

    pub const ID: Pubkey = EVENT_AUTHORITY_AND_BUMP.0;
    pub const BUMP: u8 = EVENT_AUTHORITY_AND_BUMP.1;
}
