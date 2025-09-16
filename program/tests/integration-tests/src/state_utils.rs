use crate::{
    assertions::{
        assert_account_not_exists, assert_merchant_account,
        assert_merchant_operator_config_account, assert_multiple_token_balance_changes,
        assert_operator_account, assert_payment_account, assert_token_balance_changes,
        BalanceChange,
    },
    utils::{
        assert_event_present, find_merchant_operator_config_pda, find_merchant_pda,
        find_operator_pda, find_payment_pda, get_or_create_associated_token_account,
        get_token_balance, set_token_balance, TestContext, MAX_BPS,
    },
};
use commerce_program_client::{
    instructions::{
        ClearPaymentBuilder, ClosePaymentBuilder, CreateOperatorBuilder, InitializeMerchantBuilder,
        InitializeMerchantOperatorConfigBuilder, MakePaymentBuilder, RefundPaymentBuilder,
        UpdateMerchantAuthorityBuilder, UpdateMerchantSettlementWalletBuilder,
        UpdateOperatorAuthorityBuilder,
    },
    types::{FeeType, PolicyData, Status},
};
use solana_sdk::{
    instruction::AccountMeta,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_program::ID as SYSTEM_PROGRAM_ID,
};
use spl_associated_token_account::get_associated_token_address;
use spl_token::ID as TOKEN_PROGRAM_ID;

pub fn assert_get_or_create_operator(
    context: &mut TestContext,
    owner: &Keypair,
    fail_if_exists: bool,
    with_profiling: bool,
) -> Result<(Pubkey, u8), Box<dyn std::error::Error>> {
    context.airdrop_if_required(&owner.pubkey(), 1_000_000_000)?;

    let (operator_pda, bump) = find_operator_pda(&owner.pubkey());

    if fail_if_exists {
        assert_account_not_exists(context, &operator_pda);
    }

    // Create operator instruction
    let instruction = CreateOperatorBuilder::new()
        .bump(bump)
        .payer(context.payer.pubkey())
        .authority(owner.pubkey())
        .operator(operator_pda)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    // Send transaction with owner as additional signer
    context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[owner],
            with_profiling,
        )
        .expect("Create operator should succeed");

    assert_operator_account(context, &operator_pda, &owner.pubkey(), bump);

    Ok((operator_pda, bump))
}

pub fn assert_get_or_create_merchant(
    context: &mut TestContext,
    authority: &Keypair,
    settlement_wallet: &Keypair,
    fail_if_exists: bool,
    with_profiling: bool,
) -> Result<(Pubkey, u8), Box<dyn std::error::Error>> {
    context.airdrop_if_required(&authority.pubkey(), 1_000_000_000)?;

    let (merchant_pda, bump) = find_merchant_pda(&authority.pubkey());

    if fail_if_exists {
        assert_account_not_exists(context, &merchant_pda);
    }

    // Initialize merchant instruction
    let instruction = InitializeMerchantBuilder::new()
        .bump(bump)
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(merchant_pda)
        .settlement_wallet(settlement_wallet.pubkey())
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    // Send transaction with authority as additional signer
    context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[authority],
            with_profiling,
        )
        .expect("Create merchant should succeed");

    assert_merchant_account(
        context,
        &merchant_pda,
        &authority.pubkey(),
        bump,
        &settlement_wallet.pubkey(),
    );

    Ok((merchant_pda, bump))
}

