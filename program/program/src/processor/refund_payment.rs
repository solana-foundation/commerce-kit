extern crate alloc;

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
    constants::MERCHANT_SEED,
    error::CommerceProgramError,
    processor::{
        get_ata, verify_current_program, verify_owner_mutability, verify_signer,
        verify_system_program, verify_token_program, verify_token_program_account,
    },
    state::{
        discriminator::AccountSerialize, Merchant, MerchantOperatorConfig, Operator, Payment,
        PolicyData, PolicyType, Status,
    },
};
use crate::{
    events::{EventDiscriminators, PaymentRefundedEvent},
    processor::emit_event,
    ID as COMMERCE_PROGRAM_ID,
};

#[inline(always)]
pub fn process_refund_payment(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let [fee_payer_info, payment_info, operator_authority_info, buyer_info, merchant_info, operator_info, merchant_operator_config_info, mint_info, merchant_escrow_ata_info, buyer_ata_info, token_program_info, system_program_info, event_authority_info, commerce_program_info] =
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

    // Verify own program
    verify_current_program(commerce_program_info)?;

    // Load and validate operator and merchant
    let operator_data = operator_info.try_borrow_data()?;
    let operator = Operator::try_from_bytes(&operator_data)?;
    operator.validate_pda(operator_info.key())?;
    operator.validate_owner(operator_authority_info.key())?;

    let merchant_data = merchant_info.try_borrow_data()?;
    let merchant = Merchant::try_from_bytes(&merchant_data)?;

    // Load and validate merchant_operator_config
    let merchant_operator_config_data = merchant_operator_config_info.try_borrow_data()?;
    let (merchant_operator_config, policies, _allowed_mints) =
        MerchantOperatorConfig::try_from_bytes(&merchant_operator_config_data)?;

    // Validate merchant_operator_config PDA
    merchant_operator_config.validate_pda(merchant_operator_config_info.key())?;

    // Validate operator and merchant match the config
    merchant_operator_config.validate_operator(operator_info.key())?;
    merchant_operator_config.validate_merchant(merchant_info.key())?;

    // Load and validate payment
    let mut payment_data = payment_info.try_borrow_mut_data()?;
    let mut payment = Payment::try_from_bytes(&payment_data)?;

    // Validate payment status is Paid (can only refund paid payments, not cleared ones)
    payment.validate_status(Status::Paid)?;

    // Validate Payment PDA
    // No need to validate mint since it's validated via the PDA seed
    payment.validate_pda(
        payment_info.key(),
        merchant_operator_config_info.key(),
        buyer_info.key(),
        mint_info.key(),
    )?;

    // Validate refund policy conditions
    validate_refund_policy(&policies, &payment)?;

    // Validate merchant escrow ATA (owned by merchant pda)
    get_ata(
        merchant_escrow_ata_info,
        merchant_info.key(),
        mint_info,
        token_program_info,
    )?;

    // Validate buyer ATA (owned by buyer)
    get_ata(
        buyer_ata_info,
        buyer_info.key(),
        mint_info,
        token_program_info,
    )?;

    // Transfer tokens from merchant escrow back to buyer
    // Use PDA as authority for the transfer
    let bump_seed = [merchant.bump];
    let signer_seeds = [
        Seed::from(MERCHANT_SEED),
        Seed::from(merchant.owner.as_ref()),
        Seed::from(&bump_seed),
    ];

    Transfer {
        from: merchant_escrow_ata_info,
        to: buyer_ata_info,
        authority: merchant_info,
        amount: payment.amount,
    }
    .invoke_signed(&[Signer::from(&signer_seeds)])?;

    // Update payment status to refunded and save
    payment.status = Status::Refunded;

    payment_data.copy_from_slice(&payment.to_bytes());

    // Emit payment refunded event
    let event = PaymentRefundedEvent {
        discriminator: EventDiscriminators::PaymentRefunded as u8,
        buyer: *buyer_info.key(),
        merchant: *merchant_info.key(),
        operator: *operator_info.key(),
        amount: payment.amount,
        order_id: payment.order_id,
    };

    emit_event(
        program_id,
        event_authority_info,
        commerce_program_info,
        &event.to_bytes(),
    )?;

    Ok(())
}

