extern crate alloc;

use alloc::vec::Vec;
use pinocchio::{
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
    sysvars::{clock::Clock, Sysvar},
};
use shank::{ShankAccount, ShankType};

use crate::{
    constants::{PAYMENT_SEED, SECONDS_PER_DAY},
    error::CommerceProgramError,
    ID as COMMERCE_PROGRAM_ID,
};

use super::discriminator::{AccountSerialize, CommerceAccountDiscriminators, Discriminator};

#[derive(Clone, Debug, PartialEq, ShankType)]
#[repr(u8)]
pub enum Status {
    Paid = 0,
    Cleared = 1,
    Refunded = 2,
}

impl Status {
    pub fn from_u8(value: u8) -> Result<Self, ProgramError> {
        match value {
            0 => Ok(Status::Paid),
            1 => Ok(Status::Cleared),
            2 => Ok(Status::Refunded),
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
    pub bump: u8,
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
        data.push(self.bump);
        data
    }
}

impl Payment {
    pub const LEN: usize = 1 + // discriminator
        4 + // order_id
        8 + // amount
        8 + // created_at
        1 + // status
        1; // bump

    pub fn validate_status(&self, status: Status) -> Result<(), ProgramError> {
        if self.status != status {
            return Err(CommerceProgramError::InvalidPaymentStatus.into());
        }
        Ok(())
    }

    pub fn validate_not_status(&self, status: Status) -> Result<(), ProgramError> {
        if self.status == status {
            return Err(CommerceProgramError::InvalidPaymentStatus.into());
        }
        Ok(())
    }

    pub fn validate_can_close(&self, days_to_close: u16) -> Result<(), ProgramError> {
        self.validate_not_status(Status::Paid)?;

        let now = Clock::get()?.unix_timestamp;

        let created_at = self.created_at;
        let time_diff_in_days = now
            .checked_sub(created_at)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .checked_div(SECONDS_PER_DAY)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        if time_diff_in_days < days_to_close as i64 {
            return Err(CommerceProgramError::PaymentCloseWindowNotReached.into());
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
        let (pda, bump) = find_program_address(
            &[
                PAYMENT_SEED,
                merchant_operator_config.as_ref(),
                buyer.as_ref(),
                mint.as_ref(),
                &order_id_seed,
            ],
            &COMMERCE_PROGRAM_ID,
        );

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

        let order_id = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
        offset += 4;

        let amount = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
        offset += 8;

        let created_at = i64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
        offset += 8;

        let status = Status::from_u8(data[offset])?;
        offset += 1;

        let bump = data[offset];

        Ok(Self {
            order_id,
            amount,
            created_at,
            status,
            bump,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_status_from_u8() {
        assert_eq!(Status::from_u8(0).unwrap(), Status::Paid);
        assert_eq!(Status::from_u8(1).unwrap(), Status::Cleared);
        assert_eq!(Status::from_u8(2).unwrap(), Status::Refunded);
        assert!(Status::from_u8(3).is_err());
        assert!(Status::from_u8(255).is_err());
    }

    #[test]
    fn test_validate_status_success() {
        let payment = Payment {
            order_id: 123,
            amount: 1000,
            created_at: 1234567890,
            status: Status::Paid,
            bump: 255,
        };

        assert!(payment.validate_status(Status::Paid).is_ok());
    }

    #[test]
    fn test_validate_status_failure() {
        let payment = Payment {
            order_id: 123,
            amount: 1000,
            created_at: 1234567890,
            status: Status::Paid,
            bump: 255,
        };

        let result = payment.validate_status(Status::Cleared);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::InvalidPaymentStatus.into()
        );
    }

    #[test]
    fn test_validate_not_status_success() {
        let payment = Payment {
            order_id: 123,
            amount: 1000,
            created_at: 1234567890,
            status: Status::Paid,
            bump: 255,
        };

        assert!(payment.validate_not_status(Status::Cleared).is_ok());
        assert!(payment.validate_not_status(Status::Refunded).is_ok());
    }

    #[test]
    fn test_validate_not_status_failure() {
        let payment = Payment {
            order_id: 123,
            amount: 1000,
            created_at: 1234567890,
            status: Status::Cleared,
            bump: 255,
        };

        let result = payment.validate_not_status(Status::Cleared);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::InvalidPaymentStatus.into()
        );
    }

    #[test]
    fn test_payment_serialization() {
        let payment = Payment {
            order_id: 12345,
            amount: 5000000,
            created_at: 1640995200,
            status: Status::Paid,
            bump: 254,
        };

        let bytes = payment.to_bytes_inner();
        assert_eq!(bytes.len(), Payment::LEN - 1); // Excluding discriminator

        let mut full_data = vec![Payment::DISCRIMINATOR];
        full_data.extend_from_slice(&bytes);

        let deserialized = Payment::try_from_bytes(&full_data).unwrap();
        assert_eq!(deserialized, payment);
    }

    #[test]
    fn test_payment_serialization_all_statuses() {
        for (_status_val, status) in [
            (0, Status::Paid),
            (1, Status::Cleared),
            (2, Status::Refunded),
        ] {
            let payment = Payment {
                order_id: 999,
                amount: u64::MAX,
                created_at: i64::MIN,
                status: status.clone(),
                bump: 1,
            };

            let bytes = payment.to_bytes_inner();
            let mut full_data = vec![Payment::DISCRIMINATOR];
            full_data.extend_from_slice(&bytes);

            let deserialized = Payment::try_from_bytes(&full_data).unwrap();
            assert_eq!(deserialized, payment);
            assert_eq!(deserialized.status, status);
        }
    }

    #[test]
    fn test_payment_try_from_bytes_wrong_discriminator() {
        let mut data = vec![0; Payment::LEN];
        data[0] = 99; // Wrong discriminator

        let result = Payment::try_from_bytes(&data);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), ProgramError::InvalidAccountData);
    }

    #[test]
    fn test_payment_try_from_bytes_invalid_status() {
        let mut data = vec![Payment::DISCRIMINATOR];
        data.extend_from_slice(&123u32.to_le_bytes()); // order_id
        data.extend_from_slice(&1000u64.to_le_bytes()); // amount
        data.extend_from_slice(&1234567890i64.to_le_bytes()); // created_at
        data.push(99); // Invalid status
        data.push(255); // bump

        let result = Payment::try_from_bytes(&data);
        assert!(result.is_err());
    }
}
