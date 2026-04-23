import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUserToken } from './auth-middleware.js';

async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
    return res.status(200).json({ valid: true });
}

export default verifyUserToken(handler);
