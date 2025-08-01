use pinocchio::{
    account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey, ProgramResult,
};

use crate::{
    processor::{verify_owner_mutability, verify_signer},
    state::{discriminator::AccountSerialize, Operator},
    ID as COMMERCE_PROGRAM_ID,
};

#[inline(always)]
pub fn process_update_operator_authority(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let [payer_info, authority_info, operator_info, new_authority_info] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate: authority should have signed
    verify_signer(authority_info, false)?;

    // Validate payer is writable signer
    verify_signer(payer_info, true)?;

    // Validate merchant is owned by this program
    verify_owner_mutability(operator_info, &COMMERCE_PROGRAM_ID, true)?;

    let mut operator_data = operator_info.try_borrow_mut_data()?;
    let mut operator = Operator::try_from_bytes(&operator_data)?;

    // Validate merchant owner
    operator.validate_owner(authority_info.key())?;

    // Validate Merchant PDA
    operator.validate_pda(operator_info.key())?;

    // Update merchant owner
    operator.owner = *new_authority_info.key();
    operator_data.copy_from_slice(&operator.to_bytes());

    Ok(())
}
