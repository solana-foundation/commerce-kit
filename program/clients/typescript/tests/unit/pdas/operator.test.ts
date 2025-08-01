import { expect } from '@jest/globals';
import { address } from 'gill';
import {
  findOperatorPda,
  type OperatorSeeds,
} from '../../../src/generated/pdas/operator';
import {
  findMerchantPda,
  type MerchantSeeds,
} from '../../../src/generated/pdas/merchant';
import { expectedOperatorPda } from './pda-helpers';

describe('Operator PDA', () => {
  // Sample addresses for testing
  const sampleOwner = address('7JttKuoVeFqzMkspfBvTxGiHjYr9dT4GozFvJC5A7Nfa');

  it('should generate operator PDA matching expected values', async () => {
    const seeds: OperatorSeeds = {
      owner: sampleOwner,
    };

    const generatedPda = await findOperatorPda(seeds);
    const expectedPda = await expectedOperatorPda(sampleOwner);

    expect(generatedPda[0]).toBe(expectedPda[0]); // address
    expect(generatedPda[1]).toBe(expectedPda[1]); // bump
  });

  it('should generate operator PDA with correct seeds', async () => {
    const seeds: OperatorSeeds = {
      owner: sampleOwner,
    };

    const pda = await findOperatorPda(seeds);

    expect(Array.isArray(pda)).toBe(true);
    expect(pda).toHaveLength(2);
    expect(typeof pda[0]).toBe('string'); // address
    expect(typeof pda[1]).toBe('number'); // bump
    expect(pda[1]).toBeGreaterThanOrEqual(0);
    expect(pda[1]).toBeLessThanOrEqual(255);
  });

  it('should generate different PDAs for merchant vs operator with same owner', async () => {
    const merchantSeeds: MerchantSeeds = { owner: sampleOwner };
    const operatorSeeds: OperatorSeeds = { owner: sampleOwner };

    const merchantPda = await findMerchantPda(merchantSeeds);
    const operatorPda = await findOperatorPda(operatorSeeds);

    expect(merchantPda[0]).not.toBe(operatorPda[0]); // address
  });
  
  it('should use custom program address when provided', async () => {
    const customProgramId = address('11111111111111111111111111111111');
    const seeds: OperatorSeeds = {
      owner: sampleOwner,
    };

    const defaultPda = await findOperatorPda(seeds);
    const customPda = await findOperatorPda(seeds, { programAddress: customProgramId });

    expect(defaultPda[0]).not.toBe(customPda[0]);
  }); 
});