#[allow(clippy::too_many_arguments)]
pub fn assert_get_or_create_merchant_operator_config(
    context: &mut TestContext,
    authority: &Keypair,
    merchant_pda: &Pubkey,
    operator_pda: &Pubkey,
    version: u32,
    operator_fee: u64,
    fee_type: FeeType,
    current_order_id: u32,
    days_to_close: u16,
    policies: Vec<PolicyData>,
    accepted_currencies: Vec<Pubkey>,
    fail_if_exists: bool,
    with_profiling: bool,
) -> Result<(Pubkey, u8), Box<dyn std::error::Error>> {
    let (merchant_operator_config_pda, merchant_operator_config_bump) =
        find_merchant_operator_config_pda(merchant_pda, operator_pda, version);

    if fail_if_exists {
        assert_account_not_exists(context, &merchant_operator_config_pda);
    }

    // Initialize MerchantOperatorConfig instruction
    let mut builder = InitializeMerchantOperatorConfigBuilder::new();
    builder
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(*merchant_pda)
        .operator(*operator_pda)
        .config(merchant_operator_config_pda)
        .system_program(SYSTEM_PROGRAM_ID)
        .version(version)
        .bump(merchant_operator_config_bump)
        .operator_fee(operator_fee)
        .fee_type(fee_type)
        .days_to_close(days_to_close)
        .policies(policies.clone())
        .accepted_currencies(accepted_currencies.clone());

    // Add mint accounts as remaining accounts for each accepted currency
    for currency in &accepted_currencies {
        builder.add_remaining_account(AccountMeta::new_readonly(*currency, false));
    }

    let instruction = builder.instruction();

    // Send transaction with authority as additional signer
    context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[authority],
            with_profiling,
        )
        .expect("Create merchant operator config should succeed");

    assert_merchant_operator_config_account(
        context,
        &merchant_operator_config_pda,
        merchant_operator_config_bump,
        version,
        merchant_pda,
        operator_pda,
        operator_fee,
        current_order_id,
        policies.len() as u32,
        accepted_currencies.len() as u32,
    );

    Ok((merchant_operator_config_pda, merchant_operator_config_bump))
}

#[allow(clippy::too_many_arguments)]
pub fn assert_make_payment(
    context: &mut TestContext,
    payer: &Keypair,
    operator_authority: &Keypair,
    buyer: &Keypair,
    merchant_operator_config_pda: &Pubkey,
    operator_pda: &Pubkey,
    mint: &Pubkey,
    order_id: u32,
    amount: u64,
    fail_if_exists: bool,
    is_auto_settle: bool,
    with_profiling: bool,
) -> Result<(Pubkey, u8), Box<dyn std::error::Error>> {
    context.airdrop_if_required(&payer.pubkey(), 1_000_000_000)?;
    context.airdrop_if_required(&operator_authority.pubkey(), 1_000_000_000)?;
    context.airdrop_if_required(&buyer.pubkey(), 1_000_000_000)?;

    let (payment_pda, bump) = find_payment_pda(
        merchant_operator_config_pda,
        &buyer.pubkey(),
        mint,
        order_id,
    );

    if fail_if_exists {
        assert_account_not_exists(context, &payment_pda);
    }

    // Get the merchant from the merchant_operator_config
    let merchant_operator_config_account = context
        .get_account(merchant_operator_config_pda)
        .expect("Merchant operator config should exist");
    let merchant_operator_config = commerce_program_client::MerchantOperatorConfig::from_bytes(
        &merchant_operator_config_account.data,
    )
    .expect("Should deserialize merchant operator config");
    let merchant_pda = merchant_operator_config.merchant;

    // Get the merchant account to get settlement wallet
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant.settlement_wallet;

    // Calculate ATAs
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), mint);
    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, mint);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, mint);

    set_token_balance(context, &buyer_ata, mint, &buyer.pubkey(), amount * 2);

    // Create merchant escrow ATA if it doesn't exist
    get_or_create_associated_token_account(context, &merchant_pda, mint);

    // Create merchant settlement ATA if it doesn't exist and auto_settle is true
    if is_auto_settle {
        get_or_create_associated_token_account(context, &settlement_wallet, mint);
    }

    // Get pre-balances for token transfer assertion (buyer to escrow)
    let pre_balances = [
        get_token_balance(context, &buyer_ata),
        get_token_balance(context, &merchant_escrow_ata),
    ];

    // Create make payment instruction
    let instruction = MakePaymentBuilder::new()
        .payer(payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(*operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(*merchant_operator_config_pda)
        .mint(*mint)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .instruction();

    // Send transaction with required signers (payer, operator_authority, buyer)
    let transaction_metadata = context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[operator_authority, buyer],
            with_profiling,
        )
        .expect("Make payment should succeed");

    let expected_payment_status = if is_auto_settle {
        Status::Cleared
    } else {
        Status::Paid
    };

    let expected_receiver = if is_auto_settle {
        merchant_settlement_ata
    } else {
        merchant_escrow_ata
    };

    assert_payment_account(
        context,
        &payment_pda,
        order_id,
        amount,
        expected_payment_status,
    );

    // Assert token transfer from buyer to merchant escrow
    assert_token_balance_changes(
        context,
        pre_balances,
        &buyer_ata,
        &expected_receiver,
        amount,
    );

    // Assert PaymentCreated event was emitted
    assert_event_present(
        &transaction_metadata,
        0, // PaymentCreated discriminator
        &buyer.pubkey(),
        &merchant_pda,
        operator_pda,
        amount,
        order_id,
        None,
    );

    Ok((payment_pda, bump))
}

