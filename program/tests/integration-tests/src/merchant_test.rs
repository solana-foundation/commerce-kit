use crate::{
    state_utils::{
        assert_get_or_create_merchant, assert_update_merchant_authority,
        assert_update_merchant_settlement_wallet,
    },
    utils::TestContext,
};
use solana_sdk::signature::{Keypair, Signer};

#[tokio::test]
async fn test_create_merchant_success() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();

    context
        .airdrop_if_required(&authority.pubkey(), 1_000_000_000)
        .unwrap();

    assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, true, true)
        .unwrap();
}

#[tokio::test]
pub async fn test_update_merchant_settlement_wallet_success() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();

    context
        .airdrop_if_required(&authority.pubkey(), 1_000_000_000)
        .unwrap();

    assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, true, false)
        .unwrap();

    assert_update_merchant_settlement_wallet(&mut context, &authority, true).unwrap();
}

#[tokio::test]
pub async fn test_update_merchant_authority_success() {
    let mut context = TestContext::new();
    let authority = Keypair::new();
    let settlement_wallet = Keypair::new();

    assert_get_or_create_merchant(&mut context, &authority, &settlement_wallet, true, false)
        .unwrap();

    assert_update_merchant_authority(&mut context, &authority, &settlement_wallet.pubkey(), true)
        .unwrap();
}
