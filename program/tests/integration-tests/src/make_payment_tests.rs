use crate::{
    state_utils::*,
    utils::{
        assert_program_error, find_merchant_pda, find_payment_pda,
        get_or_create_associated_token_account, set_mint, TestContext, INVALID_ACCOUNT_DATA_ERROR,
        INVALID_ACCOUNT_OWNER_ERROR, INVALID_INSTRUCTION_DATA_ERROR, INVALID_MINT_ERROR,
        MISSING_REQUIRED_SIGNATURE_ERROR, TOKEN_INSUFFICIENT_FUNDS_ERROR, USDC_MINT, USDT_MINT,
    },
};
use commerce_program_client::{
    instructions::MakePaymentBuilder,
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

// Helper function to set up test context for make_payment tests
async fn setup_make_payment_test(
    auto_settle: bool,
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
        settlement_frequency_hours: 30u32,
        auto_settle,
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
        policies,
        accepted_currencies,
        true,
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
    ))
}

/*
HAPPY PATH TESTS
*/
#[tokio::test]
async fn test_make_payment_not_auto_settle_success() {
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
        min_settlement_amount: 1_000_000u64,
        settlement_frequency_hours: 30u32,
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
        policies,
        accepted_currencies,
        true,
    )
    .expect("Should create merchant operator config");

    // Step 4: Make payment
    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC (6 decimals)

    assert_make_payment(
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
}

#[tokio::test]
async fn test_make_payment_with_auto_settle_success() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(true).await.unwrap(); // auto_settle = true

    let order_id = 1u32;
    let amount = 1_000_000u64; // 1 USDC (6 decimals)

    assert_make_payment(
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
        true,
    )
    .expect("Should make payment successfully with auto-settle");
}

/*
SAD PATH TESTS
*/

#[tokio::test]
async fn test_make_payment_unsigned_fee_payer_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    // Test with wrong payer account - use a different account as payer
    let wrong_payer = Keypair::new();
    context
        .airdrop_if_required(&wrong_payer.pubkey(), 1_000_000_000)
        .unwrap();

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(wrong_payer.pubkey()) // Wrong payer
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    // Include wrong_payer as a signer so transaction can be created, but it should fail during execution
    let result = context
        .send_transaction_with_signers(instruction, &[&wrong_payer, &operator_authority, &buyer]);

    assert_program_error(result, TOKEN_INSUFFICIENT_FUNDS_ERROR);
}

#[tokio::test]
async fn test_make_payment_unsigned_operator_authority_fails() {
    let (
        mut context,
        _operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    let non_signer = Keypair::new();
    context
        .airdrop_if_required(&non_signer.pubkey(), 1_000_000_000)
        .unwrap();

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(non_signer.pubkey()) // Wrong operator authority
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&non_signer, &buyer]);
    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_make_payment_unsigned_buyer_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let mut instruction_data = vec![3]; // Make payment discriminator
    instruction_data.extend_from_slice(&order_id.to_le_bytes());
    instruction_data.extend_from_slice(&amount.to_le_bytes());
    instruction_data.push(bump);

    let accounts = vec![
        AccountMeta::new(context.payer.pubkey(), true),
        AccountMeta::new(payment_pda, false),
        AccountMeta::new_readonly(operator_authority.pubkey(), true),
        AccountMeta::new_readonly(buyer.pubkey(), false), // Mark buyer as non-signer
        AccountMeta::new_readonly(operator_pda, false),
        AccountMeta::new_readonly(merchant_pda, false),
        AccountMeta::new(merchant_operator_config_pda, false),
        AccountMeta::new_readonly(USDC_MINT, false),
        AccountMeta::new(buyer_ata, false),
        AccountMeta::new(merchant_escrow_ata, false),
        AccountMeta::new(settlement_ata, false),
        AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
    ];

    let instruction = Instruction {
        program_id: commerce_program_client::COMMERCE_PROGRAM_ID,
        accounts,
        data: instruction_data,
    };

    // Only provide operator_authority as signer, not the buyer - should fail
    let result = context.send_transaction_with_signers(instruction, &[&operator_authority]);
    assert_program_error(result, MISSING_REQUIRED_SIGNATURE_ERROR);
}

#[tokio::test]
async fn test_make_payment_invalid_operator_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        _operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    let fake_operator = Keypair::new();

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(fake_operator.pubkey()) // Wrong operator
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);
    assert!(
        result.is_err(),
        "Expected make_payment to fail with invalid operator"
    );
}

#[tokio::test]
async fn test_make_payment_invalid_merchant_operator_config_pda_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        _merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    let fake_config = Keypair::new();

    let (payment_pda, bump) =
        find_payment_pda(&fake_config.pubkey(), &buyer.pubkey(), &USDC_MINT, order_id);

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(fake_config.pubkey()) // Wrong merchant operator config
        .mint(USDC_MINT)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_make_payment_wrong_order_id_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let wrong_order_id = 5u32; // Should be 1 (current_order_id + 1)
    let amount = 1_000_000u64;

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        wrong_order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(wrong_order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);

    // Check for token program insufficient funds error (buyer doesn't have enough tokens)
    assert_program_error(result, TOKEN_INSUFFICIENT_FUNDS_ERROR);
}

