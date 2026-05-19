/**
 * Token Refresh Utility
 * Automatically refreshes access token when it expires
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ─── Timeout & Retry config ────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 15_000; // Chờ tối đa 15 giây mỗi request
const FETCH_MAX_RETRIES = 2;     // Tự động thử lại tối đa 2 lần (chỉ GET)

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Thực hiện 1 lần fetch với giới hạn thời gian chờ (timeout).
 * Nếu quá FETCH_TIMEOUT_MS sẽ hủy request và ném lỗi rõ ràng.
 */
async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error('Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối và thử lại.');
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

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
    const token = getAccessToken();
    if (!token) throw new Error('No access token available');

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
        ...options.headers as Record<string, string>,
        'Authorization': `Bearer ${token}`,
    };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    // GET requests được retry; POST/PUT/DELETE không retry để tránh tạo dữ liệu trùng
    const method = (options.method || 'GET').toUpperCase();
    const canRetry = method === 'GET';
    const maxAttempts = canRetry ? FETCH_MAX_RETRIES + 1 : 1;

    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Chờ trước khi thử lại: lần 1 chờ 1s, lần 2 chờ 2s
        if (attempt > 0) {
            await sleep(1000 * attempt);
            console.warn(`[fetchWithAuth] Retry lần ${attempt}/${FETCH_MAX_RETRIES}: ${method} ${url}`);
        }

        try {
            let response = await fetchWithTimeout(url, { ...options, headers });

            // 401 → thử refresh token và gọi lại 1 lần (không tính vào retry)
            if (response.status === 401) {
                console.log('Access token expired, attempting to refresh...');
                const newToken = await refreshAccessToken();
                if (newToken) {
                    headers['Authorization'] = `Bearer ${newToken}`;
                    response = await fetchWithTimeout(url, { ...options, headers });
                } else {
                    throw new Error('Failed to refresh token');
                }
            }

            // 503/504 → server tạm thời bận, retry nếu được phép
            if (canRetry && (response.status === 503 || response.status === 504) && attempt < maxAttempts - 1) {
                lastError = new Error(`Máy chủ tạm thời bận (${response.status}), đang thử lại...`);
                continue;
            }

            return response;
        } catch (err) {
            lastError = err;

            const isTimeoutError = err instanceof Error && err.message.includes('quá thời gian');
            const isNetworkError = err instanceof TypeError && err.message.includes('fetch');

            // Chỉ retry khi là lỗi timeout hoặc mất mạng
            if (!canRetry || (!isTimeoutError && !isNetworkError) || attempt >= maxAttempts - 1) {
                throw err;
            }
        }
    }

    throw lastError;
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
