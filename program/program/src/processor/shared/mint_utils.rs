use crate::error::CommerceProgramError;
use pinocchio::{pubkey::Pubkey, ProgramResult};

pub fn validate_mints(mints: &[Pubkey]) -> ProgramResult {
    for (i, mint) in mints.iter().enumerate() {
        if mints[..i].contains(mint) {
            return Err(CommerceProgramError::DuplicateMint.into());
        }
    }

    Ok(())
}
