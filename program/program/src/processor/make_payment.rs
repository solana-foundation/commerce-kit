extern crate alloc;

use crate::{processor::verify_token_program, ID as COMMERCE_PROGRAM_ID};
use pinocchio::{
    account_info::AccountInfo,
    instruction::Seed,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvars::{clock::Clock, rent::Rent, Sysvar},
    ProgramResult,
};
use pinocchio_token::instructions::Transfer;

use crate::{
    constants::PAYMENT_SEED,
    error::CommerceProgramError,
    processor::{
        create_pda_account, get_ata, validate_pda, verify_owner_mutability, verify_signer,
        verify_system_account, verify_system_program, verify_token_program_account,
    },
    require_len,
    state::{
        discriminator::AccountSerialize, Merchant, MerchantOperatorConfig, Operator, Payment,
        PolicyData, PolicyType, Status,
    },
};

#[inline(always)]
pub fn process_make_payment(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let args = process_instruction_data(instruction_data)?;
    let [fee_payer_info, payment_info, operator_authority_info, buyer_info, operator_info, merchant_info, merchant_operator_config_info, mint_info, buyer_ata_info, merchant_escrow_ata_info, merchant_settlement_ata_info, token_program_info, system_program_info] =
        accounts
    else {
        return Err(ProgramError::NotEnoughAccountKeys);
    };

    // Validate fee_payer is writable signer
    verify_signer(fee_payer_info, true)?;

    // Validate: operator_authority should have signed
    verify_signer(operator_authority_info, false)?;

    // Validate: buyer should have signed
    verify_signer(buyer_info, false)?;

    // Validate payment is writable
    verify_system_account(payment_info, true)?;

    // Validate system program
    verify_system_program(system_program_info)?;

    // Validate merchant_operator_config is owned by this program
    verify_owner_mutability(merchant_operator_config_info, &COMMERCE_PROGRAM_ID, true)?;

    // validate operator is owned by the program
    verify_owner_mutability(operator_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate merchant is owned by this program
    verify_owner_mutability(merchant_info, &COMMERCE_PROGRAM_ID, false)?;

    // Validate mint is owned by token program
    verify_token_program_account(mint_info)?;

    // Validate token program
    verify_token_program(token_program_info)?;

    // Load and validate operator
    let operator_data = operator_info.try_borrow_data()?;
    let operator = Operator::try_from_bytes(&operator_data)?;

    operator.validate_pda(operator_info.key())?;
    operator.validate_owner(operator_authority_info.key())?;

    // Load and validate merchant_operator_config
    let mut merchant_operator_config_data = merchant_operator_config_info.try_borrow_mut_data()?;
    let (mut merchant_operator_config, policies, allowed_mints) =
        MerchantOperatorConfig::try_from_bytes(&merchant_operator_config_data)?;

    // Load and validate merchant
    let merchant_data = merchant_info.try_borrow_data()?;
    let merchant = Merchant::try_from_bytes(&merchant_data)?;

    // Validate merchant_operator_config PDA
    merchant_operator_config.validate_pda(merchant_operator_config_info.key())?;

    // Validate operator is the operator in the merchant_operator_config
    merchant_operator_config.validate_operator(operator_info.key())?;
    merchant_operator_config.validate_order_id(args.order_id)?;

    // Validate mint is in the allowed_mints
    if !allowed_mints.contains(mint_info.key()) {
        return Err(CommerceProgramError::InvalidMint.into());
    }

    // Validate Payment PDA
    let order_id_seed = args.order_id.to_le_bytes();
    validate_pda(
        &[
            PAYMENT_SEED,
            merchant_operator_config_info.key().as_ref(),
            buyer_info.key().as_ref(),
            mint_info.key().as_ref(),
            &order_id_seed,
        ],
        &Pubkey::from(*program_id),
        args.bump,
        payment_info,
    )?;

    // Validate buyer ATA
    get_ata(
        buyer_ata_info,
        buyer_info.key(),
        mint_info,
        token_program_info,
    )?;

    // Check if auto settlement is enabled
    let auto_settle = MerchantOperatorConfig::get_policy_by_type(&policies, PolicyType::Settlement)
        .map(|policy| {
            if let PolicyData::Settlement(settlement) = policy {
                settlement.auto_settle
            } else {
                false
            }
        })
        .unwrap_or(false);

    let (payment_status, transfer_to) = if auto_settle {
        // Auto settlement: validate settlement ATA and transfer directly to settlement wallet
        get_ata(
            merchant_settlement_ata_info,
            &merchant.settlement_wallet,
            mint_info,
            token_program_info,
        )?;

        // Payment is auto-settled
        (Status::Cleared, merchant_settlement_ata_info)
    } else {
        // No auto settlement: validate escrow ATA and transfer to escrow
        get_ata(
            merchant_escrow_ata_info,
            merchant_info.key(),
            mint_info,
            token_program_info,
        )?;

        // Payment remains Paid - needs manual clearing
        (Status::Paid, merchant_escrow_ata_info)
    };

    // Transfer tokens to the destination ATA
    Transfer {
        from: buyer_ata_info,
        to: transfer_to,
        authority: buyer_info,
        amount: args.amount,
    }
    .invoke()?;

    // Create payment PDA
    let space = Payment::LEN;
    let rent = Rent::get()?;
    let clock = Clock::get()?;
    let bump_seed = [args.bump];
    let signer_seeds = [
        Seed::from(PAYMENT_SEED),
        Seed::from(merchant_operator_config_info.key()),
        Seed::from(buyer_info.key()),
        Seed::from(mint_info.key()),
        Seed::from(&order_id_seed),
        Seed::from(&bump_seed),
    ];

    create_pda_account(
        fee_payer_info,
        &rent,
        space,
        program_id,
        payment_info,
        signer_seeds,
        None,
    )?;

    let payment = Payment {
        order_id: args.order_id,
        amount: args.amount,
        created_at: clock.unix_timestamp,
        status: payment_status,
    };

    // Save payment data
    let mut payment_data = payment_info.try_borrow_mut_data()?;
    payment_data.copy_from_slice(&payment.to_bytes());

    // Update current order id
    merchant_operator_config.current_order_id = merchant_operator_config
        .current_order_id
        .checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    merchant_operator_config_data
        .copy_from_slice(&merchant_operator_config.to_bytes(&policies, &allowed_mints));

    Ok(())
}

struct MakePaymentArgs {
    order_id: u32,
    amount: u64,
    bump: u8,
}

fn process_instruction_data(data: &[u8]) -> Result<MakePaymentArgs, ProgramError> {
    require_len!(data, 13); // 4 + 8 + 1
    let mut offset = 0;

    let order_id = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
    offset += 4;

    let amount = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    offset += 8;

    let bump = data[offset];

    Ok(MakePaymentArgs {
        order_id,
        amount,
        bump,
    })
}
