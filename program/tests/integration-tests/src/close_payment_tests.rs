use crate::{
    state_utils::*,
    utils::{
        assert_program_error, get_or_create_associated_token_account, TestContext, DAYS_TO_CLOSE,
        INVALID_ACCOUNT_DATA_ERROR, INVALID_ACCOUNT_OWNER_ERROR, INVALID_PAYMENT_STATUS_ERROR,
        MISSING_REQUIRED_SIGNATURE_ERROR, OPERATOR_OWNER_MISMATCH_ERROR,
        PAYMENT_CANNOT_BE_CLOSED_ERROR, USDC_MINT, USDT_MINT,
    },
};
use commerce_program_client::{
    instructions::ClosePaymentBuilder,
    types::{FeeType, PolicyData, SettlementPolicy},
};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_program::ID as SYSTEM_PROGRAM_ID,
};

// Helper function to set up test context for close_payment tests
async fn setup_close_payment_test() -> Result<
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
        u8,
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
        min_settlement_amount: 1_000_000u64,
        settlement_frequency_hours: 0u32, // No time restriction for testing
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

    // Make a payment first
    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC

    let (payment_pda, bump) = assert_make_payment(
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

    // Clear the payment so it can be closed
    assert_clear_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
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
        bump,
    ))
}

/*
HAPPY PATH TESTS
*/
#[tokio::test]
async fn test_close_payment_success() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    // Check initial payment account balance
    let initial_balance = context
        .get_account(&payment_pda)
        .map(|a| a.lamports)
        .unwrap_or(0);
    assert!(initial_balance > 0, "Payment account should have lamports");

    // Advance time by more than DAYS_TO_CLOSE (7 days = 604800 seconds)
    context.advance_clock(8 * 24 * 60 * 60); // 8 days in seconds

    // Close the payment
    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    context
        .send_transaction_with_signers(instruction, &[&operator_authority])
        .expect("Should close payment successfully");

    // Verify payment account is closed
    let final_balance = context
        .get_account(&payment_pda)
        .map(|a| a.lamports)
        .unwrap_or(0);
    assert_eq!(final_balance, 0, "Payment account should be closed");
}

/*
SAD PATH TESTS
*/

#[tokio::test]
async fn test_close_payment_unsigned_operator_authority_fails() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    let wrong_operator_authority = Keypair::new();

    let accounts = vec![
        AccountMeta::new(context.payer.pubkey(), true),
        AccountMeta::new(payment_pda, false),
        AccountMeta::new_readonly(wrong_operator_authority.pubkey(), false), // Mark as non-signer
        AccountMeta::new_readonly(operator_pda, false),
        AccountMeta::new_readonly(merchant_pda, false),
        AccountMeta::new_readonly(buyer.pubkey(), false),
        AccountMeta::new_readonly(merchant_operator_config_pda, false),
        AccountMeta::new_readonly(USDC_MINT, false),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
    ];

    let instruction = Instruction {
        program_id: commerce_program_client::COMMERCE_PROGRAM_ID,
        accounts,
        data: vec![9], // ClosePayment discriminator only, no additional data
    };

    let result = context.send_transaction_with_signers(instruction, &[]);
    assert_program_error(result, MISSING_REQUIRED_SIGNATURE_ERROR);
}

