extern crate alloc;

use crate::ID as COMMERCE_PROGRAM_ID;
use pinocchio::{
    account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey, ProgramResult,
};

use crate::{
    processor::{verify_owner_mutability, verify_signer, verify_system_program},
    state::{Merchant, MerchantOperatorConfig, Operator, Payment, Status},
};

#[inline(always)]
pub fn process_close_payment(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let [fee_payer_info, payment_info, operator_authority_info, operator_info, merchant_info, buyer_info, merchant_operator_config_info, mint_info, system_program_info] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate fee_payer is writable signer
    verify_signer(fee_payer_info, true)?;

    // Validate: operator_authority should have signed
    verify_signer(operator_authority_info, false)?;

    // Validate payment is writable and owned by this program
    verify_owner_mutability(payment_info, &COMMERCE_PROGRAM_ID, true)?;

    // Validate system program
    verify_system_program(system_program_info)?;

    // Validate merchant is owned by this program
    verify_owner_mutability(merchant_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate merchant_operator_config is owned by this program
    verify_owner_mutability(merchant_operator_config_info, &COMMERCE_PROGRAM_ID, false)?;

    // validate operator is owned by the program
    verify_owner_mutability(operator_info, &COMMERCE_PROGRAM_ID, false)?;

    // Load and validate operator
    let operator = {
        let operator_data = operator_info.try_borrow_data()?;
        Operator::try_from_bytes(&operator_data)?
    };

    operator.validate_pda(operator_info.key())?;
    operator.validate_owner(operator_authority_info.key())?;

    // Load and validate merchant
    let merchant = {
        let merchant_data = merchant_info.try_borrow_data()?;
        Merchant::try_from_bytes(&merchant_data)?
    };
    merchant.validate_pda(merchant_info.key())?;

    // Load and validate merchant_operator_config
    let (merchant_operator_config, _policies, _allowed_mints) = {
        let merchant_operator_config_data = merchant_operator_config_info.try_borrow_data()?;
        MerchantOperatorConfig::try_from_bytes(&merchant_operator_config_data)?
    };

    // Validate merchant_operator_config PDA
    merchant_operator_config.validate_pda(merchant_operator_config_info.key())?;

    // Validate operator is the operator in the merchant_operator_config
    merchant_operator_config.validate_operator(operator_info.key())?;

    // Validate merchant is the merchant in the merchant_operator_config
    merchant_operator_config.validate_merchant(merchant_info.key())?;

    // Load and validate payment
    let payment_data = payment_info.try_borrow_data()?;
    let payment = Payment::try_from_bytes(&payment_data)?;

    // Validate payment can only be closed if it's cleared
    payment.validate_status(Status::Cleared)?;

    // Validate Payment PDA using the provided accounts
    payment.validate_pda(
        payment_info.key(),
        merchant_operator_config_info.key(),
        buyer_info.key(),
        mint_info.key(),
    )?;

    drop(payment_data);

    let payer_lamports = fee_payer_info.lamports();
    *fee_payer_info.try_borrow_mut_lamports().unwrap() =
        payer_lamports.checked_add(payment_info.lamports()).unwrap();
    *payment_info.try_borrow_mut_lamports().unwrap() = 0;
    payment_info.close()?;

    Ok(())
}
