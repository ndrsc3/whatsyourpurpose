import type { VercelRequest } from '@vercel/node';

export interface JWTPayload {
    userId: string;
    username: string;
    deviceId: string | null;
    deviceTrusted: boolean;
    currentStreak?: number;
    lastActive: string;
}

export interface DeviceEntry {
    deviceId: string;
    fingerprint: string;
    lastUsed: string;
    trusted: boolean;
}

export interface UserMetadata {
    userId: string;
    username: string;
    lastActive: string;
    joinDate: string;
    recoveryHash: string;
    devices: DeviceEntry[];
}

export interface PurposeData {
    userId: string;
    statement: string;
    updatedAt: string;
}

export interface AuthenticatedRequest extends VercelRequest {
    user: JWTPayload;
}
