use crate::{
    state_utils::*,
    utils::{
        assert_program_error, get_or_create_associated_token_account, set_mint, TestContext,
        DAYS_TO_CLOSE, INSUFFICIENT_SETTLEMENT_AMOUNT_ERROR, INVALID_ACCOUNT_DATA_ERROR,
        INVALID_ACCOUNT_OWNER_ERROR, INVALID_INSTRUCTION_DATA_ERROR, INVALID_MINT_ERROR,
        INVALID_PAYMENT_STATUS_ERROR, NOT_ENOUGH_ACCOUNT_KEYS_ERROR, SETTLEMENT_TOO_EARLY_ERROR,
        USDC_MINT, USDT_MINT,
    },
};
use commerce_program_client::{
    instructions::ClearPaymentBuilder,
    types::{FeeType, PolicyData, SettlementPolicy},
};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_program::ID as SYSTEM_PROGRAM_ID,
};
use spl_associated_token_account::get_associated_token_address;
use spl_token::ID as TOKEN_PROGRAM_ID;

// Helper function to set up test context for clear_payment tests
async fn setup_clear_payment_test(
    min_settlement_amount: u64,
    settlement_frequency_hours: u32,
) -> Result<
    (
        TestContext,
        Keypair,
        Keypair,
        Keypair,
        Keypair,
        Pubkey,
        Pubkey,
        Pubkey,
        Pubkey,
    ),
    Box<dyn std::error::Error>,
> {
    let mut context = TestContext::new();
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)?;

    // Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)?;

    // Create merchant operator config
    let operator_fee = 500u64; // 5%
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![PolicyData::Settlement(SettlementPolicy {
        min_settlement_amount,
        settlement_frequency_hours,
        auto_settle: false,
    })];
    let accepted_currencies = vec![USDC_MINT, USDT_MINT];

    let (merchant_operator_config_pda, _) = assert_get_or_create_merchant_operator_config(
        &mut context,
        &merchant_authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        FeeType::Bps,
        current_order_id,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )?;

    // Make payment (not auto-settle so it goes to escrow)
    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC (6 decimals)

    let (payment_pda, _) = assert_make_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &merchant_operator_config_pda,
        &operator_pda,
        &USDC_MINT,
        order_id,
        amount,
        true,
        false,
    )?;

    Ok((
        context,
        operator_authority,
        merchant_authority,
        settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ))
}

/*
HAPPY PATH TESTS
*/
#[tokio::test]
async fn test_clear_payment_not_auto_settle_success() {
    let mut context = TestContext::new();

    // Create keypairs
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Step 1: Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)
        .expect("Should create operator");

    // Step 2: Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)
            .expect("Should create merchant");

    // Step 3: Create merchant operator config
    let operator_fee = 500u64; // 5%
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![PolicyData::Settlement(SettlementPolicy {
        min_settlement_amount: 0u64,
        settlement_frequency_hours: 0u32,
        auto_settle: false,
    })];
    let accepted_currencies = vec![USDC_MINT, USDT_MINT];

    let (merchant_operator_config_pda, _) = assert_get_or_create_merchant_operator_config(
        &mut context,
        &merchant_authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        FeeType::Bps,
        current_order_id,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )
    .expect("Should create merchant operator config");

    // Step 4: Make payment
    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC (6 decimals)

    let (payment_pda, _) = assert_make_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &merchant_operator_config_pda,
        &operator_pda,
        &USDC_MINT,
        order_id,
        amount,
        true,
        false,
    )
    .expect("Should make payment successfully");

    // Step 5: Clear payment
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully");
}

#[tokio::test]
async fn test_clear_payment_with_lamports_fee() {
    let mut context = TestContext::new();

    // Create keypairs
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Step 1: Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)
        .expect("Should create operator");

    // Step 2: Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)
            .expect("Should create merchant");

    // Step 3: Create merchant operator config with fixed lamports fee
    let operator_fee = 50_000u64; // 0.05 USDC fixed fee
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![];
    let accepted_currencies = vec![USDC_MINT];

    let (merchant_operator_config_pda, _) = assert_get_or_create_merchant_operator_config(
        &mut context,
        &merchant_authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        FeeType::Fixed,
        current_order_id,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )
    .expect("Should create merchant operator config");

    // Step 4: Make payment
    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC

    let (payment_pda, _) = assert_make_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &merchant_operator_config_pda,
        &operator_pda,
        &USDC_MINT,
        order_id,
        amount,
        true,
        false,
    )
    .expect("Should make payment successfully");

    // Step 5: Clear payment with fixed fee
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully");
}

