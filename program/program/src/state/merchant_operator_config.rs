extern crate alloc;

use alloc::vec::Vec;
use pinocchio::pubkey::find_program_address;
use pinocchio::{program_error::ProgramError, pubkey::Pubkey};
use shank::ShankAccount;

use crate::constants::MERCHANT_OPERATOR_CONFIG_SEED;
use crate::error::CommerceProgramError;
use crate::state::PolicyType;

use super::discriminator::{AccountSerialize, CommerceAccountDiscriminators, Discriminator};
use super::policy::{FeeType, PolicyData};
use crate::ID as COMMERCE_PROGRAM_ID;

// Seeds: [b"merchant_operator_config", merchant pubkey, operator pubkey, version]
#[derive(Clone, Debug, PartialEq, ShankAccount)]
#[repr(C)]
pub struct MerchantOperatorConfig {
    pub version: u32,
    pub bump: u8,

    pub merchant: Pubkey,

    pub operator: Pubkey,

    pub operator_fee: u64,
    pub fee_type: FeeType,

    pub current_order_id: u32,

    /// Number of days after a payment is paid that it can be closed
    pub days_to_close: u16,

    // Dynamic fields that follow the struct
    pub num_policies: u32,
    pub num_accepted_currencies: u32,
}

impl Discriminator for MerchantOperatorConfig {
    const DISCRIMINATOR: u8 =
        CommerceAccountDiscriminators::MerchantOperatorConfigDiscriminator as u8;
}

impl AccountSerialize for MerchantOperatorConfig {
    fn to_bytes_inner(&self) -> Vec<u8> {
        let mut data = Vec::new();

        data.extend_from_slice(&self.version.to_le_bytes());
        data.push(self.bump);
        data.extend_from_slice(self.merchant.as_ref());
        data.extend_from_slice(self.operator.as_ref());
        data.extend_from_slice(&self.operator_fee.to_le_bytes());
        data.push(self.fee_type.to_u8());
        data.extend_from_slice(&self.current_order_id.to_le_bytes());
        data.extend_from_slice(&self.days_to_close.to_le_bytes());
        data.extend_from_slice(&self.num_policies.to_le_bytes());
        data.extend_from_slice(&self.num_accepted_currencies.to_le_bytes());

        data
    }
}

impl MerchantOperatorConfig {
    pub const LEN: usize = 1 + // discriminator
        4 + // version
        1 + // bump
        32 + // merchant
        32 + // operator
        8 + // operator_fee
        1 + // fee_type
        4 + // current_order_id
        2 + // days_to_close
        4 + // num_policies
        4; // num_accepted_currencies

    pub fn to_bytes(&self, policies: &[PolicyData], currencies: &[Pubkey]) -> Vec<u8> {
        let mut data = Vec::new();

        // Add discriminator
        data.push(Self::DISCRIMINATOR);

        // Add base struct data
        data.extend_from_slice(&self.version.to_le_bytes());
        data.push(self.bump);
        data.extend_from_slice(self.merchant.as_ref());
        data.extend_from_slice(self.operator.as_ref());
        data.extend_from_slice(&self.operator_fee.to_le_bytes());
        data.push(self.fee_type.to_u8());
        data.extend_from_slice(&self.current_order_id.to_le_bytes());
        data.extend_from_slice(&self.days_to_close.to_le_bytes());
        data.extend_from_slice(&self.num_policies.to_le_bytes());
        data.extend_from_slice(&self.num_accepted_currencies.to_le_bytes());

        // Add policies
        for policy in policies {
            data.extend_from_slice(&policy.to_bytes());
        }

        // Add accepted currencies
        for currency in currencies {
            data.extend_from_slice(currency.as_ref());
        }

        data
    }

    pub fn validate_operator(&self, operator: &Pubkey) -> Result<(), ProgramError> {
        if self.operator.ne(operator) {
            return Err(CommerceProgramError::OperatorMismatch.into());
        }
        Ok(())
    }

    pub fn validate_merchant(&self, merchant: &Pubkey) -> Result<(), ProgramError> {
        if self.merchant.ne(merchant) {
            return Err(CommerceProgramError::MerchantMismatch.into());
        }
        Ok(())
    }

