import crypto from 'crypto';
import { generateTokenPair } from './jwt.js';

// Shared function for hashing recovery answers
export function hashAnswer(answer) {
    const normalizedAnswer = answer.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalizedAnswer).digest('hex');
}

// Shared function for generating auth response
export function generateAuthResponse(userData, deviceId) {
    const tokens = generateTokenPair({
        ...userData,
        deviceId,
        deviceTrusted: true
    });

    return { 
        success: true,
        userId: userData.userId,
        username: userData.username,
        ...tokens
    };
}

// Shared function for creating new device entry
export function createDeviceEntry(deviceId, deviceFingerprint) {
    return {
        deviceId,
        fingerprint: deviceFingerprint,
        lastUsed: new Date(),
        trusted: true
    };
} 