#[tokio::test]
async fn test_clear_payment_with_zero_fee() {
    let mut context = TestContext::new();

    // Create keypairs
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Step 1: Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)
        .expect("Should create operator");

    // Step 2: Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)
            .expect("Should create merchant");

    // Step 3: Create merchant operator config with zero fee
    let operator_fee = 0u64; // No fee
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![];
    let accepted_currencies = vec![USDC_MINT];

    let (merchant_operator_config_pda, _) = assert_get_or_create_merchant_operator_config(
        &mut context,
        &merchant_authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        FeeType::Bps,
        current_order_id,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )
    .expect("Should create merchant operator config");

    // Step 4: Make payment
    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC

    let (payment_pda, _) = assert_make_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &merchant_operator_config_pda,
        &operator_pda,
        &USDC_MINT,
        order_id,
        amount,
        true,
        false,
    )
    .expect("Should make payment successfully");

    // Step 5: Clear payment - all funds should go to merchant
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully");
}

#[tokio::test]
async fn test_clear_payment_with_settlement_policy_success() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        _operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(500_000u64, 0u32) // min_settlement_amount = 0.5 USDC, no time restriction
        .await
        .unwrap();

    // Clear payment should succeed as payment amount (1 USDC) > min_settlement_amount (0.5 USDC)
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully with settlement policy");
}

#[tokio::test]
async fn test_clear_payment_with_time_restriction_success() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        _operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 1u32) // no min amount, 1 hour time restriction
        .await
        .unwrap();

    // Advance time by 1 hour and 1 second to satisfy time restriction
    context.advance_clock(3601); // 1 hour + 1 second

    // Clear payment should succeed
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully after time restriction");
}

#[tokio::test]
async fn test_clear_payment_high_bps_fee() {
    let mut context = TestContext::new();

    // Create keypairs
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Step 1: Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)
        .expect("Should create operator");

    // Step 2: Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)
            .expect("Should create merchant");

    // Step 3: Create merchant operator config with high BPS fee
    let operator_fee = 2000u64; // 20% (2000 bps)
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![];
    let accepted_currencies = vec![USDC_MINT];

    let (merchant_operator_config_pda, _) = assert_get_or_create_merchant_operator_config(
        &mut context,
        &merchant_authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        FeeType::Bps,
        current_order_id,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )
    .expect("Should create merchant operator config");

    // Step 4: Make payment
    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC

    let (payment_pda, _) = assert_make_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &merchant_operator_config_pda,
        &operator_pda,
        &USDC_MINT,
        order_id,
        amount,
        true,
        false,
    )
    .expect("Should make payment successfully");

    // Step 5: Clear payment - operator should get 20% (200,000), merchant 80% (800,000)
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully");
}

#[tokio::test]
async fn test_clear_payment_fee_exceeds_amount() {
    let mut context = TestContext::new();

    // Create keypairs
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Step 1: Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)
        .expect("Should create operator");

    // Step 2: Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)
            .expect("Should create merchant");

    // Step 3: Create merchant operator config with fixed lamports fee that exceeds typical payment amounts
    let operator_fee = 10_000_000u64; // 10 USDC fixed fee
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![];
    let accepted_currencies = vec![USDC_MINT];

    let (merchant_operator_config_pda, _) = assert_get_or_create_merchant_operator_config(
        &mut context,
        &merchant_authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        FeeType::Fixed,
        current_order_id,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )
    .expect("Should create merchant operator config");

    // Step 4: Make a small payment that's less than the operator fee
    let order_id = 1u32;
    let amount = 100_000u64; // 0.1 USDC (much less than 10 USDC fee)

    let (payment_pda, _) = assert_make_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &merchant_operator_config_pda,
        &operator_pda,
        &USDC_MINT,
        order_id,
        amount,
        true,
        false,
    )
    .expect("Should make payment successfully");

    // Step 5: Clear payment - operator should get the entire payment amount, merchant gets 0
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully even when fee exceeds amount");
}

/*
SAD PATH TESTS
*/
#[tokio::test]
async fn test_clear_payment_unsigned_operator_authority_fails() {
    let (
        mut context,
        _operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    let non_signer = Keypair::new();
    context
        .airdrop_if_required(&non_signer.pubkey(), 1_000_000_000)
        .unwrap();

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(non_signer.pubkey()) // Wrong operator authority
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&non_signer]);
    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_clear_payment_invalid_payment_status_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    // First clear the payment to change its status to Cleared
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should clear payment successfully first time");

    // Try to clear again - should fail because payment is already cleared
    // Use a different payer to avoid AlreadyProcessed error from identical transactions
    let different_payer = Keypair::new();
    context
        .airdrop_if_required(&different_payer.pubkey(), 1_000_000_000)
        .unwrap();

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(different_payer.pubkey()) // Use different payer to avoid duplicate transaction
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context
        .send_transaction_with_signers(instruction, &[&different_payer, &operator_authority]);
    assert_program_error(result, INVALID_PAYMENT_STATUS_ERROR);
}

