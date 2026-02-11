/**
 * Token Refresh Utility
 * Automatically refreshes access token when it expires
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Get access token from storage
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
};

/**
 * Get refresh token from storage
 */
export const getRefreshToken = (): string | null => {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

/**
 * Save new access token to storage
 */
const saveAccessToken = (token: string) => {
    if (localStorage.getItem('accessToken')) {
        localStorage.setItem('accessToken', token);
    } else if (sessionStorage.getItem('accessToken')) {
        sessionStorage.setItem('accessToken', token);
    }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        console.error('No refresh token found');
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/api/v1/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        const newAccessToken = data.data?.accessToken || data.accessToken;

        if (newAccessToken) {
            saveAccessToken(newAccessToken);
            console.log('Access token refreshed successfully');
            return newAccessToken;
        }

        return null;
    } catch (error) {
        console.error('Error refreshing token:', error);
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return null;
    }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = getAccessToken();

    if (!token) {
        throw new Error('No access token available');
    }

    // Check if body is FormData (for file uploads)
    const isFormData = options.body instanceof FormData;

    // Add authorization header
    const headers: Record<string, string> = {
        ...options.headers as Record<string, string>,
        'Authorization': `Bearer ${token}`,
    };

    // Only add Content-Type for JSON requests, not for FormData
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    // Make initial request
    let response = await fetch(url, { ...options, headers });

    // If unauthorized (401), try to refresh token
    if (response.status === 401) {
        console.log('Access token expired, attempting to refresh...');

        const newToken = await refreshAccessToken();

        if (newToken) {
            // Retry request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers });
        } else {
            throw new Error('Failed to refresh token');
        }
    }

    return response;
};

/**
 * Check if token is expired (decode JWT and check exp)
 * This is a simple check - for production, use a JWT library
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= exp;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
};
