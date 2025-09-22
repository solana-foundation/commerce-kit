use crate::{state_utils::assert_get_or_create_operator, utils::TestContext};

use solana_sdk::signature::Keypair;

#[tokio::test]
async fn test_create_operator_success() {
    let mut context = TestContext::new();
    let owner = Keypair::new();

    assert_get_or_create_operator(&mut context, &owner, true, true).unwrap();
}

#[tokio::test]
async fn test_update_operator_authority_success() {
    let mut context = TestContext::new();
    let owner = Keypair::new();

    assert_get_or_create_operator(&mut context, &owner, true, true).unwrap();
}
