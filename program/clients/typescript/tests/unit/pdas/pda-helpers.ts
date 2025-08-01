import { COMMERCE_PROGRAM_PROGRAM_ADDRESS } from '../../../src/generated/programs/commerceProgram';
import {
  getAddressEncoder,
  getProgramDerivedAddress,
  getU32Encoder,
  getUtf8Encoder,
  type Address,
  type ProgramDerivedAddress,
} from '@solana/kit';

// PDA seed constants
const MERCHANT_PDA_SEED = 'merchant';
const OPERATOR_PDA_SEED = 'operator';
const PAYMENT_PDA_SEED = 'payment';
const MERCHANT_OPERATOR_CONFIG_PDA_SEED = 'merchant_operator_config';
const EVENT_AUTHORITY_PDA_SEED = 'event_authority';

async function expectedMerchantPda(owner: Address): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
        programAddress: COMMERCE_PROGRAM_PROGRAM_ADDRESS,
        seeds: [
            getUtf8Encoder().encode(MERCHANT_PDA_SEED),
            getAddressEncoder().encode(owner),
        ],
    });
}

async function expectedOperatorPda(owner: Address): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
        programAddress: COMMERCE_PROGRAM_PROGRAM_ADDRESS,
        seeds: [
            getUtf8Encoder().encode(OPERATOR_PDA_SEED),
            getAddressEncoder().encode(owner),
        ],
    });
}

async function expectedPaymentPda(
    merchantOperatorConfig: Address,
    buyer: Address,
    mint: Address,
    orderId: number
): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
        programAddress: COMMERCE_PROGRAM_PROGRAM_ADDRESS,
        seeds: [
            getUtf8Encoder().encode(PAYMENT_PDA_SEED),
            getAddressEncoder().encode(merchantOperatorConfig),
            getAddressEncoder().encode(buyer),
            getAddressEncoder().encode(mint),
            getU32Encoder().encode(orderId),
        ],
    });
}

async function expectedMerchantOperatorConfigPda(
    merchant: Address,
    operator: Address,
    version: number
): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
        programAddress: COMMERCE_PROGRAM_PROGRAM_ADDRESS,
        seeds: [
            getUtf8Encoder().encode(MERCHANT_OPERATOR_CONFIG_PDA_SEED),
            getAddressEncoder().encode(merchant),
            getAddressEncoder().encode(operator),
            getU32Encoder().encode(version),
        ],
    });
}

async function expectedEventAuthorityPda(): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
        programAddress: COMMERCE_PROGRAM_PROGRAM_ADDRESS,
        seeds: [
            getUtf8Encoder().encode(EVENT_AUTHORITY_PDA_SEED),
        ],
    });
}

export { 
    expectedMerchantPda,
    expectedOperatorPda,
    expectedPaymentPda,
    expectedMerchantOperatorConfigPda,
    expectedEventAuthorityPda
};