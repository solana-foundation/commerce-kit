use pinocchio::{
    account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey, ProgramResult,
};

use crate::{
    processor::{verify_owner_mutability, verify_signer},
    state::{discriminator::AccountSerialize, Merchant},
    ID as COMMERCE_PROGRAM_ID,
};

#[inline(always)]
pub fn process_update_merchant_authority(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let [payer_info, authority_info, merchant_info, new_authority_info] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate: authority should have signed
    verify_signer(authority_info, false)?;

    // Validate payer is writable signer
    verify_signer(payer_info, true)?;

    // Validate merchant is owned by this program
    verify_owner_mutability(merchant_info, &COMMERCE_PROGRAM_ID, true)?;

    let mut merchant_data = merchant_info.try_borrow_mut_data()?;
    let mut merchant = Merchant::try_from_bytes(&merchant_data)?;

    // Validate merchant owner
    merchant.validate_owner(authority_info.key())?;

    // Validate Merchant PDA
    merchant.validate_pda(merchant_info.key())?;

    // Update merchant owner
    merchant.owner = *new_authority_info.key();
    merchant_data.copy_from_slice(&merchant.to_bytes());

    Ok(())
}
