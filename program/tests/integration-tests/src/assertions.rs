use commerce_program_client::{
    types::Status, Merchant, MerchantOperatorConfig, Operator, Payment, COMMERCE_PROGRAM_ID,
};
use solana_program_pack::Pack;
use solana_sdk::pubkey::Pubkey;
use spl_token::state::Account as TokenAccount;

use crate::utils::{get_token_balance, TestContext};

pub fn assert_operator_account(
    context: &mut TestContext,
    operator_pda: &Pubkey,
    expected_owner: &Pubkey,
    expected_bump: u8,
) {
    let account = context
        .get_account(operator_pda)
        .expect("Operator account should exist");

    assert_eq!(account.owner, COMMERCE_PROGRAM_ID);

    let operator =
        Operator::from_bytes(&account.data).expect("Should deserialize operator account");

    assert_eq!(operator.owner, *expected_owner);
    assert_eq!(operator.bump, expected_bump);
}

pub fn assert_merchant_account(
    context: &mut TestContext,
    merchant_pda: &Pubkey,
    expected_owner: &Pubkey,
    expected_bump: u8,
    expected_settlement_wallet: &Pubkey,
) {
    let merchant_account = context.svm.get_account(merchant_pda).unwrap();
    let merchant_account = Merchant::from_bytes(&merchant_account.data).unwrap();
    assert_eq!(merchant_account.owner, *expected_owner);
    assert_eq!(merchant_account.bump, expected_bump);
    assert_eq!(
        merchant_account.settlement_wallet,
        *expected_settlement_wallet
    );
}

pub fn assert_account_not_exists(context: &mut TestContext, pubkey: &Pubkey) {
    let account = context.get_account(pubkey);
    assert!(account.is_none(), "Account should not exist");
}

pub fn assert_account_exists(context: &mut TestContext, pubkey: &Pubkey) {
    let account = context.get_account(pubkey);
    assert!(account.is_some(), "Account should exist");
}

pub fn assert_account_lamports(context: &mut TestContext, pubkey: &Pubkey, expected_lamports: u64) {
    let account = context.get_account(pubkey).expect("Account should exist");
    assert_eq!(account.lamports, expected_lamports);
}

pub fn assert_account_owner(context: &mut TestContext, pubkey: &Pubkey, expected_owner: &Pubkey) {
    let account = context.get_account(pubkey).expect("Account should exist");
    assert_eq!(account.owner, *expected_owner);
}

pub fn assert_token_account(
    context: &mut TestContext,
    token_account: &Pubkey,
    expected_mint: &Pubkey,
    expected_owner: &Pubkey,
) {
    let account = context
        .get_account(token_account)
        .expect("Account should exist");
    let token_account = TokenAccount::unpack(&account.data).unwrap();
    assert_eq!(token_account.mint, *expected_mint);
    assert_eq!(token_account.owner, *expected_owner);
}

#[allow(clippy::too_many_arguments)]
pub fn assert_merchant_operator_config_account(
    context: &mut TestContext,
    merchant_operator_config_pda: &Pubkey,
    expected_bump: u8,
    expected_version: u32,
    expected_merchant: &Pubkey,
    expected_operator: &Pubkey,
    expected_operator_fee: u64,
    expected_current_order_id: u32,
    _expected_num_policies: u32,
    _expected_num_accepted_currencies: u32,
) {
    let account = context
        .get_account(merchant_operator_config_pda)
        .expect("Merchant operator config account should exist");
    let merchant_operator_config: MerchantOperatorConfig =
        MerchantOperatorConfig::from_bytes(&account.data)
            .expect("Should deserialize merchant operator config account");
    assert_eq!(merchant_operator_config.bump, expected_bump);
    assert_eq!(merchant_operator_config.version, expected_version);
    assert_eq!(merchant_operator_config.merchant, *expected_merchant);
    assert_eq!(merchant_operator_config.operator, *expected_operator);
    assert_eq!(merchant_operator_config.operator_fee, expected_operator_fee);
    assert_eq!(
        merchant_operator_config.current_order_id,
        expected_current_order_id
    );
    // todo validate policies and accepted currencies
}

pub fn assert_payment_account(
    context: &mut TestContext,
    payment_pda: &Pubkey,
    expected_order_id: u32,
    expected_amount: u64,
    expected_status: Status,
) {
    let account = context
        .get_account(payment_pda)
        .expect("Payment account should exist");

    assert_eq!(account.owner, COMMERCE_PROGRAM_ID);

    let payment = Payment::from_bytes(&account.data).expect("Should deserialize payment account");

    assert_eq!(payment.order_id, expected_order_id);
    assert_eq!(payment.amount, expected_amount);
    assert_eq!(payment.status, expected_status);
    assert!(payment.created_at > 0, "Created timestamp should be set");
}

pub fn assert_token_balance_changes(
    context: &mut TestContext,
    pre_balances: [u64; 2],
    sender_ata: &Pubkey,
    receiver_ata: &Pubkey,
    expected_amount: u64,
) {
    let sender_post_balance = get_token_balance(context, sender_ata);
    let receiver_post_balance = get_token_balance(context, receiver_ata);

    let sender_pre_balance = pre_balances[0];
    let receiver_pre_balance = pre_balances[1];

    // Assert sender balance decreased by expected amount
    assert_eq!(
        sender_pre_balance - expected_amount,
        sender_post_balance,
        "Sender balance should decrease by {} (pre: {}, post: {})",
        expected_amount,
        sender_pre_balance,
        sender_post_balance
    );

    // Assert receiver balance increased by expected amount
    assert_eq!(
        receiver_pre_balance + expected_amount,
        receiver_post_balance,
        "Receiver balance should increase by {} (pre: {}, post: {})",
        expected_amount,
        receiver_pre_balance,
        receiver_post_balance
    );
}

pub struct BalanceChange {
    pub ata: Pubkey,
    pub expected_change: i64, // Positive for increase, negative for decrease
    pub description: String,
}

pub fn assert_multiple_token_balance_changes(
    context: &mut TestContext,
    pre_balances: &[(Pubkey, u64)], // Vec of (ata, pre_balance)
    balance_changes: &[BalanceChange],
) {
    // Get all post balances
    let post_balances: Vec<(Pubkey, u64)> = balance_changes
        .iter()
        .map(|change| (change.ata, get_token_balance(context, &change.ata)))
        .collect();

    // Assert each balance change
    for (i, change) in balance_changes.iter().enumerate() {
        let pre_balance = pre_balances
            .iter()
            .find(|(ata, _)| *ata == change.ata)
            .map(|(_, balance)| *balance)
            .expect("Pre-balance should exist for ATA");

        let post_balance = post_balances[i].1;
        let expected_post_balance = if change.expected_change >= 0 {
            pre_balance + (change.expected_change as u64)
        } else {
            pre_balance - ((-change.expected_change) as u64)
        };

        assert_eq!(
            expected_post_balance,
            post_balance,
            "{} (expected change: {}, pre: {}, post: {})",
            change.description,
            change.expected_change,
            pre_balance,
            post_balance
        );
    }
}
