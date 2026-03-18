import { kv } from '@vercel/kv';
import crypto from 'crypto';
import { config } from 'dotenv';

config();

const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
    console.error('Error: ADMIN_SECRET environment variable is required');
    process.exit(1);
}

function hashAdminSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
}

async function setupAdmin(): Promise<void> {
    try {
        const adminUsername = 'admin';
        const hashedSecret = hashAdminSecret(ADMIN_SECRET!);

        const adminUser = {
            username: adminUsername,
            secretHash: hashedSecret,
            permissions: ['cleanup', 'users', 'data'],
            createdAt: new Date().toISOString(),
            lastLogin: null as string | null,
        };

        const adminUsers = (await kv.get<Record<string, typeof adminUser>>('admin:users')) ?? {};
        adminUsers[adminUsername] = adminUser;
        await kv.set('admin:users', adminUsers);

        console.log('✅ Admin user setup completed successfully');
        console.log('Username:', adminUsername);
        console.log('Secret: [stored in environment variables]');
    } catch (error) {
        console.error('❌ Error setting up admin user:', error);
        process.exit(1);
    }
}

setupAdmin();
