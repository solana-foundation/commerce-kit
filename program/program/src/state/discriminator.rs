extern crate alloc;

use alloc::vec::Vec;

pub trait Discriminator {
    const DISCRIMINATOR: u8;
}

#[repr(u8)]
pub enum CommerceAccountDiscriminators {
    MerchantDiscriminator = 0,
    OperatorDiscriminator = 1,
    MerchantOperatorConfigDiscriminator = 2,
    PaymentDiscriminator = 3,
}

#[repr(u8)]
pub enum CommerceInstructionDiscriminators {
    CreateMerchant = 0,
    CreateOperator = 1,
    InitializeMerchantOperatorConfig = 2,
    MakePayment = 3,
    ClearPayment = 4,
    RefundPayment = 5,
    ChargebackPayment = 6,
    UpdateMerchantSettlementWallet = 7,
    UpdateMerchantAuthority = 8,
    UpdateOperatorAuthority = 9,
}

impl TryFrom<u8> for CommerceInstructionDiscriminators {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(CommerceInstructionDiscriminators::CreateMerchant),
            1 => Ok(CommerceInstructionDiscriminators::CreateOperator),
            2 => Ok(CommerceInstructionDiscriminators::InitializeMerchantOperatorConfig),
            3 => Ok(CommerceInstructionDiscriminators::MakePayment),
            4 => Ok(CommerceInstructionDiscriminators::ClearPayment),
            5 => Ok(CommerceInstructionDiscriminators::RefundPayment),
            6 => Ok(CommerceInstructionDiscriminators::ChargebackPayment),
            7 => Ok(CommerceInstructionDiscriminators::UpdateMerchantSettlementWallet),
            8 => Ok(CommerceInstructionDiscriminators::UpdateMerchantAuthority),
            9 => Ok(CommerceInstructionDiscriminators::UpdateOperatorAuthority),
            _ => Err(()),
        }
    }
}

pub trait AccountSerialize: Discriminator {
    fn to_bytes_inner(&self) -> Vec<u8>;

    fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.push(Self::DISCRIMINATOR);
        data.extend_from_slice(&self.to_bytes_inner());
        data
    }
}
