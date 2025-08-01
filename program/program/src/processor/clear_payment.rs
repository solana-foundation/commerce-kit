extern crate alloc;

use crate::processor::emit_event;
use crate::{
    constants::MAX_BPS,
    events::{EventDiscriminators, PaymentClearedEvent},
    processor::{get_or_create_ata, verify_ata_program},
    ID as COMMERCE_PROGRAM_ID,
};
use pinocchio::{
    account_info::AccountInfo,
    instruction::{Seed, Signer},
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvars::{clock::Clock, Sysvar},
    ProgramResult,
};
use pinocchio_token::instructions::Transfer;

use crate::{
    constants::{MERCHANT_SEED, SECONDS_PER_HOUR},
    error::CommerceProgramError,
    processor::{
        get_ata, verify_owner_mutability, verify_signer, verify_system_program,
        verify_token_program, verify_token_program_account,
    },
    state::{
        discriminator::AccountSerialize, policy::FeeType, Merchant, MerchantOperatorConfig,
        Operator, Payment, PolicyData, PolicyType, Status,
    },
};

#[inline(always)]
pub fn process_clear_payment(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let [fee_payer_info, payment_info, operator_authority_info, buyer_info, merchant_info, operator_info, merchant_operator_config_info, mint_info, merchant_escrow_ata_info, merchant_settlement_ata_info, operator_settlement_ata_info, token_program_info, associated_token_program_info, system_program_info, event_authority_info] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate fee_payer is writable signer
    verify_signer(fee_payer_info, true)?;

    // Validate operator_authority should have signed
    verify_signer(operator_authority_info, false)?;

    // Validate payment is writable and owned by this program
    verify_owner_mutability(payment_info, &COMMERCE_PROGRAM_ID, true)?;

    // Validate merchant is owned by this program
    verify_owner_mutability(merchant_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate operator is owned by the program
    verify_owner_mutability(operator_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate merchant_operator_config is owned by this program
    verify_owner_mutability(merchant_operator_config_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate mint is owned by token program
    verify_token_program_account(mint_info)?;

    // Validate token program
    verify_token_program(token_program_info)?;

    // Verify system program
    verify_system_program(system_program_info)?;

    // Validate associated token program
    verify_ata_program(associated_token_program_info)?;

    // Load and validate operator and merchant
    let operator_data = operator_info.try_borrow_data()?;
    let operator = Operator::try_from_bytes(&operator_data)?;
    operator.validate_pda(operator_info.key())?;
    operator.validate_owner(operator_authority_info.key())?;

    let merchant_data = merchant_info.try_borrow_data()?;
    let merchant = Merchant::try_from_bytes(&merchant_data)?;

    // Load and validate merchant_operator_config
    let merchant_operator_config_data = merchant_operator_config_info.try_borrow_data()?;
    let (merchant_operator_config, policies, allowed_mints) =
        MerchantOperatorConfig::try_from_bytes(&merchant_operator_config_data)?;

    // Validate merchant_operator_config PDA
    merchant_operator_config.validate_pda(merchant_operator_config_info.key())?;

    // Validate operator and merchant match the config
    merchant_operator_config.validate_operator(operator_info.key())?;
    merchant_operator_config.validate_merchant(merchant_info.key())?;

    // Validate mint is in the allowed_mints
    if !allowed_mints.contains(mint_info.key()) {
        return Err(CommerceProgramError::InvalidMint.into());
    }

    // Load and validate payment
    let mut payment_data = payment_info.try_borrow_mut_data()?;
    let mut payment = Payment::try_from_bytes(&payment_data)?;

    // Validate payment status is Paid
    payment.validate_status(Status::Paid)?;

    // Validate Payment PDA using the new validate_pda method
    payment.validate_pda(
        payment_info.key(),
        merchant_operator_config_info.key(),
        buyer_info.key(),
        mint_info.key(),
    )?;

    // Validate settlement policy conditions
    validate_settlement_policy(&policies, &payment)?;

    // Validate merchant escrow ATA (owned by merchant pda)
    get_ata(
        merchant_escrow_ata_info,
        merchant_info.key(),
        mint_info,
        token_program_info,
    )?;

    // Validate merchant settlement ATA (owned by merchant pda)
    get_ata(
        merchant_settlement_ata_info,
        &merchant.settlement_wallet,
        mint_info,
        token_program_info,
    )?;

    // Calculate operator fee and merchant amount
    let (operator_fee_amount, merchant_amount) = calculate_fees(
        payment.amount,
        merchant_operator_config.operator_fee,
        &merchant_operator_config.fee_type,
    )?;

    // Use PDA as authority for the transfers
    let bump_seed = [merchant.bump];
    let signer_seeds = [
        Seed::from(MERCHANT_SEED),
        Seed::from(merchant.owner.as_ref()),
        Seed::from(&bump_seed),
    ];

    // Transfer operator fee if applicable
    if operator_fee_amount > 0 {
        // Validate operator settlement ATA (owned by operator owner)
        // Create ATA if it doesn't exist

        get_or_create_ata(
            operator_settlement_ata_info,
            operator_authority_info,
            mint_info,
            fee_payer_info,
            system_program_info,
            token_program_info,
        )?;

        Transfer {
            from: merchant_escrow_ata_info,
            to: operator_settlement_ata_info,
            authority: merchant_info,
            amount: operator_fee_amount,
        }
        .invoke_signed(&[Signer::from(&signer_seeds)])?;
    }

    // Transfer remaining amount to merchant settlement wallet
    Transfer {
        from: merchant_escrow_ata_info,
        to: merchant_settlement_ata_info,
        authority: merchant_info,
        amount: merchant_amount,
    }
    .invoke_signed(&[Signer::from(&signer_seeds)])?;

    // Update payment status to cleared
    payment.status = Status::Cleared;

    // Save updated payment data
    payment_data.copy_from_slice(&payment.to_bytes());

    // Emit payment cleared event
    let event = PaymentClearedEvent {
        discriminator: EventDiscriminators::PaymentCleared as u8,
        buyer: *buyer_info.key(),
        merchant: *merchant_info.key(),
        operator: *operator_info.key(),
        amount: payment.amount,
        operator_fee: operator_fee_amount,
        order_id: payment.order_id,
    };

    emit_event(_program_id, event_authority_info, &event.to_bytes())?;

    Ok(())
}

fn validate_settlement_policy(
    policies: &[PolicyData],
    payment: &Payment,
) -> Result<(), ProgramError> {
    let Some(policy) = MerchantOperatorConfig::get_policy_by_type(policies, PolicyType::Settlement)
    else {
        return Ok(()); // No settlement policy means no restrictions
    };

    let PolicyData::Settlement(settlement) = policy else {
        return Ok(()); // Should never happen since we found by type, but be safe
    };

    // Check minimum settlement amount (0 means no limit)
    if settlement.min_settlement_amount > 0 && payment.amount < settlement.min_settlement_amount {
        return Err(CommerceProgramError::InsufficientSettlementAmount.into());
    }

    // Check settlement frequency (0 means no time restriction)
    if settlement.settlement_frequency_hours > 0 {
        let current_time = Clock::get()?.unix_timestamp;
        let time_since_payment = current_time - payment.created_at;
        let min_settlement_time = (settlement.settlement_frequency_hours as i64) * SECONDS_PER_HOUR;

        if time_since_payment < min_settlement_time {
            return Err(CommerceProgramError::SettlementTooEarly.into());
        }
    }

    // Auto settle should not be checked here as it would have been processed automatically

    Ok(())
}

fn calculate_fees(
    total_amount: u64,
    operator_fee: u64,
    fee_type: &FeeType,
) -> Result<(u64, u64), ProgramError> {
    let operator_fee_amount = match fee_type {
        FeeType::Bps => {
            // Calculate basis points (1 bps = 0.01%)
            // Safe math: (amount * bps) / 10000
            total_amount
                .checked_mul(operator_fee)
                .and_then(|v| v.checked_div(MAX_BPS))
                .ok_or(ProgramError::ArithmeticOverflow)?
        }
        FeeType::Fixed => {
            // Fixed fee in current mint - cap at total_amount to prevent trapped funds
            operator_fee.min(total_amount)
        }
    };

    // Calculate merchant amount (total - operator fee)
    let merchant_amount = total_amount
        .checked_sub(operator_fee_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    Ok((operator_fee_amount, merchant_amount))
}
