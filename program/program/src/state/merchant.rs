extern crate alloc;

use alloc::vec::Vec;
use pinocchio::{
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
};
use shank::ShankAccount;

use crate::constants::MERCHANT_SEED;
use crate::ID as COMMERCE_PROGRAM_ID;

use super::discriminator::{AccountSerialize, CommerceAccountDiscriminators, Discriminator};

/// Seeds: [b"merchant", owner pubkey]
#[derive(Clone, Debug, PartialEq, ShankAccount)]
#[repr(C)]
pub struct Merchant {
    pub owner: Pubkey,

    pub bump: u8,

    /// ATAs will be derived from this wallet for the merchant to receive payments
    pub settlement_wallet: Pubkey,
}

impl Discriminator for Merchant {
    const DISCRIMINATOR: u8 = CommerceAccountDiscriminators::MerchantDiscriminator as u8;
}

impl AccountSerialize for Merchant {
    fn to_bytes_inner(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(self.owner.as_ref());
        data.push(self.bump);
        data.extend_from_slice(self.settlement_wallet.as_ref());
        data
    }
}

impl Merchant {
    pub const LEN: usize = 1 + // discriminator
        32 + // owner
        1 + // bump
        32; // settlement_wallet

    pub fn validate_owner(&self, owner: &Pubkey) -> Result<(), ProgramError> {
        if self.owner.ne(owner) {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(())
    }

    pub fn validate_pda(&self, account_info_key: &Pubkey) -> Result<(), ProgramError> {
        let (pda, bump) =
            find_program_address(&[MERCHANT_SEED, self.owner.as_ref()], &COMMERCE_PROGRAM_ID);

        if pda.ne(account_info_key) || bump != self.bump {
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(())
    }

    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data[0] != Self::DISCRIMINATOR {
            return Err(ProgramError::InvalidAccountData);
        }

        let mut offset: usize = 1;

        let owner: Pubkey = data[offset..offset + 32].try_into().unwrap();
        offset += 32;

        let bump = data[offset];
        offset += 1;

        let settlement_wallet: Pubkey = data[offset..offset + 32].try_into().unwrap();

        Ok(Self {
            owner,
            bump,
            settlement_wallet,
        })
    }
}
