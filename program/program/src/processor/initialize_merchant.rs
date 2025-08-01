use pinocchio::{
    account_info::AccountInfo,
    instruction::Seed,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};

use crate::{
    constants::{MERCHANT_SEED, USDC_MINT, USDT_MINT},
    error::CommerceProgramError,
    processor::{
        create_pda_account, get_or_create_ata, validate_pda, verify_ata_program, verify_signer,
        verify_system_account, verify_system_program, verify_token_or_system_program,
        verify_token_program,
    },
    require, require_len,
    state::{discriminator::AccountSerialize, Merchant},
};

#[inline(always)]
pub fn process_initialize_merchant(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let args = process_instruction_data(instruction_data)?;
    let [payer_info, authority_info, merchant_info, settlement_wallet_info, system_program_info, settlement_usdc_ata_info, escrow_usdc_ata_info, usdc_mint_info, settlement_usdt_ata_info, escrow_usdt_ata_info, usdt_mint_info, token_program_info, associated_token_program_info] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate: authority should have signed
    verify_signer(authority_info, false)?;
    // Validate payer is writable signer
    verify_signer(payer_info, true)?;
    // Validate merchant is writable
    verify_system_account(merchant_info, true)?;
    // Validate settlement wallet is writable
    verify_system_account(settlement_wallet_info, false)?;
    // Validate system program
    verify_system_program(system_program_info)?;
    // Validate token program
    verify_token_program(token_program_info)?;
    // Validate associated token program
    verify_ata_program(associated_token_program_info)?;
    // Verify ATAs are writable system or token accounts
    verify_token_or_system_program(settlement_usdc_ata_info, true)?;
    verify_token_or_system_program(settlement_usdt_ata_info, true)?;
    verify_token_or_system_program(escrow_usdc_ata_info, true)?;
    verify_token_or_system_program(escrow_usdt_ata_info, true)?;

    // Validate Merchant PDA
    validate_pda(
        &[MERCHANT_SEED, authority_info.key()],
        &Pubkey::from(*program_id),
        args.bump,
        merchant_info,
    )?;

    // Verify USDC and USDT mints are valid
    require!(
        usdc_mint_info.key() == &USDC_MINT,
        CommerceProgramError::InvalidMint
    );
    require!(
        usdt_mint_info.key() == &USDT_MINT,
        CommerceProgramError::InvalidMint
    );

    let space = Merchant::LEN;

    let rent = Rent::get()?;
    let bump_seed = [args.bump];
    let signer_seeds = [
        Seed::from(MERCHANT_SEED),
        Seed::from(authority_info.key()),
        Seed::from(&bump_seed),
    ];
    create_pda_account(
        payer_info,
        &rent,
        space,
        program_id,
        merchant_info,
        signer_seeds,
        None,
    )?;

    // Validate ATAs
    get_or_create_ata(
        settlement_usdc_ata_info,
        settlement_wallet_info,
        usdc_mint_info,
        payer_info,
        system_program_info,
        token_program_info,
    )?;
    get_or_create_ata(
        settlement_usdt_ata_info,
        settlement_wallet_info,
        usdt_mint_info,
        payer_info,
        system_program_info,
        token_program_info,
    )?;
    get_or_create_ata(
        escrow_usdc_ata_info,
        merchant_info,
        usdc_mint_info,
        payer_info,
        system_program_info,
        token_program_info,
    )?;
    get_or_create_ata(
        escrow_usdt_ata_info,
        merchant_info,
        usdt_mint_info,
        payer_info,
        system_program_info,
        token_program_info,
    )?;

    let merchant = Merchant {
        owner: *authority_info.key(),
        bump: args.bump,
        settlement_wallet: *settlement_wallet_info.key(),
    };

    let mut merchant_data = merchant_info.try_borrow_mut_data()?;
    merchant_data.copy_from_slice(&merchant.to_bytes());

    Ok(())
}

struct InitializeMerchantArgs {
    bump: u8,
}

fn process_instruction_data(data: &[u8]) -> Result<InitializeMerchantArgs, ProgramError> {
    require_len!(data, 1);
    let bump = data[0];
    Ok(InitializeMerchantArgs { bump })
}
