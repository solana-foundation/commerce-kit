import { expect } from '@jest/globals';
import { address } from 'gill';
import {
  findMerchantOperatorConfigPda,
  type MerchantOperatorConfigSeeds,
} from '../../../src/generated/pdas/merchantOperatorConfig';
import { expectedMerchantOperatorConfigPda } from './pda-helpers';

describe('MerchantOperatorConfig PDA', () => {
  // Sample addresses for testing
  const sampleMerchant = address('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1');
  const sampleOperator = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');

  it('should generate merchant operator config PDA matching expected values', async () => {
    const seeds: MerchantOperatorConfigSeeds = {
      merchant: sampleMerchant,
      operator: sampleOperator,
      version: 1,
    };

    const generatedPda = await findMerchantOperatorConfigPda(seeds);
    const expectedPda = await expectedMerchantOperatorConfigPda(
      sampleMerchant,
      sampleOperator,
      1
    );

    expect(generatedPda[0]).toBe(expectedPda[0]);
    expect(generatedPda[1]).toBe(expectedPda[1]);
  });

  it('should generate merchant operator config PDA with correct seeds', async () => {
    const seeds: MerchantOperatorConfigSeeds = {
      merchant: sampleMerchant,
      operator: sampleOperator,
      version: 1,
    };

    const pda = await findMerchantOperatorConfigPda(seeds);

    expect(pda[0]).toBeDefined();
    expect(pda[1]).toBeDefined();
    expect(typeof pda[0]).toBe('string');
    expect(typeof pda[1]).toBe('number');
    expect(pda[1]).toBeGreaterThanOrEqual(0);
    expect(pda[1]).toBeLessThanOrEqual(255);
  });

  it('should generate different PDAs for different versions', async () => {
    const seeds1: MerchantOperatorConfigSeeds = {
      merchant: sampleMerchant,
      operator: sampleOperator,
      version: 1,
    };

    const seeds2: MerchantOperatorConfigSeeds = {
      ...seeds1,
      version: 2,
    };

    const pda1 = await findMerchantOperatorConfigPda(seeds1);
    const pda2 = await findMerchantOperatorConfigPda(seeds2);

    expect(pda1[0]).not.toBe(pda2[0]);
    expect(pda1[1]).not.toBe(pda2[1]);
  });

  it('should generate different PDAs for different merchant/operator pairs', async () => {
    const seeds1: MerchantOperatorConfigSeeds = {
      merchant: sampleMerchant,
      operator: sampleOperator,
      version: 1,
    };

    const seeds2: MerchantOperatorConfigSeeds = {
      merchant: sampleOperator, // Swap merchant and operator
      operator: sampleMerchant,
      version: 1,
    };

    const pda1 = await findMerchantOperatorConfigPda(seeds1);
    const pda2 = await findMerchantOperatorConfigPda(seeds2);

    expect(pda1[0]).not.toBe(pda2[0]);
    expect(pda1[1]).not.toBe(pda2[1]);
  });
  it('should use custom program address when provided', async () => {
    const customProgramId = address('11111111111111111111111111111111');
    const seeds: MerchantOperatorConfigSeeds = {
      merchant: sampleMerchant,
      operator: sampleOperator,
      version: 1,
    };

    const defaultPda = await findMerchantOperatorConfigPda(seeds);
    const customPda = await findMerchantOperatorConfigPda(seeds, { programAddress: customProgramId });

    expect(defaultPda[0]).not.toBe(customPda[0]);
  });
});