#[allow(clippy::too_many_arguments)]
pub fn assert_refund_payment(
    context: &mut TestContext,
    payer: &Keypair,
    operator_authority: &Keypair,
    buyer: &Keypair,
    payment_pda: &Pubkey,
    mint: &Pubkey,
    merchant_operator_config_pda: &Pubkey,
    with_profiling: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    context.airdrop_if_required(&payer.pubkey(), 1_000_000_000)?;
    context.airdrop_if_required(&operator_authority.pubkey(), 1_000_000_000)?;
    context.airdrop_if_required(&buyer.pubkey(), 1_000_000_000)?;

    // Get payment account to extract required information
    let payment_account = context
        .get_account(payment_pda)
        .expect("Payment should exist");
    let payment = commerce_program_client::Payment::from_bytes(&payment_account.data)
        .expect("Should deserialize payment");

    // Get the merchant from the merchant_operator_config
    let merchant_operator_config_account = context
        .get_account(merchant_operator_config_pda)
        .expect("Merchant operator config should exist");
    let merchant_operator_config = commerce_program_client::MerchantOperatorConfig::from_bytes(
        &merchant_operator_config_account.data,
    )
    .expect("Should deserialize merchant operator config");
    let merchant_pda = merchant_operator_config.merchant;
    let operator_pda = merchant_operator_config.operator;

    // Calculate ATAs
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), mint);
    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, mint);

    // Get pre-balances for token transfer assertion (escrow to buyer)
    let pre_balances = [
        get_token_balance(context, &merchant_escrow_ata),
        get_token_balance(context, &buyer_ata),
    ];

    // Create refund payment instruction
    let instruction = RefundPaymentBuilder::new()
        .payer(payer.pubkey())
        .payment(*payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(*merchant_operator_config_pda)
        .mint(*mint)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    // Send transaction with required signers (payer, operator_authority)
    let transaction_metadata = context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[operator_authority],
            with_profiling,
        )
        .expect("Refund payment should succeed");

    assert_payment_account(
        context,
        payment_pda,
        payment.order_id,
        payment.amount,
        Status::Refunded,
    );

    // Assert token transfer from merchant escrow back to buyer
    assert_token_balance_changes(
        context,
        pre_balances,
        &merchant_escrow_ata,
        &buyer_ata,
        payment.amount,
    );

    // Assert PaymentRefunded event was emitted
    assert_event_present(
        &transaction_metadata,
        2, // PaymentRefunded discriminator
        &buyer.pubkey(),
        &merchant_pda,
        &operator_pda,
        payment.amount,
        payment.order_id,
        None,
    );

    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub fn assert_clear_payment(
    context: &mut TestContext,
    payer: &Keypair,
    operator_authority: &Keypair,
    buyer: &Keypair,
    payment_pda: &Pubkey,
    mint: &Pubkey,
    merchant_operator_config_pda: &Pubkey,
    with_profiling: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    context.airdrop_if_required(&payer.pubkey(), 1_000_000_000)?;
    context.airdrop_if_required(&operator_authority.pubkey(), 1_000_000_000)?;
    context.airdrop_if_required(&buyer.pubkey(), 1_000_000_000)?;

    // Get payment account to extract required information
    let payment_account = context
        .get_account(payment_pda)
        .expect("Payment should exist");
    let payment = commerce_program_client::Payment::from_bytes(&payment_account.data)
        .expect("Should deserialize payment");

    // Get the merchant from the merchant_operator_config
    let merchant_operator_config_account = context
        .get_account(merchant_operator_config_pda)
        .expect("Merchant operator config should exist");
    let merchant_operator_config = commerce_program_client::MerchantOperatorConfig::from_bytes(
        &merchant_operator_config_account.data,
    )
    .expect("Should deserialize merchant operator config");
    let merchant_pda = merchant_operator_config.merchant;
    let operator_pda = merchant_operator_config.operator;
    let operator_fee = merchant_operator_config.operator_fee;
    let fee_type = merchant_operator_config.fee_type;

    // Get the merchant account to get settlement wallet
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant.settlement_wallet;

    // Get the operator account to get operator owner
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator.owner;

    // Calculate ATAs
    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, mint);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, mint);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, mint);

    // Create settlement ATAs if they don't exist
    get_or_create_associated_token_account(context, &settlement_wallet, mint);
    get_or_create_associated_token_account(context, &operator_owner, mint);

    // Get pre-balances for all ATAs
    let pre_balances = vec![
        (
            merchant_escrow_ata,
            get_token_balance(context, &merchant_escrow_ata),
        ),
        (
            merchant_settlement_ata,
            get_token_balance(context, &merchant_settlement_ata),
        ),
        (
            operator_settlement_ata,
            get_token_balance(context, &operator_settlement_ata),
        ),
    ];

    // Create clear payment instruction
    let instruction = ClearPaymentBuilder::new()
        .payer(payer.pubkey())
        .payment(*payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(*merchant_operator_config_pda)
        .mint(*mint)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    // Send transaction with required signers (payer, operator_authority)
    let transaction_metadata = context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[operator_authority],
            with_profiling,
        )
        .expect("Clear payment should succeed");

    assert_payment_account(
        context,
        payment_pda,
        payment.order_id,
        payment.amount,
        Status::Cleared,
    );

    // Calculate expected amounts
    let (expected_operator_fee, expected_merchant_amount) = match fee_type {
        FeeType::Bps => {
            let fee = (payment.amount * operator_fee) / MAX_BPS;
            (fee, payment.amount - fee)
        }
        FeeType::Fixed => {
            // Cap operator fee at payment amount to prevent trapped funds
            let capped_fee = operator_fee.min(payment.amount);
            (capped_fee, payment.amount - capped_fee)
        }
    };

    // Assert balance changes using the generic function
    let balance_changes = vec![
        BalanceChange {
            ata: merchant_escrow_ata,
            expected_change: -(payment.amount as i64),
            description: "Escrow balance should decrease by payment amount".to_string(),
        },
        BalanceChange {
            ata: merchant_settlement_ata,
            expected_change: expected_merchant_amount as i64,
            description: "Merchant balance should increase by payment amount minus operator fee"
                .to_string(),
        },
        BalanceChange {
            ata: operator_settlement_ata,
            expected_change: expected_operator_fee as i64,
            description: "Operator balance should increase by operator fee".to_string(),
        },
    ];

    assert_multiple_token_balance_changes(context, &pre_balances, &balance_changes);

    // Assert PaymentCleared event was emitted
    assert_event_present(
        &transaction_metadata,
        1, // PaymentCleared discriminator
        &buyer.pubkey(),
        &merchant_pda,
        &operator_pda,
        payment.amount,
        payment.order_id,
        Some(expected_operator_fee),
    );

    Ok(())
}

