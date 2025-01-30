import { kv } from '@vercel/kv';
import { verifyAccessToken } from '../utils/jwt.js';

export default async function handler(req, res) {
    console.group('🔵 [API] Save Purpose');
    if (req.method !== 'POST') {
        console.warn('🟡 [API] Invalid method:', req.method);
        console.groupEnd();
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.warn('🟡 [API] No authorization header');
            console.groupEnd();
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyAccessToken(token);
        if (!decoded) {
            console.warn('🟡 [API] Invalid token');
            console.groupEnd();
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { userId } = decoded;
        const { purposeStatement } = req.body;

        // Validate the data
        if (!userId || typeof userId !== 'string') {
            console.warn('🟡 [API] Invalid userId:', userId);
            console.groupEnd();
            return res.status(400).json({ 
                error: 'Invalid or missing userId' 
            });
        }

        if (typeof purposeStatement !== 'string' || purposeStatement.trim().length === 0) {
            console.warn('🟡 [API] Invalid purpose statement format');
            console.groupEnd();
            return res.status(400).json({ 
                error: 'Invalid purpose statement format' 
            });
        }

        // Get existing user data
        const userData = await kv.get(`user:${userId}`);
        if (!userData) {
            console.warn('🟡 [API] User not found:', userId);
            console.groupEnd();
            return res.status(404).json({ error: 'User not found' });
        }

        // Create purpose metadata
        const purposeData = {
            userId,
            statement: purposeStatement.trim(),
            updatedAt: new Date().toISOString()
        };

        // Update only the necessary user flags
        userData.lastActive = new Date().toISOString();
        userData.hasPurpose = true;

        // Save data atomically
        const pipeline = kv.pipeline();
        pipeline.set(`user:${userId}`, userData);
        pipeline.set(`user:${userId}:purpose`, purposeData);
        await pipeline.exec();
        
        console.debug('🔵 [API] Saved purpose for user:', { userId, purposeData });
        console.groupEnd();
        
        return res.status(200).json({ 
            success: true,
            data: purposeData
        });
    } catch (error) {
        console.error('🔴 [API] Error saving purpose:', error);
        console.groupEnd();
        return res.status(500).json({ 
            error: 'Failed to save purpose statement',
            details: error.message 
        });
    }
} 