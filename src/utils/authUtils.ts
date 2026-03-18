import type { AuthData } from '../types.js';

/**
 * Refreshes the access token using the stored refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
    try {
        const raw = localStorage.getItem('appWMP_auth');
        const authData: AuthData | null = raw ? JSON.parse(raw) : null;
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
    const raw = localStorage.getItem('appWMP_auth');
    const authData: AuthData | null = raw ? JSON.parse(raw) : null;
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
            const data = await response.json();
            if (data.code === 'TOKEN_EXPIRED' && (await refreshAccessToken())) {
                const updatedRaw = localStorage.getItem('appWMP_auth');
                const updatedAuthData: AuthData | null = updatedRaw ? JSON.parse(updatedRaw) : null;
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
    const raw = localStorage.getItem('appWMP_auth');
    const authData: AuthData | null = raw ? JSON.parse(raw) : null;
    if (!authData?.accessToken) {
        throw new Error('No access token available');
    }
    return authData.accessToken;
}