pub fn assert_update_merchant_settlement_wallet(
    context: &mut TestContext,
    authority: &Keypair,
    with_profiling: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let new_settlement_wallet = Keypair::new();

    let (merchant_pda, bump) = find_merchant_pda(&authority.pubkey());

    let instruction = UpdateMerchantSettlementWalletBuilder::new()
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(merchant_pda)
        .new_settlement_wallet(new_settlement_wallet.pubkey())
        .instruction();

    context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[authority],
            with_profiling,
        )
        .expect("Update merchant settlement wallet should succeed");

    assert_merchant_account(
        context,
        &merchant_pda,
        &authority.pubkey(),
        bump,
        &new_settlement_wallet.pubkey(),
    );

    Ok(())
}

pub fn assert_update_merchant_authority(
    context: &mut TestContext,
    authority: &Keypair,
    settlement_wallet: &Pubkey,
    with_profiling: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let new_authority = Keypair::new();
    let (merchant_pda, bump) = find_merchant_pda(&authority.pubkey());

    let instruction = UpdateMerchantAuthorityBuilder::new()
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(merchant_pda)
        .new_authority(new_authority.pubkey())
        .instruction();

    context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[authority],
            with_profiling,
        )
        .expect("Update merchant settlement wallet should succeed");

    assert_merchant_account(
        context,
        &merchant_pda,
        &new_authority.pubkey(),
        bump,
        settlement_wallet,
    );

    Ok(())
}

