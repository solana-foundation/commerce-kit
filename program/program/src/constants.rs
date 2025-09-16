use crate::ID as COMMERCE_PROGRAM_ID;
use const_crypto::ed25519;
use pinocchio::pubkey::Pubkey;

pub const POLICY_SIZE: usize = 100;

// Time constants
pub const SECONDS_PER_HOUR: i64 = 3600;
pub const SECONDS_PER_DAY: i64 = 86400;

// Max BPS
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

// Event Authority PDA
pub mod event_authority_pda {

    use super::*;

    const EVENT_AUTHORITY_AND_BUMP: ([u8; 32], u8) =
        ed25519::derive_program_address(&[EVENT_AUTHORITY_SEED], &COMMERCE_PROGRAM_ID);

    pub const ID: Pubkey = EVENT_AUTHORITY_AND_BUMP.0;
    pub const BUMP: u8 = EVENT_AUTHORITY_AND_BUMP.1;
}
