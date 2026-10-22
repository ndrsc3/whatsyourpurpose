// Daily Vercel cron (vercel.json `crons`). Upstash archives a free database after a stretch with
// no commands, and an archived store 500s every KV route until it is restored by hand. One small
// write a day keeps it active: Upstash doesn't say whether reads count, and a write does.
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    // With CRON_SECRET set, Vercel sends it on cron calls and anyone else is refused. Without it the
    // route stays open, which costs one idempotent write per call.
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.authorization !== `Bearer ${secret}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        await kv.set('keepalive:last', new Date().toISOString());
        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[keepalive]', error);
        res.status(500).json({ error: 'KV unreachable' });
    }
}
