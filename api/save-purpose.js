export default async function handler(req, res) {
    try {
        const { userId, purposeStatement } = req.body;

        // Validate the data
        if (typeof purposeStatement !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid purpose statement format' 
            });
        }

        // Save to KV store with proper structure
        await kv.set(`user:${userId}:purpose`, {
            statement: purposeStatement,
            createdAt: new Date().toISOString()
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving purpose:', error);
        return res.status(500).json({ 
            error: 'Failed to save purpose statement' 
        });
    }
} 