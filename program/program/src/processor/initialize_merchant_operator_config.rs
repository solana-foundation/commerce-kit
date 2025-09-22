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
    error::CommerceProgramError,
    processor::{
        create_pda_account, mint_utils::validate_mints, validate_pda, verify_mint_account,
        verify_owner_mutability, verify_signer, verify_system_account, verify_system_program,
        verify_token_program_account,
    },
    state::{FeeType, MerchantOperatorConfig, PolicyData, PolicyType},
    ID as COMMERCE_PROGRAM_ID,
};

const REMAINING_ACCOUNTS_OFFSET: usize = 6;

#[inline(always)]
pub fn process_initialize_merchant_operator_config(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let args = process_instruction_data(instruction_data)?;

    if accounts.len() < REMAINING_ACCOUNTS_OFFSET + args.accepted_currencies.len() {
        return Err(ProgramError::NotEnoughAccountKeys);
    }

    if args.accepted_currencies.is_empty() {
        return Err(CommerceProgramError::AcceptedCurrenciesEmpty.into());
    }

    let payer_info = &accounts[0];
    let authority_info = &accounts[1];
    let merchant_info = &accounts[2];
    let operator_info = &accounts[3];
    let config_info = &accounts[4];
    let system_program_info = &accounts[5];

    // Remaining accounts should be the mint accounts for each accepted currency
    let mint_accounts = &accounts[REMAINING_ACCOUNTS_OFFSET..];

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

    // Validate no duplicate mints in accepted currencies
    validate_mints(&args.accepted_currencies)?;

    // Validate mint accounts match accepted currencies and are valid mints
    mint_accounts
        .iter()
        .enumerate()
        .try_for_each(|(i, mint_info)| {
            // Validate mint account key matches the expected accepted currency
            if mint_info.key() != &args.accepted_currencies[i] {
                return Err(CommerceProgramError::InvalidMint.into());
            }

            // Validate mint is owned by token program
            verify_token_program_account(mint_info)?;

            // Validate mint is a valid mint account
            verify_mint_account(mint_info)
        })?;

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
        days_to_close: args.days_to_close,
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
    days_to_close: u16,
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

    // Read days_to_close (2 bytes)
    if data.len() < offset + 2 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let days_to_close = u16::from_le_bytes(data[offset..offset + 2].try_into().unwrap());
    offset += 2;

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
        days_to_close,
        policies,
        accepted_currencies,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_process_instruction_data_minimal_valid() {
        let mut data = vec![];
        // version (4 bytes)
        data.extend_from_slice(&1u32.to_le_bytes());
        // bump (1 byte)
        data.push(254u8);
        // operator_fee (8 bytes)
        data.extend_from_slice(&1000u64.to_le_bytes());
        // fee_type (1 byte) - Fixed = 1
        data.push(1u8);
        // days_to_close (2 bytes)
        data.extend_from_slice(&30u16.to_le_bytes());
        // num_policies (4 bytes)
        data.extend_from_slice(&0u32.to_le_bytes());
        // num_accepted_currencies (4 bytes)
        data.extend_from_slice(&1u32.to_le_bytes());
        // accepted_currencies (32 bytes each)
        let pubkey_bytes = [1u8; 32];
        data.extend_from_slice(&pubkey_bytes);

        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.version, 1);
        assert_eq!(args.bump, 254);
        assert_eq!(args.operator_fee, 1000);
        assert_eq!(args.fee_type, FeeType::Fixed);
        assert_eq!(args.days_to_close, 30);
        assert_eq!(args.policies.len(), 0);
        assert_eq!(args.accepted_currencies.len(), 1);
    }

    #[test]
    fn test_process_instruction_data_with_policies() {
        let mut data = vec![];
        // version (4 bytes)
        data.extend_from_slice(&1u32.to_le_bytes());
        // bump (1 byte)
        data.push(255u8);
        // operator_fee (8 bytes)
        data.extend_from_slice(&250u64.to_le_bytes()); // 2.5% in BPS
                                                       // fee_type (1 byte) - Bps = 0
        data.push(0u8);
        // days_to_close (2 bytes)
        data.extend_from_slice(&7u16.to_le_bytes());
        // num_policies (4 bytes)
        data.extend_from_slice(&2u32.to_le_bytes());

        // Refund Policy (type = 0)
        data.push(0u8); // Policy type
        data.extend_from_slice(&5000u64.to_le_bytes()); // max_amount
        data.extend_from_slice(&604800u64.to_le_bytes()); // max_time_after_purchase (1 week)

        // Settlement Policy (type = 1)
        data.push(1u8); // Policy type
        data.extend_from_slice(&100u64.to_le_bytes()); // min_settlement_amount
        data.extend_from_slice(&24u32.to_le_bytes()); // settlement_frequency_hours
        data.push(1u8); // auto_settle = true

        // num_accepted_currencies (4 bytes)
        data.extend_from_slice(&2u32.to_le_bytes());
        // accepted_currencies
        data.extend_from_slice(&[2u8; 32]); // First currency
        data.extend_from_slice(&[3u8; 32]); // Second currency

        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.version, 1);
        assert_eq!(args.bump, 255);
        assert_eq!(args.operator_fee, 250);
        assert_eq!(args.fee_type, FeeType::Bps);
        assert_eq!(args.days_to_close, 7);
        assert_eq!(args.policies.len(), 2);
        assert_eq!(args.accepted_currencies.len(), 2);

        // Verify refund policy
        if let PolicyData::Refund(refund) = &args.policies[0] {
            assert_eq!(refund.max_amount, 5000);
            assert_eq!(refund.max_time_after_purchase, 604800);
        } else {
            panic!("First policy should be Refund");
        }

        // Verify settlement policy
        if let PolicyData::Settlement(settlement) = &args.policies[1] {
            assert_eq!(settlement.min_settlement_amount, 100);
            assert_eq!(settlement.settlement_frequency_hours, 24);
            assert!(settlement.auto_settle);
        } else {
            panic!("Second policy should be Settlement");
        }
    }

    #[test]
    fn test_process_instruction_data_zero_values() {
        let mut data = vec![];
        data.extend_from_slice(&0u32.to_le_bytes());
        data.push(0u8);
        data.extend_from_slice(&0u64.to_le_bytes());
        data.push(1u8); // FeeType::Fixed
        data.extend_from_slice(&0u16.to_le_bytes());
        data.extend_from_slice(&0u32.to_le_bytes()); // No policies
        data.extend_from_slice(&1u32.to_le_bytes()); // One currency
        data.extend_from_slice(&[0u8; 32]);

        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.version, 0);
        assert_eq!(args.bump, 0);
        assert_eq!(args.operator_fee, 0);
        assert_eq!(args.fee_type, FeeType::Fixed);
        assert_eq!(args.days_to_close, 0);
    }

    #[test]
    fn test_process_instruction_data_invalid_empty() {
        let data = vec![];
        let result = process_instruction_data(&data);
        assert!(result.is_err());
    }

    #[test]
    fn test_process_instruction_data_invalid_too_short() {
        let data = vec![1u8; 10]; // Too short for minimum required fields
        let result = process_instruction_data(&data);
        assert!(result.is_err());
    }

    #[test]
    fn test_process_instruction_data_invalid_fee_type() {
        let mut data = vec![];
        data.extend_from_slice(&1u32.to_le_bytes());
        data.push(254u8);
        data.extend_from_slice(&1000u64.to_le_bytes());
        data.push(99u8); // Invalid fee type
        data.extend_from_slice(&30u16.to_le_bytes());
        data.extend_from_slice(&0u32.to_le_bytes());
        data.extend_from_slice(&1u32.to_le_bytes());
        data.extend_from_slice(&[1u8; 32]);

        let result = process_instruction_data(&data);
        assert!(result.is_err());
    }

    #[test]
    fn test_process_instruction_data_truncated_policies() {
        let mut data = vec![];
        data.extend_from_slice(&1u32.to_le_bytes());
        data.push(254u8);
        data.extend_from_slice(&1000u64.to_le_bytes());
        data.push(0u8); // FeeType::Bps
        data.extend_from_slice(&30u16.to_le_bytes());
        data.extend_from_slice(&1u32.to_le_bytes()); // 1 policy
        data.push(0u8); // Policy type Settlement
                        // Missing policy data - should fail

        let result = process_instruction_data(&data);
        assert!(result.is_err());
    }

    #[test]
    fn test_process_instruction_data_truncated_currencies() {
        let mut data = vec![];
        data.extend_from_slice(&1u32.to_le_bytes());
        data.push(254u8);
        data.extend_from_slice(&1000u64.to_le_bytes());
        data.push(1u8); // FeeType::Fixed
        data.extend_from_slice(&30u16.to_le_bytes());
        data.extend_from_slice(&0u32.to_le_bytes()); // No policies
        data.extend_from_slice(&2u32.to_le_bytes()); // 2 currencies
        data.extend_from_slice(&[1u8; 32]); // First currency
                                            // Missing second currency - should fail

        let result = process_instruction_data(&data);
        assert!(result.is_err());
    }

    #[test]
    fn test_process_instruction_data_multiple_currencies() {
        let mut data = vec![];
        data.extend_from_slice(&1u32.to_le_bytes());
        data.push(254u8);
        data.extend_from_slice(&500u64.to_le_bytes());
        data.push(0u8); // FeeType::Bps
        data.extend_from_slice(&14u16.to_le_bytes());
        data.extend_from_slice(&0u32.to_le_bytes()); // No policies
        data.extend_from_slice(&3u32.to_le_bytes()); // 3 currencies
        data.extend_from_slice(&[1u8; 32]);
        data.extend_from_slice(&[2u8; 32]);
        data.extend_from_slice(&[3u8; 32]);

        let args = process_instruction_data(&data).unwrap();
        assert_eq!(args.accepted_currencies.len(), 3);
        assert_eq!(args.accepted_currencies[0], Pubkey::from([1u8; 32]));
        assert_eq!(args.accepted_currencies[1], Pubkey::from([2u8; 32]));
        assert_eq!(args.accepted_currencies[2], Pubkey::from([3u8; 32]));
    }
}
