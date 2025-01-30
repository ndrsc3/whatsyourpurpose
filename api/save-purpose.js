import { kv } from '@vercel/kv';
import { verifyUserToken } from './middleware/authMiddleware.js';

async function handler(req, res) {
    console.group('🔵 [API] Save Purpose');
    if (req.method !== 'POST') {
        console.warn('🟡 [API] Invalid method:', req.method);
        console.groupEnd();
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // User data is now available from middleware
        const { userId } = req.user;
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

// Wrap the handler with the auth middleware
export default verifyUserToken(handler); 