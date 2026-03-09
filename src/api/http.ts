import { clearAuthState, getAuthToken } from '@/store/authStore';

function toSnake(obj: any): any {
    if (Array.isArray(obj)) return obj.map(toSnake);

    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            result[snakeKey] = toSnake(obj[key]);
            return result;
        }, {} as any);
    }

    return obj;
}

async function extractErrorMessage(response: Response, fallback: string) {
    try {
        const cloned = response.clone();
        const contentType = cloned.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const json = await cloned.json();
            return json?.message || json?.detail || json?.error?.message || fallback;
        }

        const text = (await cloned.text()).trim();
        return text || fallback;
    } catch {
        return fallback;
    }
}

const BASE = '/api/v1';

interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';

        if (options.body && typeof options.body === 'string') {
            try {
                const parsedBody = JSON.parse(options.body);
                options.body = JSON.stringify(toSnake(parsedBody));
            } catch {
                // Ignore invalid JSON strings and send the original body.
            }
        }
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        clearAuthState();

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.replace('/login');
        }

        throw new Error(await extractErrorMessage(response, '登录已失效，请重新登录'));
    }

    if (response.status === 429) {
        throw new Error(await extractErrorMessage(response, '请求过于频繁，请稍后再试'));
    }

    if (response.status >= 500) {
        throw new Error(await extractErrorMessage(response, '服务器繁忙，请稍后再试'));
    }

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || json.code !== 0) {
        throw new Error(json.message || '请求失败');
    }

    return json.data;
}

export const http = {
    get: <T = any>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'GET' }),

    post: <T = any>(url: string, body?: any, options?: RequestInit) =>
        request<T>(url, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        }),

    put: <T = any>(url: string, body?: any, options?: RequestInit) =>
        request<T>(url, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        }),

    delete: <T = any>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: 'DELETE' }),
};
