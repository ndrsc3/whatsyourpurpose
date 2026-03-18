import crypto from 'crypto';
import { generateTokenPair } from './auth-jwt.js';
import type { UserMetadata, DeviceEntry } from './types.js';

export function hashAnswer(answer: string): string {
    const normalizedAnswer = answer.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalizedAnswer).digest('hex');
}

export function generateAuthResponse(
    userData: UserMetadata,
    deviceId: string | null
): { success: boolean; userId: string; username: string; accessToken: string; refreshToken: string } {
    const tokens = generateTokenPair({
        ...userData,
        deviceId,
        deviceTrusted: true,
    });

    return {
        success: true,
        userId: userData.userId,
        username: userData.username,
        ...tokens,
    };
}

export function createDeviceEntry(deviceId: string, deviceFingerprint: string): DeviceEntry {
    return {
        deviceId,
        fingerprint: deviceFingerprint,
        lastUsed: new Date().toISOString(),
        trusted: true,
    };
}
