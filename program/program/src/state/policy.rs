extern crate alloc;

use alloc::vec::Vec;
use pinocchio::program_error::ProgramError;
use shank::ShankType;

use crate::constants::POLICY_SIZE;

pub const REFUND_POLICY_SIZE: usize = 16;
pub const CHARGEBACK_POLICY_SIZE: usize = 16;
pub const SETTLEMENT_POLICY_SIZE: usize = 13;

#[derive(Clone, Debug, PartialEq, ShankType)]
#[repr(u8)]
pub enum FeeType {
    Bps = 0,
    Fixed = 1,
}

impl FeeType {
    pub fn from_u8(value: u8) -> Result<Self, ProgramError> {
        match value {
            0 => Ok(FeeType::Bps),
            1 => Ok(FeeType::Fixed),
            _ => Err(ProgramError::InvalidAccountData),
        }
    }

    pub fn to_u8(&self) -> u8 {
        self.clone() as u8
    }
}

#[derive(Clone, Copy, Debug, PartialEq, ShankType)]
#[repr(u8)]
pub enum PolicyType {
    Refund = 0,
    Chargeback = 1,
    Settlement = 2,
}

impl PolicyType {
    pub fn from_u8(value: u8) -> Result<Self, ProgramError> {
        match value {
            0 => Ok(PolicyType::Refund),
            1 => Ok(PolicyType::Chargeback),
            2 => Ok(PolicyType::Settlement),
            _ => Err(ProgramError::InvalidAccountData),
        }
    }

    pub fn to_u8(&self) -> u8 {
        *self as u8
    }
    pub fn get_size(&self) -> usize {
        1 + match self {
            PolicyType::Refund => REFUND_POLICY_SIZE,
            PolicyType::Chargeback => CHARGEBACK_POLICY_SIZE,
            PolicyType::Settlement => SETTLEMENT_POLICY_SIZE,
        }
    }
}

pub trait Policy {
    fn to_bytes(&self) -> Vec<u8>;
    fn from_bytes(data: &[u8]) -> Result<Self, ProgramError>
    where
        Self: Sized;
    fn policy_type(&self) -> PolicyType;
}

#[derive(Clone, Debug, PartialEq, ShankType)]
#[repr(C)]
pub struct RefundPolicy {
    pub max_amount: u64, // 8 bytes
    /// In seconds
    pub max_time_after_purchase: u64, // 8 bytes
}

impl RefundPolicy {
    fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(&self.max_amount.to_le_bytes());
        data.extend_from_slice(&self.max_time_after_purchase.to_le_bytes());
        data
    }

    fn from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() < REFUND_POLICY_SIZE {
            return Err(ProgramError::InvalidAccountData);
        }

        let max_amount = u64::from_le_bytes(data[0..8].try_into().unwrap());
        let max_time_after_purchase =
            u64::from_le_bytes(data[8..REFUND_POLICY_SIZE].try_into().unwrap());

        Ok(Self {
            max_amount,
            max_time_after_purchase,
        })
    }
}

#[derive(Clone, Debug, PartialEq, ShankType)]
#[repr(C)]
pub struct ChargebackPolicy {
    pub max_amount: u64,              // 8 bytes
    pub max_time_after_purchase: u64, // 8 bytes
}

impl ChargebackPolicy {
    fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(&self.max_amount.to_le_bytes());
        data.extend_from_slice(&self.max_time_after_purchase.to_le_bytes());
        data
    }

    fn from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() < CHARGEBACK_POLICY_SIZE {
            return Err(ProgramError::InvalidAccountData);
        }

        let max_amount = u64::from_le_bytes(data[0..8].try_into().unwrap());
        let max_time_after_purchase =
            u64::from_le_bytes(data[8..CHARGEBACK_POLICY_SIZE].try_into().unwrap());
        // Skip padding bytes

        Ok(Self {
            max_amount,
            max_time_after_purchase,
        })
    }
}

#[derive(Clone, Debug, PartialEq, ShankType)]
#[repr(C)]
pub struct SettlementPolicy {
    pub min_settlement_amount: u64,      // 8 bytes
    pub settlement_frequency_hours: u32, // 4 bytes
    pub auto_settle: bool,               // 1 byte
}

impl SettlementPolicy {
    fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(&self.min_settlement_amount.to_le_bytes());
        data.extend_from_slice(&self.settlement_frequency_hours.to_le_bytes());
        data.push(if self.auto_settle { 1 } else { 0 });
        data
    }

    fn from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() < SETTLEMENT_POLICY_SIZE {
            return Err(ProgramError::InvalidAccountData);
        }

        let min_settlement_amount = u64::from_le_bytes(data[0..8].try_into().unwrap());
        let settlement_frequency_hours = u32::from_le_bytes(data[8..12].try_into().unwrap());
        let auto_settle = data[12] == 1;

        Ok(Self {
            min_settlement_amount,
            settlement_frequency_hours,
            auto_settle,
        })
    }
}

// Enum wrapper for concrete policy types
#[derive(Clone, Debug, PartialEq, ShankType)]
#[repr(C)]
pub enum PolicyData {
    Refund(RefundPolicy),
    Chargeback(ChargebackPolicy),
    Settlement(SettlementPolicy),
}

impl PolicyData {
    pub const SIZE: usize = 1 + POLICY_SIZE; // policy_type (u8) + policy data (100 bytes)

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.push(self.policy_type().to_u8());
        match self {
            PolicyData::Refund(policy) => data.extend_from_slice(&policy.to_bytes()),
            PolicyData::Chargeback(policy) => data.extend_from_slice(&policy.to_bytes()),
            PolicyData::Settlement(policy) => data.extend_from_slice(&policy.to_bytes()),
        }
        data.resize(Self::SIZE, 0);
        data
    }

    pub fn from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.is_empty() {
            return Err(ProgramError::InvalidAccountData);
        }

        let policy_type = PolicyType::from_u8(data[0])?;
        let policy_data = &data[1..];

        match policy_type {
            PolicyType::Refund => Ok(PolicyData::Refund(RefundPolicy::from_bytes(policy_data)?)),
            PolicyType::Chargeback => Ok(PolicyData::Chargeback(ChargebackPolicy::from_bytes(
                policy_data,
            )?)),
            PolicyType::Settlement => Ok(PolicyData::Settlement(SettlementPolicy::from_bytes(
                policy_data,
            )?)),
        }
    }

    pub fn policy_type(&self) -> PolicyType {
        match self {
            PolicyData::Refund(_) => PolicyType::Refund,
            PolicyData::Chargeback(_) => PolicyType::Chargeback,
            PolicyData::Settlement(_) => PolicyType::Settlement,
        }
    }
}
