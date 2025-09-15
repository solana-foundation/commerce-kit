extern crate alloc;

use alloc::vec::Vec;
use pinocchio::{
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
};
use shank::ShankAccount;

use crate::ID as COMMERCE_PROGRAM_ID;
use crate::{constants::MERCHANT_SEED, error::CommerceProgramError};

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
            return Err(CommerceProgramError::MerchantOwnerMismatch.into());
        }
        Ok(())
    }

    pub fn validate_pda(&self, account_info_key: &Pubkey) -> Result<(), ProgramError> {
        let (pda, bump) =
            find_program_address(&[MERCHANT_SEED, self.owner.as_ref()], &COMMERCE_PROGRAM_ID);

        if pda.ne(account_info_key) || bump != self.bump {
            return Err(CommerceProgramError::MerchantInvalidPda.into());
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

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_validate_owner_success() {
        let owner = [1u8; 32];
        let merchant = Merchant {
            owner,
            bump: 255,
            settlement_wallet: [2u8; 32],
        };

        assert!(merchant.validate_owner(&owner).is_ok());
    }

    #[test]
    fn test_validate_owner_failure() {
        let owner = [1u8; 32];
        let wrong_owner = [2u8; 32];
        let merchant = Merchant {
            owner,
            bump: 255,
            settlement_wallet: [3u8; 32],
        };

        let result = merchant.validate_owner(&wrong_owner);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::MerchantOwnerMismatch.into()
        );
    }

    #[test]
    fn test_merchant_serialization() {
        let merchant = Merchant {
            owner: [1u8; 32],
            bump: 254,
            settlement_wallet: [2u8; 32],
        };

        let bytes = merchant.to_bytes_inner();
        assert_eq!(bytes.len(), Merchant::LEN - 1); // Excluding discriminator

        let mut full_data = vec![Merchant::DISCRIMINATOR];
        full_data.extend_from_slice(&bytes);

        let deserialized = Merchant::try_from_bytes(&full_data).unwrap();
        assert_eq!(deserialized, merchant);
    }

    #[test]
    fn test_merchant_try_from_bytes_wrong_discriminator() {
        let mut data = vec![0; Merchant::LEN];
        data[0] = 99; // Wrong discriminator

        let result = Merchant::try_from_bytes(&data);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), ProgramError::InvalidAccountData);
    }

    #[test]
    fn test_merchant_different_wallets() {
        let owner = [1u8; 32];
        let settlement_wallet = [100u8; 32];

        let merchant = Merchant {
            owner,
            bump: 200,
            settlement_wallet,
        };

        // Test owner validation works
        assert!(merchant.validate_owner(&owner).is_ok());

        // Test serialization works
        let bytes = merchant.to_bytes_inner();
        let mut full_data = vec![Merchant::DISCRIMINATOR];
        full_data.extend_from_slice(&bytes);

        let deserialized = Merchant::try_from_bytes(&full_data).unwrap();
        assert_eq!(deserialized.owner, owner);
        assert_eq!(deserialized.settlement_wallet, settlement_wallet);
    }
}
