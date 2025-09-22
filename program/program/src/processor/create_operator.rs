extern crate alloc;

use pinocchio::{
    account_info::AccountInfo,
    instruction::Seed,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};

use crate::{
    constants::OPERATOR_SEED,
    processor::{
        create_pda_account, validate_pda, verify_signer, verify_system_account,
        verify_system_program,
    },
    require_len,
    state::{discriminator::AccountSerialize, Operator},
};

#[inline(always)]
pub fn process_create_operator(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let args = process_instruction_data(instruction_data)?;
    let [payer_info, operator_info, authority_info, system_program_info] = accounts else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate: authority should have signed
    verify_signer(authority_info, false)?;
    // Validate payer is writable signer
    verify_signer(payer_info, true)?;
    // Validate operator is writable
    verify_system_account(operator_info, true)?;
    // Validate system program
    verify_system_program(system_program_info)?;
    // Validate Operator PDA
    validate_pda(
        &[OPERATOR_SEED, authority_info.key()],
        &Pubkey::from(*program_id),
        args.bump,
        operator_info,
    )?;

    let space = Operator::LEN;
    let rent = Rent::get()?;
    let bump_seed = [args.bump];
    let signer_seeds = [
        Seed::from(OPERATOR_SEED),
        Seed::from(authority_info.key()),
        Seed::from(&bump_seed),
    ];
    create_pda_account(
        payer_info,
        &rent,
        space,
        program_id,
        operator_info,
        signer_seeds,
        None,
    )?;
    let operator = Operator {
        owner: *authority_info.key(),
        bump: args.bump,
    };

    let mut operator_data = operator_info.try_borrow_mut_data()?;
    operator_data.copy_from_slice(&operator.to_bytes());
    Ok(())
}

struct CreateOperatorArgs {
    bump: u8,
}

fn process_instruction_data(data: &[u8]) -> Result<CreateOperatorArgs, ProgramError> {
    require_len!(data, 1);
    let bump = data[0];
    Ok(CreateOperatorArgs { bump })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_instruction_data_valid() {
        let data = [128u8];
        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.bump, 128);
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
