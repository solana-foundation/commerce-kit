use pinocchio::{
    account_info::AccountInfo,
    instruction::Seed,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};

use crate::{
    constants::MERCHANT_SEED,
    processor::{
        create_pda_account, validate_pda, verify_signer, verify_system_account,
        verify_system_program,
    },
    require_len,
    state::{discriminator::AccountSerialize, Merchant},
};

#[inline(always)]
pub fn process_initialize_merchant(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let args = process_instruction_data(instruction_data)?;
    let [payer_info, authority_info, merchant_info, settlement_wallet_info, system_program_info] =
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
    // Validate Merchant PDA
    validate_pda(
        &[MERCHANT_SEED, authority_info.key()],
        &Pubkey::from(*program_id),
        args.bump,
        merchant_info,
    )?;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_instruction_data_valid() {
        let data = [255u8];
        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.bump, 255);
    }

    #[test]
    fn test_process_instruction_data_edge_cases() {
        let data = [0u8];
        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.bump, 0);

        let data = [u8::MAX];
        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.bump, u8::MAX);
    }

    #[test]
    fn test_process_instruction_data_invalid_length() {
        let data = [];
        let result = process_instruction_data(&data);
        assert!(result.is_err());
    }
}
