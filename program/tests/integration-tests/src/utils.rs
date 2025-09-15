use commerce_program_client::{CommerceProgramError, COMMERCE_PROGRAM_ID as PROGRAM_ID};
use litesvm::{types::TransactionMetadata, LiteSVM};
use solana_program::pubkey;
use solana_program_pack::Pack;
use solana_sdk::{
    account::Account,
    instruction::Instruction,
    program_option::COption,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use spl_token::{
    state::{Account as TokenAccount, Mint},
    ID as TOKEN_PROGRAM_ID,
};

use solana_program::clock::Clock;
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account_idempotent,
};

const MIN_LAMPORTS: u64 = 500_000_000;
pub const MAX_BPS: u64 = 10_000;
pub const DAYS_TO_CLOSE: u16 = 7;

pub const ATA_PROGRAM_ID: Pubkey = pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
pub const USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const USDT_MINT: Pubkey = pubkey!("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

// Commerce Program Error Codes (using generated error enum)
pub const INVALID_MINT_ERROR: u32 = CommerceProgramError::InvalidMint as u32;
pub const INVALID_PAYMENT_STATUS_ERROR: u32 = CommerceProgramError::InvalidPaymentStatus as u32;
pub const INSUFFICIENT_SETTLEMENT_AMOUNT_ERROR: u32 =
    CommerceProgramError::InsufficientSettlementAmount as u32;
pub const SETTLEMENT_TOO_EARLY_ERROR: u32 = CommerceProgramError::SettlementTooEarly as u32;
pub const REFUND_AMOUNT_EXCEEDS_POLICY_LIMIT_ERROR: u32 =
    CommerceProgramError::RefundAmountExceedsPolicyLimit as u32;
pub const REFUND_WINDOW_EXPIRED_ERROR: u32 = CommerceProgramError::RefundWindowExpired as u32;
pub const INVALID_EVENT_AUTHORITY_ERROR: u32 = CommerceProgramError::InvalidEventAuthority as u32;
pub const INVALID_ATA_ERROR: u32 = CommerceProgramError::InvalidAta as u32;
pub const PAYMENT_CANNOT_BE_CLOSED_ERROR: u32 =
    CommerceProgramError::PaymentCloseWindowNotReached as u32;
pub const MERCHANT_OWNER_MISMATCH_ERROR: u32 = CommerceProgramError::MerchantOwnerMismatch as u32;
pub const MERCHANT_INVALID_PDA_ERROR: u32 = CommerceProgramError::MerchantInvalidPda as u32;
pub const OPERATOR_OWNER_MISMATCH_ERROR: u32 = CommerceProgramError::OperatorOwnerMismatch as u32;
pub const OPERATOR_INVALID_PDA_ERROR: u32 = CommerceProgramError::OperatorInvalidPda as u32;
pub const OPERATOR_MISMATCH_ERROR: u32 = CommerceProgramError::OperatorMismatch as u32;
pub const MERCHANT_MISMATCH_ERROR: u32 = CommerceProgramError::MerchantMismatch as u32;
pub const ORDER_ID_INVALID_ERROR: u32 = CommerceProgramError::OrderIdInvalid as u32;
pub const MERCHANT_OPERATOR_CONFIG_INVALID_PDA_ERROR: u32 =
    CommerceProgramError::MerchantOperatorConfigInvalidPda as u32;
pub const ACCEPTED_CURRENCIES_EMPTY_ERROR: u32 =
    CommerceProgramError::AcceptedCurrenciesEmpty as u32;
pub const DUPLICATE_MINT_ERROR: u32 = CommerceProgramError::DuplicateMint as u32;

// Standard Solana Program Error Codes
pub const INVALID_ARGUMENT_ERROR: u32 = 5; // ProgramError::InvalidArgument
pub const INVALID_ACCOUNT_DATA_ERROR: u32 = 6; // ProgramError::InvalidAccountData
pub const NOT_ENOUGH_ACCOUNT_KEYS_ERROR: u32 = 2; // ProgramError::NotEnoughAccountKeys
pub const INVALID_INSTRUCTION_DATA_ERROR: u32 = 3; // ProgramError::InvalidInstructionData
pub const INVALID_ACCOUNT_OWNER_ERROR: u32 = 23; // ProgramError::InvalidAccountOwner
pub const INVALID_SEEDS_ERROR: u32 = 14; // ProgramError::InvalidSeeds
pub const MISSING_REQUIRED_SIGNATURE_ERROR: u32 = 0; // ProgramError::MissingRequiredSignature

// Token Program Error Codes
pub const TOKEN_INSUFFICIENT_FUNDS_ERROR: u32 = 1; // Token program insufficient funds

// fetched account data using `solana account`
const USDC_MINT_DATA: &[u8] = &[
    1, 0, 0, 0, 152, 254, 134, 232, 141, 155, 226, 234, 139, 193, 204, 164, 135, 139, 41, 136, 194,
    64, 245, 43, 132, 36, 191, 180, 14, 209, 162, 221, 203, 94, 25, 155, 81, 11, 239, 189, 73, 56,
    31, 0, 6, 1, 1, 0, 0, 0, 98, 112, 170, 138, 89, 197, 148, 5, 180, 82, 134, 200, 103, 114, 230,
    205, 18, 110, 155, 138, 93, 58, 56, 83, 109, 55, 247, 180, 20, 232, 182, 103,
];

// fetched account data using `solana account`
const USDT_MINT_DATA: &[u8] = &[
    1, 0, 0, 0, 5, 234, 156, 241, 108, 228, 17, 152, 241, 164, 153, 55, 200, 140, 55, 10, 148, 212,
    175, 255, 137, 181, 186, 203, 142, 244, 94, 99, 36, 187, 120, 247, 198, 70, 162, 45, 160, 125,
    8, 0, 6, 1, 1, 0, 0, 0, 5, 234, 156, 241, 108, 228, 17, 152, 241, 164, 153, 55, 200, 140, 55,
    10, 148, 212, 175, 255, 137, 181, 186, 203, 142, 244, 94, 99, 36, 187, 120, 247,
];

pub struct TestContext {
    pub svm: LiteSVM,
    pub payer: Keypair,
}

impl TestContext {
    pub fn new() -> Self {
        let mut svm = LiteSVM::new().with_sysvars();

        // Override clock to start at current time instead of Unix epoch 0
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        svm.set_sysvar(&Clock {
            slot: 1,
            epoch_start_timestamp: current_time,
            epoch: 0,
            leader_schedule_epoch: 0,
            unix_timestamp: current_time,
        });

        let program_data = include_bytes!("../../../target/deploy/commerce_program.so");
        svm.add_program(PROGRAM_ID, program_data);

        let token_program_data =
            std::fs::read("deps/spl_token.so").expect("Failed to read token program");
        svm.add_program(TOKEN_PROGRAM_ID, &token_program_data);

        let ata_program_data = std::fs::read("deps/spl_associated_token_account.so")
            .expect("Failed to read associated token program");
        svm.add_program(ATA_PROGRAM_ID, &ata_program_data);

        // set usdc
        svm.set_account(
            USDC_MINT,
            Account {
                lamports: 407591838630,
                data: USDC_MINT_DATA.to_vec(),
                owner: TOKEN_PROGRAM_ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();

        // set usdt
        svm.set_account(
            USDT_MINT,
            Account {
                lamports: 407591838630,
                data: USDT_MINT_DATA.to_vec(),
                owner: TOKEN_PROGRAM_ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();

        let payer = Keypair::new();

        svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

        Self { svm, payer }
    }

    pub fn airdrop_if_required(
        &mut self,
        pubkey: &Pubkey,
        lamports: u64,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(account) = self.svm.get_account(pubkey) {
            if account.lamports < MIN_LAMPORTS {
                return match self.svm.airdrop(pubkey, lamports) {
                    Ok(_) => Ok(()),
                    Err(e) => Err(format!("Airdrop failed: {:?}", e).into()),
                };
            }
        }

        Ok(())
    }

    pub fn create_account(
        &mut self,
        pubkey: &Pubkey,
        owner: &Pubkey,
        data: Vec<u8>,
        lamports: u64,
    ) {
        let account = Account {
            lamports,
            data,
            owner: *owner,
            executable: false,
            rent_epoch: 0,
        };
        let _ = self.svm.set_account(*pubkey, account);
    }

    pub fn send_transaction(
        &mut self,
        instruction: Instruction,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            self.svm.latest_blockhash(),
        );

        let result = self.svm.send_transaction(transaction);
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Transaction failed: {:?}", e).into()),
        }
    }

    pub fn send_transaction_with_signers(
        &mut self,
        instruction: Instruction,
        signers: &[&Keypair],
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.send_transaction_with_signers_with_transaction_result(instruction, signers)
            .map(|_| ())
    }

    pub fn send_transaction_with_signers_with_transaction_result(
        &mut self,
        instruction: Instruction,
        signers: &[&Keypair],
    ) -> Result<TransactionMetadata, Box<dyn std::error::Error>> {
        let mut all_signers = vec![&self.payer];
        all_signers.extend(signers);

        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.payer.pubkey()),
            &all_signers,
            self.svm.latest_blockhash(),
        );

        let result = self.svm.send_transaction(transaction);
        match result {
            Ok(logs) => Ok(logs),
            Err(e) => Err(format!("Transaction failed: {:?}", e).into()),
        }
    }

    pub fn get_account(&mut self, pubkey: &Pubkey) -> Option<Account> {
        self.svm.get_account(pubkey)
    }

    pub fn get_account_data(&mut self, pubkey: &Pubkey) -> Option<Vec<u8>> {
        self.get_account(pubkey).map(|account| account.data)
    }

    pub fn advance_clock(&mut self, seconds: i64) {
        let current_clock = self.svm.get_sysvar::<Clock>();
        self.svm.set_sysvar(&Clock {
            slot: current_clock.slot + seconds as u64,
            epoch_start_timestamp: current_clock.epoch_start_timestamp,
            epoch: current_clock.epoch,
            leader_schedule_epoch: current_clock.leader_schedule_epoch,
            unix_timestamp: current_clock.unix_timestamp + seconds,
        });
    }
}

impl Default for TestContext {
    fn default() -> Self {
        Self::new()
    }
}

pub fn find_operator_pda(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"operator", authority.as_ref()], &PROGRAM_ID)
}