    pub fn validate_order_id(&self, order_id: u32) -> Result<(), ProgramError> {
        if order_id == self.current_order_id {
            return Err(CommerceProgramError::OrderIdInvalid.into());
        }
        Ok(())
    }

    pub fn validate_operator_and_merchant(
        &self,
        operator: &Pubkey,
        merchant: &Pubkey,
    ) -> Result<(), ProgramError> {
        if self.operator.ne(operator) {
            return Err(CommerceProgramError::OperatorMismatch.into());
        }
        if self.merchant.ne(merchant) {
            return Err(CommerceProgramError::MerchantMismatch.into());
        }
        Ok(())
    }

    pub fn has_policy_type(policies: &[PolicyData], policy_type: PolicyType) -> bool {
        policies
            .iter()
            .any(|policy| policy.policy_type() == policy_type)
    }

    pub fn check_policy_field<F>(
        policies: &[PolicyData],
        policy_type: PolicyType,
        check_fn: F,
    ) -> bool
    where
        F: Fn(&PolicyData) -> bool,
    {
        policies
            .iter()
            .any(|policy| policy.policy_type() == policy_type && check_fn(policy))
    }

    pub fn get_policy_by_type(
        policies: &[PolicyData],
        policy_type: PolicyType,
    ) -> Option<&PolicyData> {
        policies
            .iter()
            .find(|policy| policy.policy_type() == policy_type)
    }

    pub fn get_policies(&self, account_data: &[u8]) -> Result<Vec<PolicyData>, ProgramError> {
        let mut policies = Vec::new();
        let mut offset = Self::LEN;

        for _ in 0..self.num_policies {
            if offset + PolicyData::SIZE > account_data.len() {
                return Err(ProgramError::InvalidAccountData);
            }
            let policy = PolicyData::from_bytes(&account_data[offset..offset + PolicyData::SIZE])?;
            policies.push(policy);
            offset += PolicyData::SIZE;
        }

        Ok(policies)
    }

    pub fn validate_pda(&self, account_info_key: &Pubkey) -> Result<(), ProgramError> {
        let (pda, bump) = find_program_address(
            &[
                MERCHANT_OPERATOR_CONFIG_SEED,
                self.merchant.as_ref(),
                self.operator.as_ref(),
                &self.version.to_le_bytes(),
            ],
            &COMMERCE_PROGRAM_ID,
        );
        if pda.ne(account_info_key) || bump != self.bump {
            return Err(CommerceProgramError::MerchantOperatorConfigInvalidPda.into());
        }
        Ok(())
    }

    pub fn get_accepted_currencies(
        &self,
        account_data: &[u8],
    ) -> Result<Vec<Pubkey>, ProgramError> {
        let mut currencies = Vec::new();
        let policies_size = self.num_policies as usize * PolicyData::SIZE;
        let mut offset = Self::LEN + policies_size;

        for _ in 0..self.num_accepted_currencies {
            if offset + 32 > account_data.len() {
                return Err(ProgramError::InvalidAccountData);
            }
            let currency: Pubkey = account_data[offset..offset + 32].try_into().unwrap();
            currencies.push(currency);
            offset += 32;
        }

        Ok(currencies)
    }

    pub fn add_policy(&mut self, policy: PolicyData, account_data: &mut Vec<u8>) {
        let policies_start = Self::LEN;
        let currencies_start = policies_start + (self.num_policies as usize * PolicyData::SIZE);

        // Insert policy data before currencies
        let policy_bytes = policy.to_bytes();
        account_data.splice(currencies_start..currencies_start, policy_bytes);

        self.num_policies += 1;
    }

    pub fn add_accepted_currency(&mut self, currency: Pubkey, account_data: &mut Vec<u8>) {
        account_data.extend_from_slice(currency.as_ref());
        self.num_accepted_currencies += 1;
    }

    pub fn calculate_size(&self) -> usize {
        Self::LEN
            + (self.num_policies as usize * PolicyData::SIZE)
            + (self.num_accepted_currencies as usize * 32)
    }

