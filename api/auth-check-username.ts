import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
    console.group('🔵 [API] Check Username');
    try {
        const { username } = req.body as { username?: string };

        if (!username) {
            console.warn('🟡 [API] Missing username in request');
            console.groupEnd();
            return res.status(400).json({ error: 'Username is required' });
        }

        const userIndex = (await kv.get<Record<string, string>>('userIndex')) ?? {};
        console.debug('🔵 [API] Checking username against index:', {
            usernameToCheck: username,
            indexSize: Object.keys(userIndex).length,
        });

        if (userIndex[username.toLowerCase()]) {
            console.warn('🟡 [API] Username exists:', username);
            console.groupEnd();
            return res.status(409).json({ error: 'Username already taken' });
        }

        console.debug('🔵 [API] Username available:', username);
        console.groupEnd();
        return res.status(200).json({ available: true });
    } catch (error) {
        console.error('🔴 [API] Error:', error);
        console.groupEnd();
        return res.status(500).json({ error: 'Internal server error' });
    }
}