pub fn find_merchant_pda(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"merchant", authority.as_ref()], &PROGRAM_ID)
}

pub fn find_merchant_operator_config_pda(
    merchant: &Pubkey,
    operator: &Pubkey,
    version: u32,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"merchant_operator_config",
            merchant.as_ref(),
            operator.as_ref(),
            &version.to_le_bytes(),
        ],
        &PROGRAM_ID,
    )
}

pub fn find_payment_pda(
    merchant_operator_config: &Pubkey,
    buyer: &Pubkey,
    mint: &Pubkey,
    order_id: u32,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"payment",
            merchant_operator_config.as_ref(),
            buyer.as_ref(),
            mint.as_ref(),
            &order_id.to_le_bytes(),
        ],
        &PROGRAM_ID,
    )
}

pub fn find_event_authority_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"event_authority"], &PROGRAM_ID)
}

pub fn get_token_balance(context: &mut TestContext, ata: &Pubkey) -> u64 {
    let account = context.get_account(ata);
    match account {
        Some(account) => {
            if account.owner == TOKEN_PROGRAM_ID {
                let token_account =
                    TokenAccount::unpack(&account.data).expect("Should deserialize token account");
                token_account.amount
            } else {
                0
            }
        }
        None => 0,
    }
}

pub fn get_or_create_associated_token_account(
    context: &mut TestContext,
    wallet: &Pubkey,
    mint: &Pubkey,
) -> Pubkey {
    let ata_ix = create_associated_token_account_idempotent(
        &context.payer.pubkey(),
        wallet,
        mint,
        &TOKEN_PROGRAM_ID,
    );

    context
        .send_transaction(ata_ix)
        .expect("Failed to create associated token account");

    get_associated_token_address(wallet, mint)
}