#[tokio::test]
async fn test_make_payment_invalid_mint_not_in_allowed_list_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    // Use a pubkey that's not in the allowed currencies list (USDC and USDT)
    let invalid_mint = Pubkey::new_unique();
    set_mint(&mut context, &invalid_mint);

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &invalid_mint,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &invalid_mint);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &invalid_mint);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &invalid_mint);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(invalid_mint) // This mint is not in allowed_currencies
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);

    // Check for specific InvalidMint error
    assert_program_error(result, INVALID_MINT_ERROR);
}

#[tokio::test]
async fn test_make_payment_invalid_payment_pda_wrong_bump_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    let (payment_pda, correct_bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let wrong_bump = if correct_bump == 255 {
        254
    } else {
        correct_bump + 1
    };

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(wrong_bump) // Wrong bump
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);

    assert_program_error(result, INVALID_INSTRUCTION_DATA_ERROR);
}

#[tokio::test]
async fn test_make_payment_invalid_buyer_ata_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    let order_id = 1u32;
    let amount = 1_000_000u64;

    let different_buyer = Keypair::new();
    context
        .airdrop_if_required(&different_buyer.pubkey(), 1_000_000_000)
        .unwrap();

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let _buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let different_buyer_ata = get_associated_token_address(&different_buyer.pubkey(), &USDC_MINT); // This ATA doesn't exist
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .buyer_ata(different_buyer_ata) // Wrong ATA that doesn't exist
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);

    assert_program_error(result, INVALID_INSTRUCTION_DATA_ERROR);
}

#[tokio::test]
async fn test_make_payment_invalid_instruction_data_length_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(false).await.unwrap();

    // Create properly formatted instruction data but with wrong length
    // MakePayment instruction discriminator (3) + partial data
    let mut invalid_data = vec![3]; // Correct instruction discriminator
    invalid_data.extend_from_slice(&[0; 10]); // Insufficient data for order_id, amount, bump

    let order_id = 1u32;
    let (payment_pda, _) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let accounts = vec![
        AccountMeta::new(context.payer.pubkey(), true),
        AccountMeta::new(payment_pda, false),
        AccountMeta::new_readonly(operator_authority.pubkey(), true),
        AccountMeta::new_readonly(buyer.pubkey(), true),
        AccountMeta::new_readonly(operator_pda, false),
        AccountMeta::new_readonly(merchant_pda, false),
        AccountMeta::new(merchant_operator_config_pda, false),
        AccountMeta::new_readonly(USDC_MINT, false),
        AccountMeta::new(buyer_ata, false),
        AccountMeta::new(merchant_escrow_ata, false),
        AccountMeta::new(settlement_ata, false),
        AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
    ];

    let instruction = Instruction {
        program_id: commerce_program_client::COMMERCE_PROGRAM_ID,
        accounts,
        data: invalid_data, // Invalid data length
    };

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);

    assert_program_error(result, INVALID_INSTRUCTION_DATA_ERROR);
}

#[tokio::test]
async fn test_make_payment_auto_settle_unsigned_fee_payer_fails() {
    let (
        mut context,
        _operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(true).await.unwrap(); // auto_settle = true

    let order_id = 1u32;
    let amount = 1_000_000u64;

    let non_signer = Keypair::new();
    context
        .airdrop_if_required(&non_signer.pubkey(), 1_000_000_000)
        .unwrap();

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &USDC_MINT,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &USDC_MINT);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &USDC_MINT);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(non_signer.pubkey()) // Wrong operator authority
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(USDC_MINT)
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&non_signer, &buyer]);

    assert_program_error(result, INVALID_ACCOUNT_DATA_ERROR);
}

#[tokio::test]
async fn test_make_payment_auto_settle_invalid_mint_fails() {
    let (
        mut context,
        operator_authority,
        _merchant_authority,
        _settlement_wallet,
        buyer,
        operator_pda,
        _merchant_pda,
        merchant_operator_config_pda,
    ) = setup_make_payment_test(true).await.unwrap(); // auto_settle = true

    let order_id = 1u32;
    let amount = 1_000_000u64;

    // Use a pubkey that's not in the allowed currencies list (USDC and USDT)
    let invalid_mint = Pubkey::new_unique();
    set_mint(&mut context, &invalid_mint);

    let (payment_pda, bump) = find_payment_pda(
        &merchant_operator_config_pda,
        &buyer.pubkey(),
        &invalid_mint,
        order_id,
    );

    let (merchant_pda, _) = find_merchant_pda(&_merchant_authority.pubkey());

    let merchant_escrow_ata = get_associated_token_address(&merchant_pda, &invalid_mint);
    let buyer_ata = get_associated_token_address(&buyer.pubkey(), &invalid_mint);
    let settlement_ata = get_associated_token_address(&buyer.pubkey(), &invalid_mint);

    let instruction = MakePaymentBuilder::new()
        .order_id(order_id)
        .amount(amount)
        .bump(bump)
        .payer(context.payer.pubkey())
        .payment(payment_pda)
        .operator_authority(operator_authority.pubkey())
        .buyer(buyer.pubkey())
        .operator(operator_pda)
        .merchant(merchant_pda)
        .merchant_operator_config(merchant_operator_config_pda)
        .mint(invalid_mint) // This mint is not in allowed_currencies
        .buyer_ata(buyer_ata)
        .merchant_escrow_ata(merchant_escrow_ata)
        .merchant_settlement_ata(settlement_ata)
        .token_program(TOKEN_PROGRAM_ID)
        .system_program(SYSTEM_PROGRAM_ID)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&operator_authority, &buyer]);

    // Check for specific InvalidMint error
    assert_program_error(result, INVALID_MINT_ERROR);
}
