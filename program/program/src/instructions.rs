extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use pinocchio::pubkey::Pubkey;
use shank::ShankInstruction;

use crate::state::{FeeType, PolicyData};

/// Instructions for the Solana Commerce Program. This
/// is currently not used in the program business logic, but
/// we include it for IDL generation.
#[repr(C, u8)]
#[derive(Clone, Debug, PartialEq, ShankInstruction)]
pub enum CommerceProgramInstruction {
    // Initialize Merchant PDA
    #[account(0, writable, signer, name = "payer")]
    #[account(1, signer, name = "authority")]
    #[account(2, writable, name = "merchant")]
    #[account(3, name = "settlement_wallet")]
    #[account(4, name = "system_program")]
    // Initialize Merchant Core ATAs (USDC, USDT)
    #[account(5, writable, name = "settlement_usdc_ata")]
    #[account(6, writable, name = "escrow_usdc_ata")]
    #[account(7, name = "usdc_mint")]
    #[account(8, writable, name = "settlement_usdt_ata")]
    #[account(9, writable, name = "escrow_usdt_ata")]
    #[account(10, name = "usdt_mint")]
    #[account(11, name = "token_program")]
    #[account(12, name = "associated_token_program")]
    InitializeMerchant { bump: u8 } = 0,

    /// Creates the Operator PDA account for an Operator.
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, name = "operator")]
    #[account(2, signer, name = "authority")]
    #[account(3, name = "system_program")]
    CreateOperator { bump: u8 } = 1,

    // Initialize MerchantOperatorConfig PDA
    #[account(0, writable, signer, name = "payer")]
    #[account(1, signer, name = "authority", desc = "Authority of the merchant")]
    #[account(2, name = "merchant", desc = "Merchant PDA")]
    #[account(3, name = "operator", desc = "Operator PDA")]
    #[account(
        4,
        writable,
        name = "config",
        desc = "The MerchantOperatorConfig PDA being initialized"
    )]
    #[account(5, name = "system_program")]
    InitializeMerchantOperatorConfig {
        version: u32,
        bump: u8,
        operator_fee: u64,
        fee_type: FeeType,
        days_to_close: u16,
        policies: Vec<PolicyData>,
        accepted_currencies: Vec<Pubkey>,
    } = 2,

    // Make Payment
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, name = "payment")]
    #[account(2, signer, name = "operator_authority")]
    #[account(3, signer, name = "buyer")]
    #[account(4, name = "operator")]
    #[account(5, name = "merchant", desc = "Merchant PDA")]
    #[account(6, writable, name = "merchant_operator_config")]
    #[account(7, name = "mint")]
    #[account(8, writable, name = "buyer_ata")]
    #[account(9, writable, name = "merchant_escrow_ata")]
    #[account(10, writable, name = "merchant_settlement_ata")]
    #[account(11, name = "token_program")]
    #[account(12, name = "system_program")]
    #[account(13, name = "event_authority", desc = "Event authority PDA")]
    #[account(14, name = "commerce_program", desc = "Commerce Program ID")]
    MakePayment {
        order_id: u32,
        amount: u64,
        bump: u8,
    } = 3,

    // Clear Payment
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, name = "payment", desc = "New Payment PDA being created")]
    #[account(2, signer, name = "operator_authority")]
    #[account(3, name = "buyer")]
    #[account(4, name = "merchant", desc = "Merchant PDA")]
    #[account(5, name = "operator", desc = "Operator PDA")]
    #[account(6, name = "merchant_operator_config")]
    #[account(7, name = "mint")]
    #[account(
        8,
        writable,
        name = "merchant_escrow_ata",
        desc = "Merchant Escrow ATA (Merchant PDA is owner)"
    )]
    #[account(
        9,
        writable,
        name = "merchant_settlement_ata",
        desc = "Merchant Settlement ATA (Merchant settlement wallet is owner)"
    )]
    #[account(
        10,
        writable,
        name = "operator_settlement_ata",
        desc = "Operator Settlement ATA (Operator owner is owner)"
    )]
    #[account(11, name = "token_program")]
    #[account(12, name = "associated_token_program")]
    #[account(13, name = "system_program")]
    #[account(14, name = "event_authority", desc = "Event authority PDA")]
    #[account(15, name = "commerce_program", desc = "Commerce Program ID")]
    ClearPayment = 4,

    // Refund Payment
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, name = "payment", desc = "Payment PDA being updated")]
    #[account(2, signer, name = "operator_authority")]
    #[account(3, name = "buyer", desc = "Refund destination owner")]
    #[account(4, name = "merchant", desc = "Merchant PDA")]
    #[account(5, name = "operator", desc = "Operator PDA")]
    #[account(
        6,
        name = "merchant_operator_config",
        desc = "Merchant Operator Config PDA"
    )]
    #[account(7, name = "mint")]
    #[account(
        8,
        writable,
        name = "merchant_escrow_ata",
        desc = "Merchant Escrow ATA (Merchant PDA is owner)"
    )]
    #[account(9, writable, name = "buyer_ata")]
    #[account(10, name = "token_program")]
    #[account(11, name = "system_program")]
    #[account(12, name = "event_authority", desc = "Event authority PDA")]
    #[account(13, name = "commerce_program", desc = "Commerce Program ID")]
    RefundPayment = 5,

    // Chargeback Payment
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, name = "payment", desc = "Payment PDA being updated")]
    #[account(2, signer, name = "operator_authority")]
    #[account(3, name = "buyer", desc = "Chargeback destination owner")]
    #[account(4, name = "merchant", desc = "Merchant PDA")]
    #[account(5, name = "operator", desc = "Operator PDA")]
    #[account(
        6,
        name = "merchant_operator_config",
        desc = "Merchant Operator Config PDA"
    )]
    #[account(7, name = "mint")]
    #[account(
        8,
        writable,
        name = "merchant_escrow_ata",
        desc = "Merchant Escrow ATA (Merchant PDA is owner)"
    )]
    #[account(9, writable, name = "buyer_ata")]
    #[account(10, name = "token_program")]
    #[account(11, name = "system_program")]
    #[account(12, name = "event_authority", desc = "Event authority PDA")]
    #[account(13, name = "commerce_program", desc = "Commerce Program ID")]
    ChargebackPayment = 6,

    // Update Merchant Settlement Wallet
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, signer, name = "authority")]
    #[account(2, writable, name = "merchant", desc = "Merchant PDA")]
    #[account(3, name = "new_settlement_wallet")]
    #[account(4, writable, name = "settlement_usdc_ata")]
    #[account(5, name = "usdc_mint")]
    #[account(6, writable, name = "settlement_usdt_ata")]
    #[account(7, name = "usdt_mint")]
    #[account(8, name = "token_program")]
    #[account(9, name = "associated_token_program")]
    #[account(10, name = "system_program")]
    UpdateMerchantSettlementWallet = 7,

    // Update Merchant Authority
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, signer, name = "authority")]
    #[account(2, writable, name = "merchant", desc = "Merchant PDA")]
    #[account(3, name = "new_authority")]
    UpdateMerchantAuthority = 8,

    // Update Operator Authority
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, signer, name = "authority")]
    #[account(2, writable, name = "operator", desc = "Operator PDA")]
    #[account(3, name = "new_operator_authority")]
    UpdateOperatorAuthority = 9,

    // Close Payment
    #[account(0, writable, signer, name = "payer")]
    #[account(1, writable, name = "payment", desc = "Payment PDA to close")]
    #[account(2, signer, name = "operator_authority")]
    #[account(3, name = "operator", desc = "Operator PDA")]
    #[account(4, name = "merchant", desc = "Merchant PDA")]
    #[account(5, name = "buyer", desc = "Buyer account")]
    #[account(
        6,
        name = "merchant_operator_config",
        desc = "Merchant Operator Config PDA"
    )]
    #[account(7, name = "mint", desc = "Token mint")]
    #[account(8, name = "system_program")]
    ClosePayment = 10,

    /// Invoked via CPI from another program to log event via instruction data.
    #[account(0, signer, name = "event_authority")]
    EmitEvent {} = 228,
}
