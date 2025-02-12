// Authentication utility functions for managing tokens and authenticated requests

/**
 * Refreshes the access token using the stored refresh token
 * @returns {Promise<boolean>} Success status of the refresh operation
 */
export async function refreshAccessToken() {
    try {
        // Get current auth data
        const authData = JSON.parse(localStorage.getItem('appWMP_auth'));
        if (!authData?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('/api/auth-token-refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: authData.refreshToken })
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const { accessToken } = await response.json();
        
        // Update localStorage
        const updatedAuthData = {
            ...authData,
            accessToken
        };
        localStorage.setItem('appWMP_auth', JSON.stringify(updatedAuthData));
        
        return true;
    } catch (error) {
        console.error('🔴 Failed to refresh token:', error);
        return false;
    }
}

/**
 * Makes an authenticated fetch request with automatic token refresh
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export async function fetchWithAuth(url, options = {}) {
    // Get the latest tokens from localStorage
    const authData = JSON.parse(localStorage.getItem('appWMP_auth'));
    if (!authData?.accessToken) {
        throw new Error('No access token available');
    }

    // Add authorization header
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${authData.accessToken}`
    };

    try {
        const response = await fetch(url, { ...options, headers });
        
        // If token expired, try to refresh
        if (response.status === 401) {
            const data = await response.json();
            if (data.code === 'TOKEN_EXPIRED' && await refreshAccessToken()) {
                // Get new token from localStorage
                const updatedAuthData = JSON.parse(localStorage.getItem('appWMP_auth'));
                
                // Retry with new token
                headers.Authorization = `Bearer ${updatedAuthData.accessToken}`;
                return fetch(url, { ...options, headers });
            }
        }
        
        return response;
    } catch (error) {
        console.error('🔴 Request failed:', error);
        throw error;
    }
}

export async function getAccessToken() {
    // Get the latest tokens from localStorage
    const authData = JSON.parse(localStorage.getItem('appWMP_auth'));
    if (!authData?.accessToken) {
        throw new Error('No access token available');
    }

    // Get new token from localStorage
    const updatedAuthData = JSON.parse(localStorage.getItem('appWMP_auth'));
    if (!updatedAuthData?.accessToken) {
        throw new Error('No updated access token available');
    }

    return updatedAuthData.accessToken;
} 