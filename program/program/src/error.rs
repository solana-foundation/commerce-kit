use pinocchio::program_error::ProgramError;

/// Errors that may be returned by the Commerce Program.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CommerceProgramError {
    // 0 Incorrect mint provided
    InvalidMint,
    // 1 Invalid payment status for the operation
    InvalidPaymentStatus,
    // 2 Insufficient settlement amount
    InsufficientSettlementAmount,
    // 3 Settlement attempted too early
    SettlementTooEarly,
    // 4 Refund amount exceeds policy limit
    RefundAmountExceedsPolicyLimit,
    // 5 Refund window expired
    RefundWindowExpired,
    // 6 Invalid event authority
    InvalidEventAuthority,
    // 7 Invalid ATA
    InvalidAta,
}

impl From<CommerceProgramError> for ProgramError {
    fn from(e: CommerceProgramError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
