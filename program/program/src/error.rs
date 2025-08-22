use pinocchio::program_error::ProgramError;
use thiserror::Error;

/// Errors that may be returned by the Commerce Program.
#[derive(Clone, Debug, Eq, PartialEq, Error)]
pub enum CommerceProgramError {
    /// (0) Incorrect mint provided
    #[error("Incorrect mint provided")]
    InvalidMint,
    /// (1) Invalid payment status for the operation
    #[error("Invalid payment status for the operation")]
    InvalidPaymentStatus,
    /// (2) Insufficient settlement amount
    #[error("Insufficient settlement amount")]
    InsufficientSettlementAmount,
    /// (3) Settlement attempted too early
    #[error("Settlement attempted too early")]
    SettlementTooEarly,
    /// (4) Refund amount exceeds policy limit
    #[error("Refund amount exceeds policy limit")]
    RefundAmountExceedsPolicyLimit,
    /// (5) Refund window expired
    #[error("Refund window expired")]
    RefundWindowExpired,
    /// (6) Invalid event authority
    #[error("Invalid event authority")]
    InvalidEventAuthority,
    /// (7) Invalid ATA
    #[error("Invalid ATA")]
    InvalidAta,
    /// (8) Payment close window not reached
    #[error("Payment close window not reached")]
    PaymentCloseWindowNotReached,
    /// (9) Merchant owner does not match expected owner
    #[error("Merchant owner does not match expected owner")]
    MerchantOwnerMismatch,
    /// (10) Merchant PDA is invalid
    #[error("Merchant PDA is invalid")]
    MerchantInvalidPda,
    /// (11) Operator owner does not match expected owner
    #[error("Operator owner does not match expected owner")]
    OperatorOwnerMismatch,
    /// (12) Operator PDA is invalid
    #[error("Operator PDA is invalid")]
    OperatorInvalidPda,
    /// (13) Operator does not match config operator
    #[error("Operator does not match config operator")]
    OperatorMismatch,
    /// (14) Merchant does not match config merchant
    #[error("Merchant does not match config merchant")]
    MerchantMismatch,
    /// (15) Order ID is invalid or already used
    #[error("Order ID is invalid or already used")]
    OrderIdInvalid,
    /// (16) MerchantOperatorConfig PDA is invalid
    #[error("MerchantOperatorConfig PDA is invalid")]
    MerchantOperatorConfigInvalidPda,
    /// (17) Accepted currencies is empty
    #[error("Accepted currencies is empty")]
    AcceptedCurrenciesEmpty,
    /// (18) Duplicate mint in accepted currencies
    #[error("Duplicate mint in accepted currencies")]
    DuplicateMint,
}

impl From<CommerceProgramError> for ProgramError {
    fn from(e: CommerceProgramError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