fn validate_refund_policy(policies: &[PolicyData], payment: &Payment) -> Result<(), ProgramError> {
    let Some(policy) = MerchantOperatorConfig::get_policy_by_type(policies, PolicyType::Refund)
    else {
        return Ok(()); // No refund policy means no restrictions
    };

    let PolicyData::Refund(refund) = policy else {
        return Ok(()); // Should never happen since we found by type, but be safe
    };

    // Check max amount
    if refund.max_amount < payment.amount {
        return Err(CommerceProgramError::RefundAmountExceedsPolicyLimit.into());
    }

    // Check refund window (0 means no time restriction)
    if refund.max_time_after_purchase > 0 {
        let current_time = Clock::get()?.unix_timestamp;
        let time_since_payment = current_time - payment.created_at;
        let max_refund_time = refund.max_time_after_purchase as i64;

        if time_since_payment > max_refund_time {
            return Err(CommerceProgramError::RefundWindowExpired.into());
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::policy::{PolicyData, RefundPolicy};
    use crate::state::{Payment, Status};
    use alloc::vec;

    #[test]
    fn test_validate_refund_policy_no_policy() {
        let policies = vec![];
        let payment = Payment {
            order_id: 1,
            amount: 500,
            created_at: 1000000,
            status: Status::Paid,
            bump: 1,
        };

        // No policy should pass validation
        assert!(validate_refund_policy(&policies, &payment).is_ok());
    }

    #[test]
    fn test_validate_refund_policy_max_amount_pass() {
        let refund_policy = PolicyData::Refund(RefundPolicy {
            max_amount: 1000,
            max_time_after_purchase: 0, // No time restriction
        });
        let policies = vec![refund_policy];

        let payment = Payment {
            order_id: 1,
            amount: 500, // Below max amount
            created_at: 1000000,
            status: Status::Paid,
            bump: 1,
        };

        assert!(validate_refund_policy(&policies, &payment).is_ok());
    }

    #[test]
    fn test_validate_refund_policy_max_amount_exact() {
        let refund_policy = PolicyData::Refund(RefundPolicy {
            max_amount: 500,
            max_time_after_purchase: 0,
        });
        let policies = vec![refund_policy];

        let payment = Payment {
            order_id: 1,
            amount: 500, // Exactly at max amount
            created_at: 1000000,
            status: Status::Paid,
            bump: 1,
        };

        assert!(validate_refund_policy(&policies, &payment).is_ok());
    }

    #[test]
    fn test_validate_refund_policy_max_amount_fail() {
        let refund_policy = PolicyData::Refund(RefundPolicy {
            max_amount: 300,
            max_time_after_purchase: 0,
        });
        let policies = vec![refund_policy];

        let payment = Payment {
            order_id: 1,
            amount: 500, // Above max amount
            created_at: 1000000,
            status: Status::Paid,
            bump: 1,
        };

        let result = validate_refund_policy(&policies, &payment);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_refund_policy_zero_max_amount() {
        let refund_policy = PolicyData::Refund(RefundPolicy {
            max_amount: 0, // Zero max amount should block all refunds
            max_time_after_purchase: 0,
        });
        let policies = vec![refund_policy];

        let payment = Payment {
            order_id: 1,
            amount: 1, // Any amount should fail
            created_at: 1000000,
            status: Status::Paid,
            bump: 1,
        };

        let result = validate_refund_policy(&policies, &payment);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_refund_policy_time_restriction_no_limit() {
        let refund_policy = PolicyData::Refund(RefundPolicy {
            max_amount: 1000,
            max_time_after_purchase: 0, // No time restriction
        });
        let policies = vec![refund_policy];

        let payment = Payment {
            order_id: 1,
            amount: 500,
            created_at: 1, // Very old payment
            status: Status::Paid,
            bump: 1,
        };

        // No time restriction means any payment age should work
        assert!(validate_refund_policy(&policies, &payment).is_ok());
    }
}
