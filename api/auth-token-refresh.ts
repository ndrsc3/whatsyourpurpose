import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRefreshToken, generateAccessToken } from './auth-jwt.js';
import type { UserMetadata } from './types.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
    console.group('🔵 [API] Token Refresh');

    if (req.method !== 'POST') {
        console.warn('🟡 [API] Invalid method:', req.method);
        console.groupEnd();
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { refreshToken } = req.body as { refreshToken: string };

    try {
        const decoded = verifyRefreshToken(refreshToken);

        const userData = await kv.get<UserMetadata>(`user:${decoded.userId}`);
        if (!userData) {
            console.warn('🟡 [API] User not found:', decoded.userId);
            console.groupEnd();
            return res.status(404).json({ error: 'User not found' });
        }

        const device = userData.devices?.find((d) => d.deviceId === decoded.deviceId);
        if (!device?.trusted) {
            console.warn('🟡 [API] Device no longer trusted:', decoded.deviceId);
            console.groupEnd();
            return res.status(401).json({ error: 'Device no longer trusted' });
        }

        const accessToken = generateAccessToken({
            ...userData,
            deviceId: decoded.deviceId,
            deviceTrusted: true,
        });

        device.lastUsed = new Date().toISOString();
        await kv.set(`user:${decoded.userId}`, userData);

        console.debug('🔵 [API] Token refreshed for user:', userData.username);
        console.groupEnd();
        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error('🔴 [API] Error refreshing token:', error);
        console.groupEnd();
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
}
