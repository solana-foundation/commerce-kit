use pinocchio::{
    account_info::AccountInfo,
    instruction::Seed,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};
extern crate alloc;
use alloc::vec::Vec;

use crate::{
    constants::MERCHANT_OPERATOR_CONFIG_SEED,
    processor::{
        create_pda_account, validate_pda, verify_owner_mutability, verify_signer,
        verify_system_account, verify_system_program,
    },
    state::{FeeType, MerchantOperatorConfig, PolicyData, PolicyType},
    ID as COMMERCE_PROGRAM_ID,
};

#[inline(always)]
pub fn process_initialize_merchant_operator_config(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    /*
    For now accepted currencies are only sent as a Vec of Pubkeys, therefore we don't have the account infos, so we can't validate them.
    For future work we should add them as remaining accounts or pass them however and validate the following:

    1. Is a Mint account type
    2. Is owned by the token program (spl or spl 2022)
     */
    let args = process_instruction_data(instruction_data)?;
    let [payer_info, authority_info, merchant_info, operator_info, config_info, system_program_info] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate: authority should have signed
    verify_signer(authority_info, false)?;

    // Validate payer is writable signer
    verify_signer(payer_info, true)?;

    // Validate config is writable
    verify_system_account(config_info, true)?;

    // Validate merchant is owned by this program
    verify_owner_mutability(merchant_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate operator is owned by this program
    verify_owner_mutability(operator_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate system program
    verify_system_program(system_program_info)?;

    // Validate MerchantOperatorConfig PDA
    validate_pda(
        &[
            MERCHANT_OPERATOR_CONFIG_SEED,
            merchant_info.key().as_ref(),
            operator_info.key().as_ref(),
            &args.version.to_le_bytes(),
        ],
        &Pubkey::from(*program_id),
        args.bump,
        config_info,
    )?;

    let config = MerchantOperatorConfig {
        version: args.version,
        bump: args.bump,
        merchant: *merchant_info.key(),
        operator: *operator_info.key(),
        operator_fee: args.operator_fee,
        fee_type: args.fee_type,
        num_policies: args.policies.len() as u32,
        num_accepted_currencies: args.accepted_currencies.len() as u32,
        current_order_id: 0,
    };
    // Validate Merchant PDA (ensures correct authority)
    config.validate_pda(config_info.key())?;
    let space: usize = config.calculate_size();
    let rent = Rent::get()?;
    let bump_seed = [args.bump];
    let version_seed = args.version.to_le_bytes();
    let signer_seeds = [
        Seed::from(MERCHANT_OPERATOR_CONFIG_SEED),
        Seed::from(merchant_info.key()),
        Seed::from(operator_info.key()),
        Seed::from(&version_seed),
        Seed::from(&bump_seed),
    ];

    create_pda_account(
        payer_info,
        &rent,
        space,
        program_id,
        config_info,
        signer_seeds,
        None,
    )?;

    let config_data = config.to_bytes(&args.policies, &args.accepted_currencies);
    let mut account_data = config_info.try_borrow_mut_data()?;
    account_data.copy_from_slice(&config_data);

    Ok(())
}

struct InitializeMerchantOperatorConfigArgs {
    version: u32,
    bump: u8,
    operator_fee: u64,
    fee_type: FeeType,
    policies: Vec<PolicyData>,
    accepted_currencies: Vec<Pubkey>,
}

fn process_instruction_data(
    data: &[u8],
) -> Result<InitializeMerchantOperatorConfigArgs, ProgramError> {
    if data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let mut offset = 0;

    // Read version (4 bytes)
    if data.len() < offset + 4 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let version = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
    offset += 4;

    // Read bump (1 byte)
    if data.len() < offset + 1 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let bump = data[offset];
    offset += 1;

    // Read operator_fee (8 bytes)
    if data.len() < offset + 8 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let operator_fee = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    offset += 8;

    // Read fee_type (1 byte)
    if data.len() < offset + 1 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let fee_type = FeeType::from_u8(data[offset])?;
    offset += 1;

    // Read number of policies (4 bytes)
    if data.len() < offset + 4 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let num_policies = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
    offset += 4;

    // Read policies
    let mut policies = Vec::new();
    for _ in 0..num_policies {
        if data.len() < offset + 1 {
            return Err(ProgramError::InvalidInstructionData);
        }

        // Debug the policy type byte
        let policy_type_byte = data[offset];
        let policy_type = PolicyType::from_u8(policy_type_byte)
            .map_err(|_| ProgramError::InvalidInstructionData)?;
        let policy_size = policy_type.get_size();

        if data.len() < offset + policy_size {
            return Err(ProgramError::InvalidInstructionData);
        }

        let policy_result = PolicyData::from_bytes(&data[offset..offset + policy_size]);
        match policy_result {
            Ok(policy) => {
                policies.push(policy);
            }
            Err(e) => {
                return Err(e);
            }
        }
        offset += policy_size;
    }

    // Read number of accepted currencies (4 bytes)
    if data.len() < offset + 4 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let num_accepted_currencies = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
    offset += 4;

    // Read accepted currencies
    let mut accepted_currencies = Vec::new();
    for _ in 0..num_accepted_currencies {
        if data.len() < offset + 32 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let currency: Pubkey = data[offset..offset + 32].try_into().unwrap();
        accepted_currencies.push(currency);
        offset += 32;
    }

    Ok(InitializeMerchantOperatorConfigArgs {
        version,
        bump,
        operator_fee,
        fee_type,
        policies,
        accepted_currencies,
    })
}