pub fn assert_update_operator_authority(
    context: &mut TestContext,
    authority: &Keypair,
    with_profiling: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let (operator_pda, bump) = find_operator_pda(&authority.pubkey());

    let new_authority = Keypair::new();

    let instruction = UpdateOperatorAuthorityBuilder::new()
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .operator(operator_pda)
        .new_operator_authority(new_authority.pubkey())
        .instruction();

    context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[authority],
            with_profiling,
        )
        .expect("Update operator authority should succeed");

    assert_operator_account(context, &operator_pda, &new_authority.pubkey(), bump);

    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub fn assert_close_payment(
    context: &mut TestContext,
    payer: &Keypair,
    payment_pda: &Pubkey,
    buyer: &Pubkey,
    merchant_pda: &Pubkey,
    operator_pda: &Pubkey,
    merchant_operator_config_pda: &Pubkey,
    mint: &Pubkey,
    operator_authority: &Keypair,
    with_profiling: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    context.airdrop_if_required(&payer.pubkey(), 1_000_000_000)?;

    // Get initial balance of fee payer to verify lamport transfer
    let initial_payer_balance = context
        .get_account(&payer.pubkey())
        .map(|a| a.lamports)
        .unwrap_or(0);

    // Create close payment instruction
    let instruction = ClosePaymentBuilder::new()
        .payer(payer.pubkey())
        .payment(*payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(*operator_pda)
        .merchant(*merchant_pda)
        .buyer(*buyer)
        .merchant_operator_config(*merchant_operator_config_pda)
        .mint(*mint)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    // Send transaction with required signers
    context
        .send_transaction_with_signers_with_transaction_result(
            instruction,
            &[payer, operator_authority],
            with_profiling,
        )
        .expect("Close payment should succeed");

    // Verify payment account is closed (balance should be 0)
    let final_payment_balance = context
        .get_account(payment_pda)
        .map(|a| a.lamports)
        .unwrap_or(0);
    assert_eq!(final_payment_balance, 0, "Payment account should be closed");

    // Verify lamports were transferred to fee payer
    let final_payer_balance = context
        .get_account(&payer.pubkey())
        .map(|a| a.lamports)
        .unwrap_or(0);
    assert!(
        final_payer_balance > initial_payer_balance,
        "Fee payer should receive lamports from closed account"
    );

    Ok(())
}