#[tokio::test]
async fn test_clear_payment_invalid_operator_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        _operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    let fake_operator = Keypair::new();

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&fake_operator.pubkey(), &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(fake_operator.pubkey()) // Wrong operator
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert!(
        result.is_err(),
        "Expected clear_payment to fail with invalid operator"
    );
}

#[tokio::test]
async fn test_clear_payment_invalid_merchant_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    let fake_merchant = Keypair::new();

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&fake_merchant.pubkey(), &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&fake_merchant.pubkey(), &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(fake_merchant.pubkey()) // Wrong merchant
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_clear_payment_invalid_merchant_operator_config_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        _merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    let fake_config = Keypair::new();

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(fake_config.pubkey()) // Wrong merchant operator config
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_clear_payment_invalid_mint_not_in_allowed_list_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    // Use a pubkey that's not in the allowed currencies list (USDC and USDT)
    let invalid_mint = Pubkey::new_unique();
    set_mint(&mut context, &invalid_mint);

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &invalid_mint);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &invalid_mint);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &invalid_mint);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(invalid_mint) // This mint is not in allowed_currencies
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_MINT_ERROR);
}

#[tokio::test]
async fn test_clear_payment_invalid_payment_pda_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        _payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    let fake_payment = Keypair::new();

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(fake_payment.pubkey()) // Wrong payment PDA
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_clear_payment_invalid_merchant_escrow_ata_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    let different_merchant = Keypair::new();
    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let wrong_merchant_escrow_ata =
        get_associated_token_address(&different_merchant.pubkey(), &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(wrong_merchant_escrow_ata) // Wrong escrow ATA
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_INSTRUCTION_DATA_ERROR);
}

#[tokio::test]
async fn test_clear_payment_not_enough_account_keys_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 0u32).await.unwrap();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    // Create instruction with insufficient accounts (missing event_authority)
    let accounts = vec![
        AccountMeta::new(context.payer.pubkey(), true),
        AccountMeta::new(payment_pda, false),
        AccountMeta::new_readonly(operator_authority.pubkey(), true),
        AccountMeta::new_readonly(buyer.pubkey(), false),
        AccountMeta::new_readonly(merchant_pda, false),
        AccountMeta::new_readonly(operator_pda, false),
        AccountMeta::new_readonly(merchant_operator_config_pda, false),
        AccountMeta::new_readonly(USDC_MINT, false),
        AccountMeta::new(merchant_escrow_ata, false),
        AccountMeta::new(merchant_settlement_ata, false),
        AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
        // Missing event_authority account
    ];

    let instruction = Instruction {
        program_id: commerce_program_client::COMMERCE_PROGRAM_ID,
        accounts,
        data: vec![4], // Clear payment instruction discriminator
    };

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, NOT_ENOUGH_ACCOUNT_KEYS_ERROR);
}

/*
SETTLEMENT POLICY VALIDATION TESTS
*/

#[tokio::test]
async fn test_clear_payment_insufficient_settlement_amount_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(2_000_000u64, 0u32) // min_settlement_amount = 2 USDC, payment is only 1 USDC
        .await
        .unwrap();

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INSUFFICIENT_SETTLEMENT_AMOUNT_ERROR);
}

#[tokio::test]
async fn test_clear_payment_settlement_too_early_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(0u64, 2u32) // no min amount, 2 hour time restriction
        .await
        .unwrap();

    // Advance time by only 1 hour (less than required 2 hours)
    context.advance_clock(3600); // 1 hour

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, SETTLEMENT_TOO_EARLY_ERROR);
}

#[tokio::test]
async fn test_clear_payment_both_settlement_policies_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
    ) = setup_clear_payment_test(2_000_000u64, 2u32) // both min amount (2 USDC) and time (2 hours) restrictions
        .await
        .unwrap();

    // Payment amount is only 1 USDC, which fails the min_settlement_amount check
    // Don't advance time, so it would also fail the time check

    // Get the correct settlement wallet from merchant account
    let merchant_account = context
        .get_account(&merchant_pda)
        .expect("Merchant should exist");
    let merchant_data = commerce_program_client::Merchant::from_bytes(&merchant_account.data)
        .expect("Should deserialize merchant");
    let settlement_wallet = merchant_data.settlement_wallet;

    // Get operator owner from operator account
    let operator_account = context
        .get_account(&operator_pda)
        .expect("Operator should exist");
    let operator_data = commerce_program_client::Operator::from_bytes(&operator_account.data)
        .expect("Should deserialize operator");
    let operator_owner = operator_data.owner;

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let merchant_settlement_ata = get_associated_token_address(&settlement_wallet, &USDC_MINT);
    let operator_settlement_ata = get_associated_token_address(&operator_owner, &USDC_MINT);

    let instruction = ClearPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(merchant_settlement_ata)
        .operator_settlement_ata(operator_settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    // Should fail on the first check (insufficient amount)
    assert_program_error(result, INSUFFICIENT_SETTLEMENT_AMOUNT_ERROR);
}
