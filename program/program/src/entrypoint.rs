use pinocchio::{
    account_info::AccountInfo, entrypoint, program_error::ProgramError, pubkey::Pubkey,
    ProgramResult,
};

use crate::{
    processor::{
        process_chargeback_payment, process_clear_payment, process_close_payment,
        process_create_operator, process_emit_event, process_initialize_merchant,
        process_initialize_merchant_operator_config, process_make_payment, process_refund_payment,
        process_update_merchant_authority, process_update_merchant_settlement_wallet,
        process_update_operator_authority,
    },
    state::discriminator::CommerceInstructionDiscriminators,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let (discriminator, instruction_data) = instruction_data
        .split_first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    let discriminator = CommerceInstructionDiscriminators::try_from(*discriminator)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match discriminator {
        CommerceInstructionDiscriminators::CreateMerchant => {
            process_initialize_merchant(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::CreateOperator => {
            process_create_operator(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::InitializeMerchantOperatorConfig => {
            process_initialize_merchant_operator_config(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::MakePayment => {
            process_make_payment(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::ClearPayment => {
            process_clear_payment(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::RefundPayment => {
            process_refund_payment(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::ChargebackPayment => {
            process_chargeback_payment(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::UpdateMerchantSettlementWallet => {
            process_update_merchant_settlement_wallet(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::UpdateMerchantAuthority => {
            process_update_merchant_authority(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::UpdateOperatorAuthority => {
            process_update_operator_authority(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::ClosePayment => {
            process_close_payment(program_id, accounts, instruction_data)
        }
        CommerceInstructionDiscriminators::EmitEvent => process_emit_event(program_id, accounts),
    }
}
