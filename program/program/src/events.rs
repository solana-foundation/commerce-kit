extern crate alloc;

use alloc::vec::Vec;
use pinocchio::pubkey::Pubkey;
use shank::ShankType;

use crate::constants::EVENT_IX_TAG_LE;

#[repr(u8)]
pub enum EventDiscriminators {
    PaymentCreated = 0,
    PaymentCleared = 1,
    PaymentRefunded = 2,
}

#[derive(ShankType)]
pub struct PaymentCreatedEvent {
    /// Unique u8 byte for event type.
    pub discriminator: u8,
    /// Reference to the Buyer this payment is associated with
    pub buyer: Pubkey,
    /// Reference to the Merchant this payment is associated with
    pub merchant: Pubkey,
    /// Reference to the Operator this payment is associated with
    pub operator: Pubkey,
    /// Reference to the amount of the payment
    pub amount: u64,
    /// Reference to the order_id of the payment
    pub order_id: u32,
}

impl PaymentCreatedEvent {
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();

        // Prepend IX Discriminator for emit_event.
        data.extend_from_slice(EVENT_IX_TAG_LE);
        data.push(self.discriminator);
        data.extend_from_slice(self.buyer.as_ref());
        data.extend_from_slice(self.merchant.as_ref());
        data.extend_from_slice(self.operator.as_ref());
        data.extend_from_slice(&self.amount.to_le_bytes());
        data.extend_from_slice(&self.order_id.to_le_bytes());

        data
    }
}

#[derive(ShankType)]
pub struct PaymentClearedEvent {
    /// Unique u8 byte for event type.
    pub discriminator: u8,
    /// Reference to the Buyer this payment is associated with
    pub buyer: Pubkey,
    /// Reference to the Merchant this payment is associated with
    pub merchant: Pubkey,
    /// Reference to the Operator this payment is associated with
    pub operator: Pubkey,
    /// Reference to the amount of the payment
    pub amount: u64,
    /// Reference to the operator fee of the payment
    pub operator_fee: u64,
    /// Reference to the order_id of the payment
    pub order_id: u32,
}

impl PaymentClearedEvent {
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();

        // Prepend IX Discriminator for emit_event.
        data.extend_from_slice(EVENT_IX_TAG_LE);
        data.push(self.discriminator);
        data.extend_from_slice(self.buyer.as_ref());
        data.extend_from_slice(self.merchant.as_ref());
        data.extend_from_slice(self.operator.as_ref());
        data.extend_from_slice(&self.amount.to_le_bytes());
        data.extend_from_slice(&self.operator_fee.to_le_bytes());
        data.extend_from_slice(&self.order_id.to_le_bytes());

        data
    }
}

#[derive(ShankType)]
pub struct PaymentRefundedEvent {
    /// Unique u8 byte for event type.
    pub discriminator: u8,
    /// Reference to the Buyer this payment is associated with
    pub buyer: Pubkey,
    /// Reference to the Merchant this payment is associated with
    pub merchant: Pubkey,
    /// Reference to the Operator this payment is associated with
    pub operator: Pubkey,
    /// Reference to the amount of the payment
    pub amount: u64,
    /// Reference to the order_id of the payment
    pub order_id: u32,
}

impl PaymentRefundedEvent {
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut data = Vec::new();

        // Prepend IX Discriminator for emit_event.
        data.extend_from_slice(EVENT_IX_TAG_LE);
        data.push(self.discriminator);
        data.extend_from_slice(self.buyer.as_ref());
        data.extend_from_slice(self.merchant.as_ref());
        data.extend_from_slice(self.operator.as_ref());
        data.extend_from_slice(&self.amount.to_le_bytes());
        data.extend_from_slice(&self.order_id.to_le_bytes());

        data
    }
}
