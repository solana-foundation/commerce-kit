extern crate alloc;

use alloc::vec::Vec;
use pinocchio::{
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
};
use shank::{ShankAccount, ShankType};

use crate::{constants::PAYMENT_SEED, error::CommerceProgramError, ID as COMMERCE_PROGRAM_ID};

use super::discriminator::{AccountSerialize, CommerceAccountDiscriminators, Discriminator};

#[derive(Clone, Debug, PartialEq, ShankType)]
#[repr(u8)]
pub enum Status {
    Paid = 0,
    Cleared = 1,
    Chargedback = 2,
    Refunded = 3,
}

impl Status {
    pub fn from_u8(value: u8) -> Result<Self, ProgramError> {
        match value {
            0 => Ok(Status::Paid),
            1 => Ok(Status::Cleared),
            2 => Ok(Status::Chargedback),
            3 => Ok(Status::Refunded),
            _ => Err(ProgramError::InvalidAccountData),
        }
    }
}

// PDA seeds: [b"payment", merchant_operator_config, buyer, mint, order_id]
#[derive(Clone, Debug, PartialEq, ShankAccount)]
#[repr(C)]
pub struct Payment {
    // Most data is in the PDA seeds: operator, buyer, merchant, mint are derivable
    pub order_id: u32,
    pub amount: u64,
    pub created_at: i64,
    pub status: Status,
}

impl Discriminator for Payment {
    const DISCRIMINATOR: u8 = CommerceAccountDiscriminators::PaymentDiscriminator as u8;
}

impl AccountSerialize for Payment {
    fn to_bytes_inner(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(&self.order_id.to_le_bytes());
        data.extend_from_slice(&self.amount.to_le_bytes());
        data.extend_from_slice(&self.created_at.to_le_bytes());
        data.push(self.status.clone() as u8);
        data
    }
}

impl Payment {
    pub const LEN: usize = 1 + // discriminator
        4 + // order_id
        8 + // amount
        8 + // created_at
        1; // status

    pub fn validate_status(&self, status: Status) -> Result<(), ProgramError> {
        if self.status != status {
            return Err(CommerceProgramError::InvalidPaymentStatus.into());
        }
        Ok(())
    }

    pub fn validate_pda(
        &self,
        account_info_key: &Pubkey,
        merchant_operator_config: &Pubkey,
        buyer: &Pubkey,
        mint: &Pubkey,
    ) -> Result<(), ProgramError> {
        let order_id_seed = self.order_id.to_le_bytes();
        let (pda, _bump) = find_program_address(
            &[
                PAYMENT_SEED,
                merchant_operator_config.as_ref(),
                buyer.as_ref(),
                mint.as_ref(),
                &order_id_seed,
            ],
            &COMMERCE_PROGRAM_ID,
        );

        if pda.ne(account_info_key) {
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(())
    }

    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data[0] != Self::DISCRIMINATOR {
            return Err(ProgramError::InvalidAccountData);
        }

        let mut offset: usize = 1;

        let order_id = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
        offset += 4;

        let amount = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
        offset += 8;

        let created_at = i64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
        offset += 8;

        let status = Status::from_u8(data[offset])?;

        Ok(Self {
            order_id,
            amount,
            created_at,
            status,
        })
    }
}
