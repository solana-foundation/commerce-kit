use crate::{
    state_utils::*,
    utils::{
        assert_program_error, get_or_create_associated_token_account, TestContext, DAYS_TO_CLOSE,
        INVALID_ACCOUNT_DATA_ERROR, INVALID_ACCOUNT_OWNER_ERROR, INVALID_INSTRUCTION_DATA_ERROR,
        INVALID_PAYMENT_STATUS_ERROR, NOT_ENOUGH_ACCOUNT_KEYS_ERROR,
        REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT_ERROR, REFUND_WINDOW_EXPIRED_ERROR, USDC_MINT,
        USDT_MINT,
    },
};
use commerce_program_client::{
    instructions::RefundPaymentBuilder,
    types::{FeeType, PolicyData, RefundPolicy, SettlementPolicy},
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

// Helper function to set up test context for refund_payment tests
async fn setup_refund_payment_test(
    max_refund_amount: u64,
    max_time_after_purchase: u64,
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

    // Create merchant operator config with refund policy
    let operator_fee = 500u64; // 5%
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![
        PolicyData::Settlement(SettlementPolicy {
            min_settlement_amount: 0u64,
            settlement_frequency_hours: 0u32,
            auto_settle: false,
        }),
        PolicyData::Refund(RefundPolicy {
            max_amount: max_refund_amount,
            max_time_after_purchase,
        }),
    ];
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
async fn test_refund_payment_not_auto_settle_success() {
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

    // Step 3: Create merchant operator config with refund policy
    let operator_fee = 500u64; // 5%
    let version = 1u32;
    let current_order_id = 0u32;
    let policies = vec![
        PolicyData::Settlement(SettlementPolicy {
            min_settlement_amount: 0u64,
            settlement_frequency_hours: 0u32,
            auto_settle: false,
        }),
        PolicyData::Refund(RefundPolicy {
            max_amount: 10_000_000u64,      // 10 USDC max refund
            max_time_after_purchase: 86400, // 24 hours
        }),
    ];
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

    // Step 5: Refund payment
    assert_refund_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should refund payment successfully");
}

#[tokio::test]
async fn test_refund_payment_with_refund_policy_success() {
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
    ) = setup_refund_payment_test(5_000_000u64, 0u64) // max_amount = 5 USDC, no time restriction
        .await
        .unwrap();

    // Refund payment should succeed as payment amount (1 USDC) < max_refund_amount (5 USDC)
    assert_refund_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should refund payment successfully with refund policy");
}

#[tokio::test]
async fn test_refund_payment_within_time_window_success() {
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
    ) = setup_refund_payment_test(10_000_000u64, 3600u64) // high max amount, 1 hour time window
        .await
        .unwrap();

    // Advance time by 30 minutes (within the 1 hour window)
    context.advance_clock(1800); // 30 minutes

    // Refund payment should succeed
    assert_refund_payment(
        &mut context,
        &operator_authority,
        &operator_authority,
        &buyer,
        &payment_pda,
        &USDC_MINT,
        &merchant_operator_config_pda,
    )
    .expect("Should refund payment successfully within time window");
}

/*
SAD PATH TESTS
*/
#[tokio::test]
async fn test_refund_payment_invalid_signer_verification_fails() {
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
    ) = setup_refund_payment_test(10_000_000u64, 0u64)
        .await
        .unwrap();

    // Create a different signer that's not the operator authority
    let wrong_signer = Keypair::new();
    context
        .airdrop_if_required(&wrong_signer.pubkey(), 1_000_000_000)
        .unwrap();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(wrong_signer.pubkey()) // Wrong operator authority
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&wrong_signer]);
    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_refund_payment_unsigned_operator_authority_fails() {
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
    ) = setup_refund_payment_test(0u64, 0u64).await.unwrap();

    let non_signer = Keypair::new();
    context
        .airdrop_if_required(&non_signer.pubkey(), 1_000_000_000)
        .unwrap();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(non_signer.pubkey()) // Wrong operator authority
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&non_signer]);
    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_refund_payment_invalid_payment_status_fails() {
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
    ) = setup_refund_payment_test(0u64, 0u64).await.unwrap();

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

    // Try to refund - should fail because payment is already cleared
    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_PAYMENT_STATUS_ERROR);
}

