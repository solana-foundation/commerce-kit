use crate::{
    state_utils::{
        assert_get_or_create_merchant, assert_get_or_create_merchant_operator_config,
        assert_get_or_create_operator,
    },
    utils::{
        assert_program_error, set_mint, TestContext, DAYS_TO_CLOSE, INVALID_ACCOUNT_OWNER_ERROR,
        INVALID_MINT_ERROR, NOT_ENOUGH_ACCOUNT_KEYS_ERROR, USDC_MINT, USDT_MINT,
    },
};
use commerce_program_client::{
    instructions::InitializeMerchantOperatorConfigBuilder,
    types::{FeeType, PolicyData, RefundPolicy},
};
use solana_sdk::{
    instruction::AccountMeta, pubkey::Pubkey, signature::Keypair, signer::Signer,
    system_program::ID as SYSTEM_PROGRAM_ID,
};
use spl_token::ID as TOKEN_PROGRAM_ID;

#[tokio::test]
async fn test_initialize_merchant_operator_config_success() {
    let mut context = TestContext::new();

    // Setup Merchant
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();

    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, false).unwrap();

    // Setup Operator
    let owner = Keypair::new();

    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &owner, false).unwrap();

    // Setup MerchantOperatorConfig
    let version = 1;
    let operator_fee = 100;
    let fee_type = FeeType::Bps;
    let policies = vec![PolicyData::Refund(RefundPolicy {
        max_amount: 1000,
        max_time_after_purchase: 3600,
    })];
    let accepted_currencies: Vec<Pubkey> = vec![];

    assert_get_or_create_merchant_operator_config(
        &mut context,
        &authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        fee_type,
        0,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )
    .unwrap();
}

#[tokio::test]
async fn test_initialize_merchant_operator_config_invalid_mint_fails() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let owner = Keypair::new();

    // Setup Merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, false).unwrap();

    // Setup Operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &owner, false).unwrap();

    // Create a fake mint account that's not actually a mint
    let fake_mint = Keypair::new();
    context.create_account(
        &fake_mint.pubkey(),
        &SYSTEM_PROGRAM_ID, // Wrong owner - should be Token Program
        vec![0; 82],        // Wrong size for mint account
        1_000_000_000,
    );

    // Try to create MerchantOperatorConfig with invalid mint by calling instruction directly
    let version = 1;
    let operator_fee = 100;
    let fee_type = FeeType::Bps;
    let policies = vec![PolicyData::Refund(RefundPolicy {
        max_amount: 1000,
        max_time_after_purchase: 3600,
    })];
    let accepted_currencies = vec![fake_mint.pubkey()]; // Invalid mint

    let (config_pda, bump) =
        crate::utils::find_merchant_operator_config_pda(&merchant_pda, &operator_pda, version);

    // Manually build instruction to pass invalid mint as remaining account
    let instruction = InitializeMerchantOperatorConfigBuilder::new()
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .config(config_pda)
        .version(version)
        .bump(bump)
        .operator_fee(operator_fee)
        .fee_type(fee_type)
        .days_to_close(DAYS_TO_CLOSE)
        .policies(policies)
        .accepted_currencies(accepted_currencies)
        .system_program(SYSTEM_PROGRAM_ID)
        .add_remaining_account(AccountMeta::new_readonly(fake_mint.pubkey(), false))
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&authority]);

    // Should fail due to invalid mint validation (wrong owner)
    assert_program_error(result, INVALID_ACCOUNT_OWNER_ERROR);
}

#[tokio::test]
async fn test_initialize_merchant_operator_config_invalid_mint_data_fails() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let owner = Keypair::new();

    // Setup Merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, false).unwrap();

    // Setup Operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &owner, false).unwrap();

    // Create an account owned by token program but with invalid mint data
    let fake_mint = Keypair::new();
    context.create_account(
        &fake_mint.pubkey(),
        &TOKEN_PROGRAM_ID, // Correct owner
        vec![0; 10], // Wrong size/data for mint account (should be 82 bytes with proper structure)
        1_000_000_000,
    );

    let version = 1;
    let operator_fee = 100;
    let fee_type = FeeType::Bps;
    let policies = vec![PolicyData::Refund(RefundPolicy {
        max_amount: 1000,
        max_time_after_purchase: 3600,
    })];
    let accepted_currencies = vec![fake_mint.pubkey()]; // Invalid mint data

    let (config_pda, bump) =
        crate::utils::find_merchant_operator_config_pda(&merchant_pda, &operator_pda, version);

    // Manually build instruction to pass invalid mint data as remaining account
    let instruction = InitializeMerchantOperatorConfigBuilder::new()
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .config(config_pda)
        .version(version)
        .bump(bump)
        .operator_fee(operator_fee)
        .fee_type(fee_type)
        .days_to_close(DAYS_TO_CLOSE)
        .policies(policies)
        .accepted_currencies(accepted_currencies)
        .system_program(SYSTEM_PROGRAM_ID)
        .add_remaining_account(AccountMeta::new_readonly(fake_mint.pubkey(), false))
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&authority]);

    // Should fail due to invalid mint data structure
    assert!(
        result.is_err(),
        "Expected initialization to fail with invalid mint data"
    );
}