#[tokio::test]
async fn test_close_payment_invalid_operator_fails() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    let fake_operator = Keypair::new();

    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(fake_operator.pubkey()) // Wrong operator
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_close_payment_invalid_merchant_fails() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    let fake_merchant = Keypair::new();

    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(fake_merchant.pubkey()) // Wrong merchant
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_close_payment_payment_not_cleared_fails() {
    let mut context = TestContext::new();
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)
        .expect("Should create operator");

    // Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)
            .expect("Should create merchant");

    // Create merchant operator config
    let operator_fee = 500u64;
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![PolicyData::Settlement(SettlementPolicy {
        min_settlement_amount: 1_000_000u64,
        settlement_frequency_hours: 0u32, // No time restriction for testing
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

    // Make a payment but DON'T clear it
    let order_id = 1u32;
    let amount = 1_000_000u64;

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
    .expect("Should make payment");

    // Try to close payment that is not cleared
    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_PAYMENT_STATUS_ERROR);
}

#[tokio::test]
async fn test_close_payment_wrong_buyer_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        _buyer,
        operator_pda,
        merchant_pda,
        merchant_operator_config_pda,
        payment_pda,
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    let wrong_buyer = Keypair::new();

    // Advance time so payment can be closed (to get past days_to_close validation)
    context.advance_clock(8 * 24 * 60 * 60); // 8 days in seconds

    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(wrong_buyer.pubkey()) // Wrong buyer
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_close_payment_wrong_mint_fails() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    // Advance time so payment can be closed (to get past days_to_close validation)
    context.advance_clock(8 * 24 * 60 * 60); // 8 days in seconds

    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDT_MINT) // Wrong mint (payment was made with USDC)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_close_payment_invalid_merchant_operator_config_fails() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    let fake_config = Keypair::new();

    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(fake_config.pubkey()) // Wrong config
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_close_payment_paid_status_fails() {
    let mut context = TestContext::new();
    let operator_authority = context.payer.insecure_clone();
    let merchant_authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let buyer = Keypair::new();

    // Create buyer ATA
    get_or_create_associated_token_account(&mut context, &buyer.pubkey(), &USDC_MINT);

    // Create operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &operator_authority, true)
        .expect("Should create operator");

    // Create merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &merchant_authority, &settlement_wallet, true)
            .expect("Should create merchant");

    // Create merchant operator config with auto_settle = true to get Paid status
    let operator_fee = 500u64;
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![PolicyData::Settlement(SettlementPolicy {
        min_settlement_amount: 0u64,      // No minimum for auto-settlement
        settlement_frequency_hours: 0u32, // No time restriction for testing
        auto_settle: true,                // This will make payment go directly to Paid status
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

    // Make a payment that will auto-settle (Status::Paid)
    let order_id = 1u32;
    let amount = 1_000_000u64;

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
        true, // auto_settle = true, so payment will be in Paid status
    )
    .expect("Should make payment");

    // Try to close payment that is in Paid status - should fail
    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, PAYMENT_CANNOT_BE_CLOSED_ERROR);
}

#[tokio::test]
async fn test_close_payment_too_early_fails() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    // Try to close payment immediately (should fail due to days_to_close restriction)
    // Payment was just created, and DAYS_TO_CLOSE = 7, so it should fail
    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);

    // Should fail because not enough time has passed (need 7 days)
    // This should return an error related to premature closing
    assert!(
        result.is_err(),
        "Expected close payment to fail when called too early"
    );
}

#[tokio::test]
async fn test_close_payment_after_days_to_close_elapsed_success() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    // Advance time by more than DAYS_TO_CLOSE (7 days = 604800 seconds)
    context.advance_clock(8 * 24 * 60 * 60); // 8 days in seconds

    // Now try to close payment - should succeed
    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    context
        .send_transaction_with_signers(instruction, &[&operator_authority])
        .expect("Should close payment successfully after days_to_close elapsed");

    // Verify payment account is closed
    let final_balance = context
        .get_account(&payment_pda)
        .map(|a| a.lamports)
        .unwrap_or(0);
    assert_eq!(final_balance, 0, "Payment account should be closed");
}

#[tokio::test]
async fn test_close_payment_wrong_operator_authority_fails() {
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
        _bump,
    ) = setup_close_payment_test().await.unwrap();

    // Create a different authority that doesn't own the operator
    let wrong_authority = Keypair::new();
    context
        .airdrop_if_required(&wrong_authority.pubkey(), 1_000_000_000)
        .unwrap();

    let instruction = ClosePaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(wrong_authority.pubkey()) // Wrong authority
        .operator(operator_pda)
        .merchant(merchant_pda)
        .buyer(buyer.pubkey())
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&wrong_authority]);
    assert_program_error(result, OPERATOR_OWNER_MISMATCH_ERROR);
}