#[tokio::test]
async fn test_refund_payment_invalid_operator_fails() {
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
    ) = setup_refund_payment_test(0u64, 0u64).await.unwrap();

    let fake_operator = Keypair::new();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(fake_operator.pubkey()) // Wrong operator
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert!(
        result.is_err(),
        "Expected refund_payment to fail with invalid operator"
    );
}

#[tokio::test]
async fn test_refund_payment_invalid_merchant_fails() {
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
    ) = setup_refund_payment_test(0u64, 0u64).await.unwrap();

    let fake_merchant = Keypair::new();

    let merchant_escrow_ata = get_associated_token_address(&fake_merchant.pubkey(), &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(fake_merchant.pubkey()) // Wrong merchant
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_refund_payment_invalid_merchant_operator_config_fails() {
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
    ) = setup_refund_payment_test(0u64, 0u64).await.unwrap();

    let fake_config = Keypair::new();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(fake_config.pubkey()) // Wrong merchant operator config
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_refund_payment_invalid_mint_pda_validation_fails() {
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
    ) = setup_refund_payment_test(10_000_000u64, 0u64)
        .await
        .unwrap(); // Allow enough refund amount

    // Use a different mint in the instruction than what was used to create the payment
    // This will fail the payment PDA validation since mint is part of the PDA seeds
    let different_mint = USDT_MINT; // Valid mint, but different from the USDC_MINT used in payment creation

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &different_mint);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &different_mint);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(different_mint) // Different mint from payment creation
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    // Payment PDA validation will fail because mint doesn't match the one used in payment creation
    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_refund_payment_invalid_payment_pda_fails() {
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
    ) = setup_refund_payment_test(0u64, 0u64).await.unwrap();

    let fake_payment = Keypair::new();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(fake_payment.pubkey()) // Wrong payment PDA
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_refund_payment_invalid_merchant_escrow_ata_fails() {
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
    ) = setup_refund_payment_test(10_000_000u64, 0u64)
        .await
        .unwrap();

    let different_merchant = Keypair::new();
    let wrong_merchant_escrow_ata =
        get_associated_token_address(&different_merchant.pubkey(), &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(wrong_merchant_escrow_ata) // Wrong escrow ATA
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, INVALID_INSTRUCTION_DATA_ERROR);
}

#[tokio::test]
async fn test_refund_payment_not_enough_account_keys_fails() {
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
    ) = setup_refund_payment_test(10_000_000u64, 0u64)
        .await
        .unwrap();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

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
        AccountMeta::new(buyer_ata, false),
        AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
        // Missing event_authority account
    ];

    let instruction = Instruction {
        program_id: commerce_program_client::COMMERCE_PROGRAM_ID,
        accounts,
        data: vec![5], // Refund payment instruction discriminator
    };

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, NOT_ENOUGH_ACCOUNT_KEYS_ERROR);
}

/*
REFUND POLICY VALIDATION TESTS
*/

#[tokio::test]
async fn test_refund_payment_exceeds_max_amount_fails() {
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
    ) = setup_refund_payment_test(500_000u64, 0u64) // max_amount = 0.5 USDC, payment is 1 USDC
        .await
        .unwrap();

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT_ERROR);
}

#[tokio::test]
async fn test_refund_payment_window_expired_fails() {
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
    ) = setup_refund_payment_test(10_000_000u64, 1800u64) // high max amount, 30 minute time window
        .await
        .unwrap();

    // Advance time by 1 hour (beyond the 30 minute window)
    context.advance_clock(3600); // 1 hour

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, REFUND_WINDOW_EXPIRED_ERROR);
}

#[tokio::test]
async fn test_refund_payment_both_refund_policies_fails() {
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
    ) = setup_refund_payment_test(500_000u64, 1800u64) // both max amount (0.5 USDC) and time (30 min) restrictions
        .await
        .unwrap();

    // Payment amount is 1 USDC, which fails the max_amount check
    // Don't advance time, so it would also fail if we got that far

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = RefundPaymentBuilder::new()
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .merchant_escrow_ata(merchant_escrow_ata)
        .buyer_ata(buyer_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    // Should fail on the first check (max amount)
    assert_program_error(result, REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT_ERROR);
}
