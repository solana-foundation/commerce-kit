use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
    ProgramResult,
};
use pinocchio_associated_token_account::instructions::CreateIdempotent;

use crate::error::CommerceProgramError;

/// Validates an Associated Token Account address.
///
/// # Arguments
/// * `ata_info` - The ATA account to validate/create
/// * `wallet_key` - The wallet that should own the ATA
/// * `mint_info` - The token mint for the ATA
/// * `token_program_info` - The token program account
///
/// # Returns
/// * `ProgramResult` - Success if validation passes and ATA exists
#[inline(always)]
pub fn get_ata(
    ata_info: &AccountInfo,
    wallet_key: &Pubkey,
    mint_info: &AccountInfo,
    token_program_info: &AccountInfo,
) -> ProgramResult {
    // Validate ATA address is correct for this wallet + mint
    let expected_ata = find_program_address(
        &[
            wallet_key.as_ref(),
            token_program_info.key().as_ref(),
            mint_info.key().as_ref(),
        ],
        &pinocchio_associated_token_account::ID,
    )
    .0;

    if ata_info.key() != &expected_ata || ata_info.data_is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    Ok(())
}

/// Validates an Associated Token Account address and creates it if it doesn't exist.
///
/// # Arguments
/// * `ata_info` - The ATA account to validate/create
/// * `wallet_info` - The wallet that should own the ATA
/// * `mint_info` - The token mint for the ATA
/// * `payer_info` - The account paying for creation (if needed)
/// * `system_program_info` - The system program account
/// * `token_program_info` - The token program account
///
/// # Returns
/// * `ProgramResult` - Success if validation passes and creation (if needed) succeeds
#[inline(always)]
pub fn get_or_create_ata(
    ata_info: &AccountInfo,
    wallet_info: &AccountInfo,
    mint_info: &AccountInfo,
    payer_info: &AccountInfo,
    system_program_info: &AccountInfo,
    token_program_info: &AccountInfo,
) -> ProgramResult {
    // Validate ATA address is correct for this wallet + mint
    let expected_ata = find_program_address(
        &[
            wallet_info.key().as_ref(),
            token_program_info.key().as_ref(),
            mint_info.key().as_ref(),
        ],
        &pinocchio_associated_token_account::ID,
    )
    .0;

    if ata_info.key() != &expected_ata {
        return Err(CommerceProgramError::InvalidAta.into());
    }

    // Create ATA if it doesn't exist
    if ata_info.data_is_empty() {
        CreateIdempotent {
            funding_account: payer_info,
            account: ata_info,
            wallet: wallet_info,
            mint: mint_info,
            system_program: system_program_info,
            token_program: token_program_info,
        }
        .invoke()?;
    }

    Ok(())
}
