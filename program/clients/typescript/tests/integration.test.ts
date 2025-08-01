import { describe, it, expect, beforeAll } from '@jest/globals';
import { address, createSolanaClient, SolanaClient, } from 'gill'
import { TOKEN_PROGRAM_ADDRESS } from 'gill/programs';

describe('Local validator setup', () => {
    let client: SolanaClient;
    beforeAll(async () => {
        client = createSolanaClient({
            urlOrMoniker: 'http://localhost:8899',
        });
    });
    it('should be able to find usdc mint', async () => {
        const usdcMint = await client.rpc.getAccountInfo(address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).send();
        expect(usdcMint).toHaveProperty('context');
        expect(usdcMint).toHaveProperty('value');
        expect(usdcMint.value).not.toBeNull();
        expect(usdcMint.value).not.toBeUndefined();
        expect(usdcMint.value?.owner).toBe(TOKEN_PROGRAM_ADDRESS)
    });
    it('should be able to find usdt mint', async () => {
        const usdtMint = await client.rpc.getAccountInfo(address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')).send();
        expect(usdtMint).toHaveProperty('context');
        expect(usdtMint).toHaveProperty('value');
        expect(usdtMint.value).not.toBeNull();
        expect(usdtMint.value).not.toBeUndefined();
        expect(usdtMint.value?.owner).toBe(TOKEN_PROGRAM_ADDRESS)
    });
});