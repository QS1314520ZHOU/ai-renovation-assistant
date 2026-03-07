// src/api/http.ts

function toCamel(obj: any): any {
    if (Array.isArray(obj)) return obj.map(toCamel);
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
            result[camelKey] = toCamel(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
}

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

const BASE = '/api/v1';

interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

async function request<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    // 如果不是 FormData，则设置 JSON Content-Type 并转换 body 为 snake_case
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        if (options.body && typeof options.body === 'string') {
            try {
                const parsedBody = JSON.parse(options.body);
                options.body = JSON.stringify(toSnake(parsedBody));
            } catch (e) { /* ignore */ }
        }
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${url}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('未登录');
    }

    const json: ApiResponse<T> = await res.json();

    if (!res.ok || json.code !== 0) {
        throw new Error(json.message || '请求失败');
    }

    return toCamel(json.data);
}

export const http = {
    get: <T = any>(url: string, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'GET' }),

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

    delete: <T = any>(url: string, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'DELETE' }),
};