pub fn set_token_balance(
    context: &mut TestContext,
    ata: &Pubkey,
    mint: &Pubkey,
    owner: &Pubkey,
    amount: u64,
) {
    let token_account = TokenAccount {
        mint: *mint,
        owner: *owner,
        amount,
        delegate: COption::None,
        state: spl_token::state::AccountState::Initialized,
        is_native: COption::None,
        delegated_amount: 0,
        close_authority: COption::None,
    };

    let mut data = vec![0u8; TokenAccount::LEN];
    TokenAccount::pack(token_account, &mut data).expect("Failed to pack token account");

    context
        .svm
        .set_account(
            *ata,
            Account {
                lamports: 2039280, // Rent-exempt minimum for token account
                data,
                owner: TOKEN_PROGRAM_ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .expect("Failed to set token account");
}

pub fn set_mint(context: &mut TestContext, mint: &Pubkey) {
    let mint_account = Mint {
        decimals: 6,
        is_initialized: true,
        freeze_authority: COption::None,
        mint_authority: COption::None,
        supply: 1_000_000,
    };

    let mut data = vec![0u8; Mint::LEN];
    Mint::pack(mint_account, &mut data).expect("Failed to pack mint account");

    context
        .svm
        .set_account(
            *mint,
            Account {
                lamports: 1_000_000_000,
                data,
                owner: TOKEN_PROGRAM_ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .expect("Failed to set mint account");
}

// Helper function to check if error contains specific program error code
pub fn assert_program_error(
    result: Result<(), Box<dyn std::error::Error>>,
    expected_error_code: u32,
) {
    match result {
        Err(e) => {
            let error_string = format!("{:?}", e);

            // Check for custom program errors (Custom(N))
            let expected_custom_error = format!("Custom({})", expected_error_code);

            // Check for standard Solana program errors based on error code mapping
            let standard_error_patterns = match expected_error_code {
                0 => vec!["MissingRequiredSignature"],
                1 => vec!["insufficient funds"], // Token program error
                2 => vec!["NotEnoughAccountKeys"],
                3 => vec!["InvalidInstructionData"],
                5 => vec!["InvalidArgument"],
                6 => vec!["InvalidAccountData"],
                14 => vec!["InvalidSeeds"],
                23 => vec!["InvalidAccountOwner"],
                _ => vec![],
            };

            let mut found_match = false;

            // First check for custom errors
            if error_string.contains(&expected_custom_error) {
                found_match = true;
            }

            // Then check for standard error patterns
            for pattern in &standard_error_patterns {
                if error_string.contains(pattern) {
                    found_match = true;
                    break;
                }
            }

            assert!(
                found_match,
                "Expected error code {} (Custom({}) or standard patterns {:?}) but got: {}",
                expected_error_code, expected_error_code, standard_error_patterns, error_string
            );
        }
        Ok(_) => panic!(
            "Expected transaction to fail with error code {}",
            expected_error_code
        ),
    }
}

#[allow(clippy::too_many_arguments)]
pub fn assert_event_present(
    transaction_metadata: &TransactionMetadata,
    discriminator: u8,
    buyer: &Pubkey,
    merchant: &Pubkey,
    operator: &Pubkey,
    amount: u64,
    order_id: u32,
    operator_fee: Option<u64>,
) {
    // Build expected event data using same format as events.rs
    // EVENT_IX_TAG_LE = 0x1d9acb512ea545e4.to_le_bytes() = [228, 69, 165, 46, 81, 203, 154, 29]
    let mut expected_data = Vec::new();
    expected_data.extend_from_slice(&[228, 69, 165, 46, 81, 203, 154, 29]); // EVENT_IX_TAG_LE
    expected_data.push(discriminator);
    expected_data.extend_from_slice(buyer.as_ref());
    expected_data.extend_from_slice(merchant.as_ref());
    expected_data.extend_from_slice(operator.as_ref());
    expected_data.extend_from_slice(&amount.to_le_bytes());

    // For PaymentCleared events (discriminator 1), include operator_fee
    if discriminator == 1 {
        let fee = operator_fee.unwrap_or(0);
        expected_data.extend_from_slice(&fee.to_le_bytes());
    }

    expected_data.extend_from_slice(&order_id.to_le_bytes());

    let mut event_found = false;

    for inner_instruction_set in &transaction_metadata.inner_instructions {
        for inner_instruction in inner_instruction_set {
            // Check if this is a program instruction that matches our expected event data
            if inner_instruction.instruction.data == expected_data {
                event_found = true;
                break;
            }
        }
        if event_found {
            break;
        }
    }

    assert!(
        event_found,
        "Expected event with discriminator {} not found in transaction. Expected data: {:?}",
        discriminator, expected_data
    );
}
