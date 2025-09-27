/**
 * Example Next.js API route for RPC endpoint resolution
 * 
 * Create this file in your Next.js app:
 * - App Router: /app/api/rpc-endpoints/route.ts  
 * - Pages Router: /pages/api/rpc-endpoints.ts
 */

// For App Router (Next.js 13+)
export { POST } from '@solana-commerce/react-sdk/api/rpc-endpoints';

// For Pages Router (Next.js 12 and below)
/*
import { POST } from '@solana-commerce/react-sdk/api/rpc-endpoints';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const request = new Request('', {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const response = await POST(request);
        const data = await response.json();
        
        res.status(response.status).json(data);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
*/
