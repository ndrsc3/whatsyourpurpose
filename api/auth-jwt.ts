import jwt from 'jsonwebtoken';
import type { JWTPayload } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
    throw new Error('Missing required JWT environment variables');
}

interface JwtError extends Error {
    code: string;
    statusCode: number;
}

export function generateAccessToken(
    user: Omit<JWTPayload, 'lastActive'> & { deviceId: string | null; deviceTrusted: boolean }
): string {
    return jwt.sign(
        {
            userId: user.userId,
            username: user.username,
            deviceId: user.deviceId,
            deviceTrusted: user.deviceTrusted,
            currentStreak: user.currentStreak ?? 0,
            lastActive: new Date().toISOString(),
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

export function generateRefreshToken(user: { userId: string; deviceId: string | null }): string {
    return jwt.sign(
        {
            userId: user.userId,
            deviceId: user.deviceId,
        },
        REFRESH_SECRET,
        { expiresIn: '30d' }
    );
}

export function verifyAccessToken(token: string): JWTPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        if ((error as Error & { name: string }).name === 'TokenExpiredError') {
            const err = new Error('Token expired') as JwtError;
            err.code = 'TOKEN_EXPIRED';
            err.statusCode = 401;
            throw err;
        }
        const err = new Error('Invalid token') as JwtError;
        err.code = 'TOKEN_INVALID';
        err.statusCode = 401;
        throw err;
    }
}

export function verifyRefreshToken(token: string): { userId: string; deviceId: string } {
    try {
        return jwt.verify(token, REFRESH_SECRET) as { userId: string; deviceId: string };
    } catch {
        throw new Error('Invalid refresh token');
    }
}

export function generateTokenPair(
    user: Omit<JWTPayload, 'lastActive'> & { deviceId: string | null; deviceTrusted: boolean }
): { accessToken: string; refreshToken: string } {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    };
}
