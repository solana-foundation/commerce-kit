import { expect } from '@jest/globals';
import { address } from 'gill';
import {
  findPaymentPda,
  type PaymentSeeds,
} from '../../../src/generated/pdas/payment';
import { expectedPaymentPda } from './pda-helpers';

describe('Payment PDA', () => {
  // Sample addresses for testing
  const sampleOwner = address('7JttKuoVeFqzMkspfBvTxGiHjYr9dT4GozFvJC5A7Nfa');
  const sampleBuyer = address('HJKATa5s6jwQzM23DaBJPRJ8qdH7YN7wLPgw9w3gicZD');
  const sampleMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC mint
  const sampleMint2 = address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'); // USDT mint
  const sampleMerchant = address('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1');

  it('should generate payment PDA matching expected values', async () => {
    const seeds: PaymentSeeds = {
      merchantOperatorConfig: sampleMerchant,
      buyer: sampleBuyer,
      mint: sampleMint,
      orderId: 12345,
    };

    const generatedPda = await findPaymentPda(seeds);
    const expectedPda = await expectedPaymentPda(
      sampleMerchant,
      sampleBuyer,
      sampleMint,
      12345
    );

    expect(generatedPda[0]).toBe(expectedPda[0]); // address
    expect(generatedPda[1]).toBe(expectedPda[1]); // bump
  });

  it('should generate payment PDA with all required seeds', async () => {
    const seeds: PaymentSeeds = {
      merchantOperatorConfig: sampleMerchant,
      buyer: sampleBuyer,
      mint: sampleMint,
      orderId: 12345,
    };

    const pda = await findPaymentPda(seeds);

    expect(pda[0]).toBeDefined();
    expect(pda[1]).toBeDefined();
    expect(typeof pda[0]).toBe('string');
    expect(typeof pda[1]).toBe('number');
    expect(pda[1]).toBeGreaterThanOrEqual(0);
    expect(pda[1]).toBeLessThanOrEqual(255);
  });

  it('should generate different payment PDAs for different order IDs', async () => {
    const baseSeeds: PaymentSeeds = {
      merchantOperatorConfig: sampleMerchant,
      buyer: sampleBuyer,
      mint: sampleMint,
      orderId: 12345,
    };

    const seeds2: PaymentSeeds = {
      ...baseSeeds,
      orderId: 67890,
    };

    const pda1 = await findPaymentPda(baseSeeds);
    const pda2 = await findPaymentPda(seeds2);

    expect(pda1[0]).not.toBe(pda2[0]); // address
  });

  it('should generate different payment PDAs for different buyers', async () => {
    const baseSeeds: PaymentSeeds = {
      merchantOperatorConfig: sampleMerchant,
      buyer: sampleBuyer,
      mint: sampleMint,
      orderId: 12345,
    };

    const seeds2: PaymentSeeds = {
      ...baseSeeds,
      buyer: sampleOwner,
    };

    const pda1 = await findPaymentPda(baseSeeds);
    const pda2 = await findPaymentPda(seeds2);

    expect(pda1[0]).not.toBe(pda2[0]);
    expect(pda1[1]).not.toBe(pda2[1]);
  });

  it('should generate different payment PDAs for different mints', async () => {
    const baseSeeds: PaymentSeeds = {
      merchantOperatorConfig: sampleMerchant,
      buyer: sampleBuyer,
      mint: sampleMint,
      orderId: 12345,
    }; 

    const seeds2: PaymentSeeds = {
      ...baseSeeds,
      mint: sampleMint2,
    };
    
    const pda1 = await findPaymentPda(baseSeeds);
    const pda2 = await findPaymentPda(seeds2);

    expect(pda1[0]).not.toBe(pda2[0]);
    expect(pda1[1]).not.toBe(pda2[1]);
  });

  it('should handle edge cases for payment PDA', async () => {
    // Test with minimum order ID
    const minSeeds: PaymentSeeds = {
      merchantOperatorConfig: sampleMerchant,
      buyer: sampleBuyer,
      mint: sampleMint,
      orderId: 0,
    };

    const minPda = await findPaymentPda(minSeeds);
    expect(minPda[0]).toBeDefined();
    expect(minPda[1]).toBeDefined();

    // Test with maximum u32 order ID
    const maxSeeds: PaymentSeeds = {
      ...minSeeds,
      orderId: 4294967295, // 2^32 - 1
    };

    const maxPda = await findPaymentPda(maxSeeds);
    expect(maxPda[0]).toBeDefined();
    expect(maxPda[1]).toBeDefined();
    expect(minPda[0]).not.toBe(maxPda[0]);
  });

  it('should use custom program address when provided', async () => {
    const customProgramId = address('11111111111111111111111111111111');
    const seeds: PaymentSeeds = {
      merchantOperatorConfig: sampleMerchant,
      buyer: sampleBuyer,
      mint: sampleMint,
      orderId: 12345,
    };

    const defaultPda = await findPaymentPda(seeds);
    const customPda = await findPaymentPda(seeds, { programAddress: customProgramId });

    expect(defaultPda[0]).not.toBe(customPda[0]);
  });
});