    pub fn try_from_bytes(
        data: &[u8],
    ) -> Result<(Self, Vec<PolicyData>, Vec<Pubkey>), ProgramError> {
        if data[0] != Self::DISCRIMINATOR {
            return Err(ProgramError::InvalidAccountData);
        }

        let mut offset: usize = 1;

        let version = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
        offset += 4;

        let bump = data[offset];
        offset += 1;

        let merchant: Pubkey = data[offset..offset + 32].try_into().unwrap();
        offset += 32;

        let operator: Pubkey = data[offset..offset + 32].try_into().unwrap();
        offset += 32;

        let operator_fee = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
        offset += 8;

        let fee_type = FeeType::from_u8(data[offset])?;
        offset += 1;

        let current_order_id = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
        offset += 4;

        let days_to_close = u16::from_le_bytes(data[offset..offset + 2].try_into().unwrap());
        offset += 2;

        let num_policies = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());
        offset += 4;

        let num_accepted_currencies =
            u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap());

        let config = Self {
            version,
            bump,
            merchant,
            operator,
            operator_fee,
            fee_type,
            current_order_id,
            days_to_close,
            num_policies,
            num_accepted_currencies,
        };

        let policies = config.get_policies(data)?;
        let currencies = config.get_accepted_currencies(data)?;
        Ok((config, policies, currencies))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::policy::{RefundPolicy, SettlementPolicy};
    use alloc::vec;

    fn create_test_merchant() -> Pubkey {
        Pubkey::from([1; 32])
    }

    fn create_test_operator() -> Pubkey {
        Pubkey::from([2; 32])
    }

    fn create_test_refund_policy() -> PolicyData {
        PolicyData::Refund(RefundPolicy {
            max_amount: 1000,
            max_time_after_purchase: 3600,
        })
    }

    fn create_test_settlement_policy() -> PolicyData {
        PolicyData::Settlement(SettlementPolicy {
            min_settlement_amount: 100,
            settlement_frequency_hours: 24,
            auto_settle: true,
        })
    }

    #[test]
    fn test_has_policy_type_found() {
        let policies = vec![create_test_refund_policy()];

        assert!(MerchantOperatorConfig::has_policy_type(
            &policies,
            PolicyType::Refund
        ));
        assert!(!MerchantOperatorConfig::has_policy_type(
            &policies,
            PolicyType::Settlement
        ));
    }

    #[test]
    fn test_has_policy_type_empty_policies() {
        let policies = vec![];
        assert!(!MerchantOperatorConfig::has_policy_type(
            &policies,
            PolicyType::Refund
        ));
    }

    #[test]
    fn test_check_policy_field_refund_amount() {
        let policies = vec![create_test_refund_policy()];

        // Test max_amount check
        let has_high_amount =
            MerchantOperatorConfig::check_policy_field(&policies, PolicyType::Refund, |policy| {
                if let PolicyData::Refund(refund) = policy {
                    refund.max_amount > 500
                } else {
                    false
                }
            });
        assert!(has_high_amount);

        let has_very_high_amount =
            MerchantOperatorConfig::check_policy_field(&policies, PolicyType::Refund, |policy| {
                if let PolicyData::Refund(refund) = policy {
                    refund.max_amount > 2000
                } else {
                    false
                }
            });
        assert!(!has_very_high_amount);
    }

    #[test]
    fn test_check_policy_field_settlement_auto_settle() {
        let policies = vec![create_test_settlement_policy()];

        let has_auto_settle = MerchantOperatorConfig::check_policy_field(
            &policies,
            PolicyType::Settlement,
            |policy| {
                if let PolicyData::Settlement(settlement) = policy {
                    settlement.auto_settle
                } else {
                    false
                }
            },
        );
        assert!(has_auto_settle);
    }

    #[test]
    fn test_validate_operator_success() {
        let operator = create_test_operator();
        let config = MerchantOperatorConfig {
            version: 1,
            bump: 255,
            merchant: create_test_merchant(),
            operator,
            operator_fee: 100,
            fee_type: FeeType::Bps,
            current_order_id: 0,
            days_to_close: 7,
            num_policies: 0,
            num_accepted_currencies: 0,
        };

        assert!(config.validate_operator(&operator).is_ok());
    }

    #[test]
    fn test_validate_operator_failure() {
        let operator = create_test_operator();
        let wrong_operator = Pubkey::from([3; 32]);
        let config = MerchantOperatorConfig {
            version: 1,
            bump: 255,
            merchant: create_test_merchant(),
            operator,
            operator_fee: 100,
            fee_type: FeeType::Bps,
            current_order_id: 0,
            days_to_close: 7,
            num_policies: 0,
            num_accepted_currencies: 0,
        };

        assert!(config.validate_operator(&wrong_operator).is_err());
    }

    #[test]
    fn test_validate_merchant_success() {
        let merchant = create_test_merchant();
        let config = MerchantOperatorConfig {
            version: 1,
            bump: 255,
            merchant,
            operator: create_test_operator(),
            operator_fee: 100,
            fee_type: FeeType::Bps,
            current_order_id: 0,
            days_to_close: 7,
            num_policies: 0,
            num_accepted_currencies: 0,
        };

        assert!(config.validate_merchant(&merchant).is_ok());
    }

    #[test]
    fn test_validate_merchant_failure() {
        let merchant = create_test_merchant();
        let wrong_merchant = Pubkey::from([4; 32]);
        let config = MerchantOperatorConfig {
            version: 1,
            bump: 255,
            merchant,
            operator: create_test_operator(),
            operator_fee: 100,
            fee_type: FeeType::Bps,
            current_order_id: 0,
            days_to_close: 7,
            num_policies: 0,
            num_accepted_currencies: 0,
        };

        assert!(config.validate_merchant(&wrong_merchant).is_err());
    }

    #[test]
    fn test_validate_operator_and_merchant_success() {
        let merchant = create_test_merchant();
        let operator = create_test_operator();
        let config = MerchantOperatorConfig {
            version: 1,
            bump: 255,
            merchant,
            operator,
            operator_fee: 100,
            fee_type: FeeType::Bps,
            current_order_id: 0,
            days_to_close: 7,
            num_policies: 0,
            num_accepted_currencies: 0,
        };

        assert!(config
            .validate_operator_and_merchant(&operator, &merchant)
            .is_ok());
    }

    #[test]
    fn test_validate_operator_and_merchant_wrong_operator() {
        let merchant = create_test_merchant();
        let operator = create_test_operator();
        let wrong_operator = Pubkey::from([5; 32]);
        let config = MerchantOperatorConfig {
            version: 1,
            bump: 255,
            merchant,
            operator,
            operator_fee: 100,
            fee_type: FeeType::Bps,
            current_order_id: 0,
            days_to_close: 7,
            num_policies: 0,
            num_accepted_currencies: 0,
        };

        assert!(config
            .validate_operator_and_merchant(&wrong_operator, &merchant)
            .is_err());
    }

    #[test]
    fn test_validate_operator_and_merchant_wrong_merchant() {
        let merchant = create_test_merchant();
        let operator = create_test_operator();
        let wrong_merchant = Pubkey::from([6; 32]);
        let config = MerchantOperatorConfig {
            version: 1,
            bump: 255,
            merchant,
            operator,
            operator_fee: 100,
            fee_type: FeeType::Bps,
            current_order_id: 0,
            days_to_close: 7,
            num_policies: 0,
            num_accepted_currencies: 0,
        };

        assert!(config
            .validate_operator_and_merchant(&operator, &wrong_merchant)
            .is_err());
    }

    #[test]
    fn test_multiple_policies_complex_checks() {
        let policies = vec![create_test_refund_policy(), create_test_settlement_policy()];

        // Test complex policy validation - refund with high amount AND settlement with auto_settle
        let has_high_refund =
            MerchantOperatorConfig::check_policy_field(&policies, PolicyType::Refund, |policy| {
                if let PolicyData::Refund(refund) = policy {
                    refund.max_amount >= 1000
                } else {
                    false
                }
            });

        let has_auto_settlement = MerchantOperatorConfig::check_policy_field(
            &policies,
            PolicyType::Settlement,
            |policy| {
                if let PolicyData::Settlement(settlement) = policy {
                    settlement.auto_settle
                } else {
                    false
                }
            },
        );

        assert!(has_high_refund);
        assert!(has_auto_settlement);
    }
}
