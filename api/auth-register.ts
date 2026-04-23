import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hashAnswer, generateAuthResponse, createDeviceEntry } from './auth-helpers.js';
import type { UserMetadata } from './types.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
    console.group('🔵 [API] Save User');
    if (req.method !== 'POST') {
        console.warn('🟡 [API] Invalid method:', req.method);
        console.groupEnd();
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, username, deviceId, deviceFingerprint, recoveryAnswer } = req.body as {
        userId: string;
        username: string;
        deviceId: string;
        deviceFingerprint: string;
        recoveryAnswer: string;
    };

    try {
        const userIndex = (await kv.get<Record<string, string>>('userIndex')) ?? {};
        if (userIndex[username.toLowerCase()]) {
            console.warn('🟡 [API] Username already exists:', username);
            console.groupEnd();
            return res.status(409).json({ error: 'Username already taken' });
        }

        const userData: UserMetadata = {
            userId,
            username,
            lastActive: new Date().toISOString(),
            joinDate: new Date().toISOString(),
            recoveryHash: hashAnswer(recoveryAnswer),
            devices: [createDeviceEntry(deviceId, deviceFingerprint)],
        };

        const pipeline = kv.pipeline();
        pipeline.set(`user:${userId}`, userData);
        userIndex[username.toLowerCase()] = userId;
        pipeline.set('userIndex', userIndex);
        pipeline.sadd('activeUsers', userId);
        await pipeline.exec();

        console.debug('🔵 [API] Saved new user:', { userId, username });
        console.groupEnd();

        return res.status(200).json(generateAuthResponse(userData, deviceId));
    } catch (error) {
        console.error('🔴 [API] Error saving user:', error);
        console.groupEnd();
        return res.status(500).json({ error: 'Failed to save user' });
    }
}
