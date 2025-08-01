use pinocchio::{
    account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey, ProgramResult,
};

use crate::{
    constants::{USDC_MINT, USDT_MINT},
    error::CommerceProgramError,
    processor::{
        get_or_create_ata, verify_ata_program, verify_owner_mutability, verify_signer,
        verify_system_program, verify_token_or_system_program, verify_token_program,
    },
    require,
    state::{discriminator::AccountSerialize, Merchant},
    ID as COMMERCE_PROGRAM_ID,
};

#[inline(always)]
pub fn process_update_merchant_settlement_wallet(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let [payer_info, authority_info, merchant_info, new_settlement_wallet_info, settlement_usdc_ata_info, usdc_mint_info, settlement_usdt_ata_info, usdt_mint_info, token_program_info, associated_token_program_info, system_program_info] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate: authority should have signed
    verify_signer(authority_info, false)?;

    // Validate payer is writable signer
    verify_signer(payer_info, true)?;

    // Validate merchant is owned by this program
    verify_owner_mutability(merchant_info, &COMMERCE_PROGRAM_ID, true)?;

    // Validate token program
    verify_token_program(token_program_info)?;

    // Validate system program
    verify_system_program(system_program_info)?;

    // Validate associated token program
    verify_ata_program(associated_token_program_info)?;

    // Verify ATAs are writable system or token accounts
    verify_token_or_system_program(settlement_usdc_ata_info, true)?;
    verify_token_or_system_program(settlement_usdt_ata_info, true)?;

    let mut merchant_data = merchant_info.try_borrow_mut_data()?;
    let mut merchant = Merchant::try_from_bytes(&merchant_data)?;

    // Validate merchant owner
    merchant.validate_owner(authority_info.key())?;

    // Validate Merchant PDA
    merchant.validate_pda(merchant_info.key())?;

    // Verify USDC and USDT mints are valid
    require!(
        usdc_mint_info.key() == &USDC_MINT,
        CommerceProgramError::InvalidMint
    );
    require!(
        usdt_mint_info.key() == &USDT_MINT,
        CommerceProgramError::InvalidMint
    );

    // Validate ATAs
    get_or_create_ata(
        settlement_usdc_ata_info,
        new_settlement_wallet_info,
        usdc_mint_info,
        payer_info,
        system_program_info,
        token_program_info,
    )?;
    get_or_create_ata(
        settlement_usdt_ata_info,
        new_settlement_wallet_info,
        usdt_mint_info,
        payer_info,
        system_program_info,
        token_program_info,
    )?;

    // Update merchant settlement wallet
    merchant.settlement_wallet = *new_settlement_wallet_info.key();
    merchant_data.copy_from_slice(&merchant.to_bytes());

    Ok(())
}
