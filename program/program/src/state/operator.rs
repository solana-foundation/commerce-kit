extern crate alloc;

use alloc::vec::Vec;
use pinocchio::{
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
};
use shank::ShankAccount;

use crate::ID as COMMERCE_PROGRAM_ID;
use crate::{constants::OPERATOR_SEED, error::CommerceProgramError};

use super::discriminator::{AccountSerialize, CommerceAccountDiscriminators, Discriminator};

/// Seeds: [b"operator", owner pubkey]
#[derive(Clone, Debug, PartialEq, ShankAccount)]
#[repr(C)]
pub struct Operator {
    pub owner: Pubkey,

    pub bump: u8,
}

impl Discriminator for Operator {
    const DISCRIMINATOR: u8 = CommerceAccountDiscriminators::OperatorDiscriminator as u8;
}

impl AccountSerialize for Operator {
    fn to_bytes_inner(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(self.owner.as_ref());
        data.push(self.bump);
        data
    }
}

impl Operator {
    pub const LEN: usize = 1 + // discriminator
        32 + // owner
        1; // bump

    pub fn validate_owner(&self, owner: &Pubkey) -> Result<(), ProgramError> {
        if self.owner.ne(owner) {
            return Err(CommerceProgramError::OperatorOwnerMismatch.into());
        }
        Ok(())
    }

    pub fn validate_pda(&self, account_info_key: &Pubkey) -> Result<(), ProgramError> {
        let (pda, bump) =
            find_program_address(&[OPERATOR_SEED, self.owner.as_ref()], &COMMERCE_PROGRAM_ID);

        if pda.ne(account_info_key) || bump != self.bump {
            return Err(CommerceProgramError::OperatorInvalidPda.into());
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

        Ok(Self { owner, bump })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_validate_owner_success() {
        let owner = [1u8; 32];
        let operator = Operator { owner, bump: 255 };

        assert!(operator.validate_owner(&owner).is_ok());
    }

    #[test]
    fn test_validate_owner_failure() {
        let owner = [1u8; 32];
        let wrong_owner = [2u8; 32];
        let operator = Operator { owner, bump: 255 };

        let result = operator.validate_owner(&wrong_owner);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::OperatorOwnerMismatch.into()
        );
    }

    #[test]
    fn test_operator_serialization() {
        let operator = Operator {
            owner: [1u8; 32],
            bump: 254,
        };

        let bytes = operator.to_bytes_inner();
        assert_eq!(bytes.len(), Operator::LEN - 1); // Excluding discriminator

        let mut full_data = vec![Operator::DISCRIMINATOR];
        full_data.extend_from_slice(&bytes);

        let deserialized = Operator::try_from_bytes(&full_data).unwrap();
        assert_eq!(deserialized, operator);
    }

    #[test]
    fn test_operator_try_from_bytes_wrong_discriminator() {
        let mut data = vec![0; Operator::LEN];
        data[0] = 99; // Wrong discriminator

        let result = Operator::try_from_bytes(&data);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), ProgramError::InvalidAccountData);
    }

    #[test]
    fn test_operator_owner_validation() {
        let owner1 = [100u8; 32];
        let owner2 = [200u8; 32];

        let operator = Operator {
            owner: owner1,
            bump: 128,
        };

        // Should succeed with correct owner
        assert!(operator.validate_owner(&owner1).is_ok());

        // Should fail with wrong owner
        let result = operator.validate_owner(&owner2);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::OperatorOwnerMismatch.into()
        );
    }
}
