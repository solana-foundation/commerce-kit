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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_mints_empty_slice() {
        assert!(validate_mints(&[]).is_ok());
    }

    #[test]
    fn test_validate_mints_single_mint() {
        let mint = [0u8; 32];
        assert!(validate_mints(&[mint]).is_ok());
    }

    #[test]
    fn test_validate_mints_unique_mints() {
        let mint1 = [0u8; 32];
        let mint2 = [1u8; 32];
        let mint3 = [2u8; 32];

        assert!(validate_mints(&[mint1, mint2, mint3]).is_ok());
    }

    #[test]
    fn test_validate_mints_duplicate_adjacent() {
        let mint1 = [0u8; 32];
        let mint2 = [0u8; 32];

        let result = validate_mints(&[mint1, mint2, mint1]);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::DuplicateMint.into()
        );
    }

    #[test]
    fn test_validate_mints_duplicate_non_adjacent() {
        let mint = [0u8; 32];

        let result = validate_mints(&[mint, mint]);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::DuplicateMint.into()
        );
    }

    #[test]
    fn test_validate_mints_multiple_duplicates() {
        let mint1 = [0u8; 32];
        let mint2 = [1u8; 32];

        let result = validate_mints(&[mint1, mint2, mint1, mint2]);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            CommerceProgramError::DuplicateMint.into()
        );
    }
}