#[tokio::test]
async fn test_initialize_merchant_operator_config_wrong_mint_address_fails() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let owner = Keypair::new();

    // Setup Merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, false).unwrap();

    // Setup Operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &owner, false).unwrap();

    // Create a different valid mint
    let valid_mint = Keypair::new();
    set_mint(&mut context, &valid_mint.pubkey());

    // Try to create MerchantOperatorConfig with mismatched mint addresses
    let version = 1;
    let operator_fee = 100;
    let fee_type = FeeType::Bps;
    let policies = vec![PolicyData::Refund(RefundPolicy {
        max_amount: 1000,
        max_time_after_purchase: 3600,
    })];

    // Specify USDC_MINT in accepted_currencies but pass different mint as remaining account
    let accepted_currencies = vec![USDC_MINT]; // Different from the actual mint we'll pass

    let (config_pda, bump) =
        crate::utils::find_merchant_operator_config_pda(&merchant_pda, &operator_pda, version);

    // Manually build instruction to pass wrong mint as remaining account
    let instruction = InitializeMerchantOperatorConfigBuilder::new()
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .config(config_pda)
        .version(version)
        .bump(bump)
        .operator_fee(operator_fee)
        .fee_type(fee_type)
        .days_to_close(DAYS_TO_CLOSE)
        .policies(policies)
        .accepted_currencies(accepted_currencies)
        .system_program(SYSTEM_PROGRAM_ID)
        .add_remaining_account(AccountMeta::new_readonly(valid_mint.pubkey(), false)) // Wrong mint (should be USDC_MINT)
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&authority]);

    // Should fail because accepted_currencies contains USDC_MINT but we pass valid_mint as remaining account
    assert_program_error(result, INVALID_MINT_ERROR);
}

#[tokio::test]
async fn test_initialize_merchant_operator_config_missing_mint_accounts_fails() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let owner = Keypair::new();

    // Setup Merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, false).unwrap();

    // Setup Operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &owner, false).unwrap();

    // Try to create MerchantOperatorConfig with accepted_currencies but no remaining accounts
    let version = 1;
    let operator_fee = 100;
    let fee_type = FeeType::Bps;
    let policies = vec![PolicyData::Refund(RefundPolicy {
        max_amount: 1000,
        max_time_after_purchase: 3600,
    })];
    let accepted_currencies = vec![USDC_MINT, USDT_MINT]; // 2 currencies but no mint accounts provided

    let (config_pda, bump) =
        crate::utils::find_merchant_operator_config_pda(&merchant_pda, &operator_pda, version);

    // Build instruction with accepted_currencies but no remaining accounts (missing mint accounts)
    let instruction = InitializeMerchantOperatorConfigBuilder::new()
        .payer(context.payer.pubkey())
        .authority(authority.pubkey())
        .merchant(merchant_pda)
        .operator(operator_pda)
        .config(config_pda)
        .version(version)
        .bump(bump)
        .operator_fee(operator_fee)
        .fee_type(fee_type)
        .days_to_close(DAYS_TO_CLOSE)
        .policies(policies)
        .accepted_currencies(accepted_currencies) // 2 currencies but no remaining accounts
        .system_program(SYSTEM_PROGRAM_ID)
        // Not adding any remaining accounts - this should fail
        .instruction();

    let result = context.send_transaction_with_signers(instruction, &[&authority]);
    assert_program_error(result, NOT_ENOUGH_ACCOUNT_KEYS_ERROR);
}

#[tokio::test]
async fn test_initialize_merchant_operator_config_valid_mints_success() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();
    let owner = Keypair::new();

    // Setup Merchant
    let (merchant_pda, _) =
        assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, false).unwrap();

    // Setup Operator
    let (operator_pda, _) = assert_get_or_create_operator(&mut context, &owner, false).unwrap();

    // USDC and USDT are already set up in TestContext, so they're valid mints
    let version = 1;
    let operator_fee = 100;
    let fee_type = FeeType::Bps;
    let policies = vec![PolicyData::Refund(RefundPolicy {
        max_amount: 1000,
        max_time_after_purchase: 3600,
    })];
    let accepted_currencies = vec![USDC_MINT, USDT_MINT]; // Valid mints

    // Should succeed with valid mints
    assert_get_or_create_merchant_operator_config(
        &mut context,
        &authority,
        &merchant_pda,
        &operator_pda,
        version,
        operator_fee,
        fee_type,
        0,
        DAYS_TO_CLOSE,
        policies,
        accepted_currencies,
        true,
    )
    .expect("Should successfully create merchant operator config with valid mints");
}
