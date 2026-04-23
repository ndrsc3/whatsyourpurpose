import type { AuthData } from '../types.js';

function isAuthData(value: unknown): value is AuthData {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.accessToken === 'string' &&
        typeof v.refreshToken === 'string' &&
        typeof v.userId === 'string' &&
        typeof v.username === 'string'
    );
}

function loadAuthData(): AuthData | null {
    const raw = localStorage.getItem('appWMP_auth');
    if (!raw) return null;
    try {
        const parsed: unknown = JSON.parse(raw);
        return isAuthData(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * Refreshes the access token using the stored refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
    try {
        const authData = loadAuthData();
        if (!authData?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('/api/auth-token-refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: authData.refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const { accessToken } = await response.json();

        const updatedAuthData: AuthData = { ...authData, accessToken };
        localStorage.setItem('appWMP_auth', JSON.stringify(updatedAuthData));

        return true;
    } catch (error) {
        console.error('🔴 Failed to refresh token:', error);
        return false;
    }
}

/**
 * Makes an authenticated fetch request with automatic token refresh
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const authData = loadAuthData();
    if (!authData?.accessToken) {
        throw new Error('No access token available');
    }

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${authData.accessToken}`,
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            let code: string | undefined;
            try {
                const data = await response.clone().json();
                code = typeof data?.code === 'string' ? data.code : undefined;
            } catch {
                // Non-JSON 401 (e.g. proxy error page) — treat as non-TOKEN_EXPIRED
                // and fall through to return the original response.
            }
            if (code === 'TOKEN_EXPIRED' && (await refreshAccessToken())) {
                const updatedAuthData = loadAuthData();
                if (updatedAuthData) {
                    headers.Authorization = `Bearer ${updatedAuthData.accessToken}`;
                }
                return fetch(url, { ...options, headers });
            }
        }

        return response;
    } catch (error) {
        console.error('🔴 Request failed:', error);
        throw error;
    }
}

export async function getAccessToken(): Promise<string> {
    const authData = loadAuthData();
    if (!authData?.accessToken) {
        throw new Error('No access token available');
    }
    return authData.accessToken;
}
