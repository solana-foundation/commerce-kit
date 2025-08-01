use crate::{error::CommerceProgramError, ID as COMMERCE_PROGRAM_ID};
use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::{find_program_address, Pubkey},
};
use pinocchio_associated_token_account::ID as ATA_PROGRAM_ID;
use pinocchio_token::{state::Mint, ID as TOKEN_PROGRAM_ID};

/// Verify account as a signer, returning an error if it is not or if it is not writable while
/// expected to be.
///
/// # Arguments
/// * `info` - The account to verify.
/// * `expect_writable` - Whether the account should be writable
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_signer(info: &AccountInfo, expect_writable: bool) -> Result<(), ProgramError> {
    if !info.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if expect_writable && !info.is_writable() {
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}

/// Verify account as a system account, returning an error if it is not or if it is not writable
/// while expected to be.
///
/// # Arguments
/// * `info` - The account to verify.
/// * `is_writable` - Whether the account should be writable.
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_system_account(info: &AccountInfo, is_writable: bool) -> Result<(), ProgramError> {
    if !info.is_owned_by(&pinocchio_system::ID) {
        return Err(ProgramError::InvalidAccountOwner);
    }

    if !info.data_is_empty() {
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    if is_writable && !info.is_writable() {
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}

/// Verify account as system program, returning an error if it is not.
///
/// # Arguments
/// * `info` - The account to verify.
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_system_program(info: &AccountInfo) -> Result<(), ProgramError> {
    if info.key().ne(&pinocchio_system::ID) {
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}

/// Verify account as Associated Token program, returning an error if it is not.
///
/// # Arguments
/// * `info` - The account to verify.
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_ata_program(info: &AccountInfo) -> Result<(), ProgramError> {
    if info.key().ne(&ATA_PROGRAM_ID) {
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}

/// Verify account as current program, returning an error if it is not.
///
/// # Arguments
/// * `info` - The account to verify.
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_current_program(info: &AccountInfo) -> Result<(), ProgramError> {
    if info.key().ne(&COMMERCE_PROGRAM_ID) {
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}

/// Verify account's owner and account mutability.
///
/// # Arguments
/// * `info` - The account to verify.
/// * `owner` - The expected owner of the account.
/// * `is_writable` - Whether the account is expected to be writable.
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_owner_mutability(
    info: &AccountInfo,
    owner: &Pubkey,
    expect_writable: bool,
) -> Result<(), ProgramError> {
    if !info.is_owned_by(owner) {
        return Err(ProgramError::InvalidAccountOwner);
    }
    if expect_writable && !info.is_writable() {
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}

/// Verify account as Tokenkeg program, returning an error if it is not.
///
/// # Arguments
/// * `info` - The account to verify.
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_token_program(info: &AccountInfo) -> Result<(), ProgramError> {
    if info.key().ne(&TOKEN_PROGRAM_ID) {
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}

#[inline(always)]
pub fn verify_token_program_account(info: &AccountInfo) -> Result<(), ProgramError> {
    if !info.is_owned_by(&TOKEN_PROGRAM_ID) {
        return Err(ProgramError::InvalidAccountOwner);
    }

    Ok(())
}

/// Validates a Program Derived Address (PDA) against expected parameters.
///
/// # Arguments
/// * `seeds` - The seeds used to derive the PDA
/// * `program_id` - The program ID that should own the PDA
/// * `expected_bump` - The expected bump seed value
/// * `account_info` - The account that should match the derived PDA
///
/// # Returns
/// * `Result<Pubkey, ProgramError>` - The validated PDA on success
#[inline(always)]
pub fn validate_pda(
    seeds: &[&[u8]],
    program_id: &Pubkey,
    expected_bump: u8,
    account_info: &AccountInfo,
) -> Result<Pubkey, ProgramError> {
    // Calculate the PDA
    let (calculated_pda, calculated_bump) = find_program_address(seeds, program_id);

    // Validate bump matches expected
    if calculated_bump != expected_bump {
        return Err(ProgramError::InvalidInstructionData);
    }

    // Validate account key matches calculated PDA
    if account_info.key() != &calculated_pda {
        return Err(ProgramError::InvalidSeeds);
    }

    // Validate account is owned by the program (for initialized accounts)
    if !account_info.data_is_empty() && !account_info.is_owned_by(program_id) {
        return Err(ProgramError::InvalidAccountOwner);
    }

    Ok(calculated_pda)
}

/// Verify account as Tokenkeg program or System program, returning an error if it is not.
/// Use this when unsure if an ATA has been initialized by the program or not.
///
/// # Arguments
/// * `info` - The account to verify.
/// * `expected_program_id` - The expected program ID of the account.
///
/// # Returns
/// * `Result<(), ProgramError>` - The result of the operation
#[inline(always)]
pub fn verify_token_or_system_program(
    info: &AccountInfo,
    expect_writable: bool,
) -> Result<(), ProgramError> {
    if !info.is_owned_by(&TOKEN_PROGRAM_ID) && !info.is_owned_by(&pinocchio_system::ID) {
        return Err(ProgramError::IncorrectProgramId);
    }
    if expect_writable && !info.is_writable() {
        return Err(ProgramError::IncorrectProgramId);
    }

    Ok(())
}

/// Verify account as a valid Mint account
#[inline(always)]
pub fn verify_mint_account(info: &AccountInfo) -> Result<(), ProgramError> {
    Mint::from_account_info(info).map_err(|_| CommerceProgramError::InvalidMint)?;

    Ok(())
}
