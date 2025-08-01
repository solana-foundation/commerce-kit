use crate::{
    state_utils::{
        assert_get_or_create_merchant, assert_get_or_create_merchant_operator_config,
        assert_get_or_create_operator,
    },
    utils::TestContext,
};
use commerce_program_client::types::{FeeType, PolicyData, RefundPolicy};

use solana_sdk::{pubkey::Pubkey, signature::Keypair};

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
        policies,
        accepted_currencies,
        true,
    )
    .unwrap();
}
