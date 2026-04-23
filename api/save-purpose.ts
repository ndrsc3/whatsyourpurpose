import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUserToken } from './auth-middleware.js';
import type { AuthenticatedRequest, UserMetadata, PurposeData } from './types.js';

async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
    console.group('🔵 [API] Save Purpose');
    if (req.method !== 'POST') {
        console.warn('🟡 [API] Invalid method:', req.method);
        console.groupEnd();
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = (req as AuthenticatedRequest).user;
        const { purposeStatement } = req.body as { purposeStatement?: string };

        if (typeof purposeStatement !== 'string' || purposeStatement.trim().length === 0) {
            console.warn('🟡 [API] Invalid purpose statement format');
            console.groupEnd();
            return res.status(400).json({ error: 'Invalid purpose statement format' });
        }

        const userData = await kv.get<UserMetadata & { lastActive: string; hasPurpose?: boolean }>(`user:${userId}`);
        if (!userData) {
            console.warn('🟡 [API] User not found:', userId);
            console.groupEnd();
            return res.status(404).json({ error: 'User not found' });
        }

        const purposeData: PurposeData = {
            userId,
            statement: purposeStatement.trim(),
            updatedAt: new Date().toISOString(),
        };

        userData.lastActive = new Date().toISOString();
        userData.hasPurpose = true;

        const pipeline = kv.pipeline();
        pipeline.set(`user:${userId}`, userData);
        pipeline.set(`user:${userId}:purpose`, purposeData);
        await pipeline.exec();

        console.debug('🔵 [API] Saved purpose for user:', { userId, purposeData });
        console.groupEnd();

        return res.status(200).json({
            success: true,
            data: purposeData,
        });
    } catch (error) {
        console.error('🔴 [API] Error saving purpose:', error);
        console.groupEnd();
        return res.status(500).json({
            error: 'Failed to save purpose statement',
            details: (error as Error).message,
        });
    }
}

export default verifyUserToken(handler);
