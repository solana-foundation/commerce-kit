extern crate alloc;

use alloc::vec::Vec;
use pinocchio::program_error::ProgramError;
use shank::ShankType;

use crate::constants::POLICY_SIZE;

pub const REFUND_POLICY_SIZE: usize = 16;
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
    Settlement = 1,
}

impl PolicyType {
    pub fn from_u8(value: u8) -> Result<Self, ProgramError> {
        match value {
            0 => Ok(PolicyType::Refund),
            1 => Ok(PolicyType::Settlement),
            _ => Err(ProgramError::InvalidAccountData),
        }
    }

    pub fn to_u8(&self) -> u8 {
        *self as u8
    }
    pub fn get_size(&self) -> usize {
        1 + match self {
            PolicyType::Refund => REFUND_POLICY_SIZE,
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
    Settlement(SettlementPolicy),
}

impl PolicyData {
    pub const SIZE: usize = 1 + POLICY_SIZE; // policy_type (u8) + policy data (100 bytes)

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.push(self.policy_type().to_u8());
        match self {
            PolicyData::Refund(policy) => data.extend_from_slice(&policy.to_bytes()),
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
            PolicyType::Settlement => Ok(PolicyData::Settlement(SettlementPolicy::from_bytes(
                policy_data,
            )?)),
        }
    }

    pub fn policy_type(&self) -> PolicyType {
        match self {
            PolicyData::Refund(_) => PolicyType::Refund,
            PolicyData::Settlement(_) => PolicyType::Settlement,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_fee_type_from_u8() {
        assert_eq!(FeeType::from_u8(0).unwrap(), FeeType::Bps);
        assert_eq!(FeeType::from_u8(1).unwrap(), FeeType::Fixed);
        assert!(FeeType::from_u8(2).is_err());
        assert!(FeeType::from_u8(255).is_err());
    }

    #[test]
    fn test_fee_type_to_u8() {
        assert_eq!(FeeType::Bps.to_u8(), 0);
        assert_eq!(FeeType::Fixed.to_u8(), 1);
    }

    #[test]
    fn test_fee_type_roundtrip() {
        let fee_type = FeeType::Bps;
        assert_eq!(FeeType::from_u8(fee_type.to_u8()).unwrap(), fee_type);

        let fee_type = FeeType::Fixed;
        assert_eq!(FeeType::from_u8(fee_type.to_u8()).unwrap(), fee_type);
    }

    #[test]
    fn test_policy_type_from_u8() {
        assert_eq!(PolicyType::from_u8(0).unwrap(), PolicyType::Refund);
        assert_eq!(PolicyType::from_u8(1).unwrap(), PolicyType::Settlement);
        assert!(PolicyType::from_u8(2).is_err());
        assert!(PolicyType::from_u8(255).is_err());
    }

    #[test]
    fn test_policy_type_to_u8() {
        assert_eq!(PolicyType::Refund.to_u8(), 0);
        assert_eq!(PolicyType::Settlement.to_u8(), 1);
    }

    #[test]
    fn test_policy_type_get_size() {
        assert_eq!(PolicyType::Refund.get_size(), 1 + REFUND_POLICY_SIZE);
        assert_eq!(
            PolicyType::Settlement.get_size(),
            1 + SETTLEMENT_POLICY_SIZE
        );
    }

    #[test]
    fn test_policy_type_roundtrip() {
        let policy_type = PolicyType::Refund;
        assert_eq!(
            PolicyType::from_u8(policy_type.to_u8()).unwrap(),
            policy_type
        );

        let policy_type = PolicyType::Settlement;
        assert_eq!(
            PolicyType::from_u8(policy_type.to_u8()).unwrap(),
            policy_type
        );
    }

    #[test]
    fn test_refund_policy_serialization() {
        let policy = RefundPolicy {
            max_amount: 1000,
            max_time_after_purchase: 3600,
        };

        let bytes = policy.to_bytes();
        assert_eq!(bytes.len(), REFUND_POLICY_SIZE);

        let deserialized = RefundPolicy::from_bytes(&bytes).unwrap();
        assert_eq!(deserialized, policy);
    }

    #[test]
    fn test_refund_policy_from_bytes_invalid_length() {
        let short_data = vec![1, 2, 3];
        assert!(RefundPolicy::from_bytes(&short_data).is_err());
    }

    #[test]
    fn test_settlement_policy_serialization() {
        let policy = SettlementPolicy {
            min_settlement_amount: 5000,
            settlement_frequency_hours: 24,
            auto_settle: true,
        };

        let bytes = policy.to_bytes();
        assert_eq!(bytes.len(), SETTLEMENT_POLICY_SIZE);

        let deserialized = SettlementPolicy::from_bytes(&bytes).unwrap();
        assert_eq!(deserialized, policy);
    }

    #[test]
    fn test_settlement_policy_auto_settle_false() {
        let policy = SettlementPolicy {
            min_settlement_amount: 1000,
            settlement_frequency_hours: 12,
            auto_settle: false,
        };

        let bytes = policy.to_bytes();
        let deserialized = SettlementPolicy::from_bytes(&bytes).unwrap();
        assert!(!deserialized.auto_settle);
    }

    #[test]
    fn test_settlement_policy_from_bytes_invalid_length() {
        let short_data = vec![1, 2, 3];
        assert!(SettlementPolicy::from_bytes(&short_data).is_err());
    }

    #[test]
    fn test_policy_data_refund_serialization() {
        let refund_policy = RefundPolicy {
            max_amount: 2000,
            max_time_after_purchase: 7200,
        };
        let policy_data = PolicyData::Refund(refund_policy.clone());

        let bytes = policy_data.to_bytes();
        assert_eq!(bytes.len(), PolicyData::SIZE);
        assert_eq!(bytes[0], PolicyType::Refund.to_u8());

        let deserialized = PolicyData::from_bytes(&bytes).unwrap();
        assert_eq!(deserialized, policy_data);
        assert_eq!(deserialized.policy_type(), PolicyType::Refund);
    }

    #[test]
    fn test_policy_data_settlement_serialization() {
        let settlement_policy = SettlementPolicy {
            min_settlement_amount: 3000,
            settlement_frequency_hours: 48,
            auto_settle: false,
        };
        let policy_data = PolicyData::Settlement(settlement_policy.clone());

        let bytes = policy_data.to_bytes();
        assert_eq!(bytes.len(), PolicyData::SIZE);
        assert_eq!(bytes[0], PolicyType::Settlement.to_u8());

        let deserialized = PolicyData::from_bytes(&bytes).unwrap();
        assert_eq!(deserialized, policy_data);
        assert_eq!(deserialized.policy_type(), PolicyType::Settlement);
    }

    #[test]
    fn test_policy_data_from_bytes_empty() {
        assert!(PolicyData::from_bytes(&[]).is_err());
    }

    #[test]
    fn test_policy_data_from_bytes_invalid_policy_type() {
        let mut data = vec![0; PolicyData::SIZE];
        data[0] = 99; // Invalid policy type
        assert!(PolicyData::from_bytes(&data).is_err());
    }

    #[test]
    fn test_policy_data_from_bytes_insufficient_data() {
        let data = vec![0]; // Only policy type, no policy data
        assert!(PolicyData::from_bytes(&data).is_err());
    }

    #[test]
    fn test_policy_data_padding() {
        let refund_policy = RefundPolicy {
            max_amount: 100,
            max_time_after_purchase: 200,
        };
        let policy_data = PolicyData::Refund(refund_policy);

        let bytes = policy_data.to_bytes();
        assert_eq!(bytes.len(), PolicyData::SIZE);

        // Check that padding bytes are zeros
        let expected_data_len = 1 + REFUND_POLICY_SIZE;
        (expected_data_len..PolicyData::SIZE).for_each(|i| {
            assert_eq!(bytes[i], 0, "Padding byte at index {} should be 0", i);
        });
    }
}
