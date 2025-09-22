import { describe, it, expect } from 'vitest';
import { getClusterInfo } from '../../utils/cluster';
import { createHttpTransport } from '../../transports/http';

describe('Core Integration Tests', () => {
    describe('Cluster Configuration', () => {
        it('should provide correct devnet cluster info', () => {
            const clusterInfo = getClusterInfo('devnet');

            expect(clusterInfo).toEqual({
                name: 'devnet',
                rpcUrl: 'https://api.devnet.solana.com',
                wsUrl: 'wss://api.devnet.solana.com',
                isMainnet: false,
                isDevnet: true,
                isTestnet: false,
            });
        });

        it('should provide correct mainnet cluster info', () => {
            const clusterInfo = getClusterInfo('mainnet');

            expect(clusterInfo).toEqual({
                name: 'mainnet',
                rpcUrl: 'https://api.mainnet-beta.solana.com',
                wsUrl: 'wss://api.mainnet-beta.solana.com',
                isMainnet: true,
                isDevnet: false,
                isTestnet: false,
            });
        });

        it('should provide correct testnet cluster info', () => {
            const clusterInfo = getClusterInfo('testnet');

            expect(clusterInfo).toEqual({
                name: 'testnet',
                rpcUrl: 'https://api.testnet.solana.com',
                wsUrl: 'wss://api.testnet.solana.com',
                isMainnet: false,
                isDevnet: false,
                isTestnet: true,
            });
        });

        it('should handle custom RPC URLs', () => {
            const customUrl = 'https://custom-rpc.example.com';
            const clusterInfo = getClusterInfo(customUrl);

            expect(clusterInfo).toEqual({
                name: 'custom',
                rpcUrl: customUrl,
                isMainnet: true,
                isDevnet: false,
                isTestnet: false,
            });
        });
    });

    describe('Utility Integration', () => {
        it('should provide consistent network configurations', () => {
            const networks = ['devnet', 'mainnet', 'testnet'];

            networks.forEach(network => {
                const clusterInfo = getClusterInfo(network);
                expect(clusterInfo.name).toBe(network);
                expect(clusterInfo.rpcUrl).toContain(network === 'mainnet' ? 'mainnet-beta' : network);
                expect(clusterInfo.wsUrl).toContain(network === 'mainnet' ? 'mainnet-beta' : network);
            });
        });

        it('should handle network detection flags correctly', () => {
            const devnet = getClusterInfo('devnet');
            const mainnet = getClusterInfo('mainnet');
            const testnet = getClusterInfo('testnet');

            // Devnet
            expect(devnet.isDevnet).toBe(true);
            expect(devnet.isMainnet).toBe(false);
            expect(devnet.isTestnet).toBe(false);

            // Mainnet
            expect(mainnet.isDevnet).toBe(false);
            expect(mainnet.isMainnet).toBe(true);
            expect(mainnet.isTestnet).toBe(false);

            // Testnet
            expect(testnet.isDevnet).toBe(false);
            expect(testnet.isMainnet).toBe(false);
            expect(testnet.isTestnet).toBe(true);
        });

        it('should handle URL formatting consistently', () => {
            const devnet = getClusterInfo('devnet');
            const mainnet = getClusterInfo('mainnet');
            const testnet = getClusterInfo('testnet');

            // All should have proper HTTPS RPC URLs
            expect(devnet.rpcUrl).toMatch(/^https:\/\//);
            expect(mainnet.rpcUrl).toMatch(/^https:\/\//);
            expect(testnet.rpcUrl).toMatch(/^https:\/\//);

            // All should have proper WSS WebSocket URLs
            expect(devnet.wsUrl).toMatch(/^wss:\/\//);
            expect(mainnet.wsUrl).toMatch(/^wss:\/\//);
            expect(testnet.wsUrl).toMatch(/^wss:\/\//);
        });

        it('should maintain API endpoint consistency', () => {
            const devnet = getClusterInfo('devnet');
            const mainnet = getClusterInfo('mainnet');
            const testnet = getClusterInfo('testnet');

            // All should use .solana.com domain
            expect(devnet.rpcUrl).toContain('.solana.com');
            expect(mainnet.rpcUrl).toContain('.solana.com');
            expect(testnet.rpcUrl).toContain('.solana.com');
        });
    });

    describe('Configuration Validation', () => {
        it('should validate cluster configuration consistency', () => {
            const networks = ['devnet', 'mainnet', 'testnet'];

            networks.forEach(network => {
                const clusterInfo = getClusterInfo(network);
                expect(clusterInfo.name).toBe(network);
                expect(clusterInfo.rpcUrl).toContain(network === 'mainnet' ? 'mainnet-beta' : network);
                expect(clusterInfo.wsUrl).toContain(network === 'mainnet' ? 'mainnet-beta' : network);
            });
        });

        it('should maintain consistent boolean flags', () => {
            const devnet = getClusterInfo('devnet');
            const mainnet = getClusterInfo('mainnet');
            const testnet = getClusterInfo('testnet');

            // Each should have exactly one true flag
            expect([devnet.isDevnet, devnet.isMainnet, devnet.isTestnet].filter(Boolean)).toHaveLength(1);
            expect([mainnet.isDevnet, mainnet.isMainnet, mainnet.isTestnet].filter(Boolean)).toHaveLength(1);
            expect([testnet.isDevnet, testnet.isMainnet, testnet.isTestnet].filter(Boolean)).toHaveLength(1);
        });

        it('should handle edge cases gracefully', () => {
            const emptyCluster = getClusterInfo('');
            const customCluster = getClusterInfo('https://my-custom-node.com');

            expect(emptyCluster).toBeDefined();
            expect(customCluster).toBeDefined();
            expect(customCluster.name).toBe('custom');
        });
    });
});
