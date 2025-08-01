import { expect } from '@jest/globals';
import { address } from 'gill';
import {
  findMerchantPda,
  type MerchantSeeds,
} from '../../../src/generated/pdas/merchant';
import { expectedMerchantPda } from './pda-helpers';

describe('Merchant PDA', () => {
  // Sample addresses for testing
  const sampleOwner = address('7JttKuoVeFqzMkspfBvTxGiHjYr9dT4GozFvJC5A7Nfa');
  const sampleBuyer = address('HJKATa5s6jwQzM23DaBJPRJ8qdH7YN7wLPgw9w3gicZD');

  it('should generate merchant PDA matching expected values', async () => {
    const seeds: MerchantSeeds = {
      owner: sampleOwner,
    };

    const generatedPda = await findMerchantPda(seeds);
    const expectedPda = await expectedMerchantPda(sampleOwner);

    expect(generatedPda[0]).toBe(expectedPda[0]); // address
    expect(generatedPda[1]).toBe(expectedPda[1]); // bump
  });

  it('should generate merchant PDA with correct seeds', async () => {
    const seeds: MerchantSeeds = {
      owner: sampleOwner,
    };

    const pda = await findMerchantPda(seeds);

    expect(Array.isArray(pda)).toBe(true);
    expect(pda).toHaveLength(2);
    expect(typeof pda[0]).toBe('string'); // address
    expect(typeof pda[1]).toBe('number'); // bump
    expect(pda[1]).toBeGreaterThanOrEqual(0);
    expect(pda[1]).toBeLessThanOrEqual(255);
  });

  it('should generate different merchant PDAs for different owners', async () => {
    const seeds1: MerchantSeeds = {
      owner: sampleOwner,
    };
    const seeds2: MerchantSeeds = {
      owner: sampleBuyer,
    };

    const pda1 = await findMerchantPda(seeds1);
    const pda2 = await findMerchantPda(seeds2);

    expect(pda1[0]).not.toBe(pda2[0]); // address
  });

  it('should use custom program address when provided', async () => {
    const customProgramId = address('11111111111111111111111111111111');
    const seeds: MerchantSeeds = {
      owner: sampleOwner,
    };

    const defaultPda = await findMerchantPda(seeds);
    const customPda = await findMerchantPda(seeds, { programAddress: customProgramId });

    expect(defaultPda[0]).not.toBe(customPda[0]); // address
  });
});