// src/api/http.ts

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
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
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

    return json.data;
}

export const http = {
    get: <T = any>(url: string) => request<T>(url),

    post: <T = any>(url: string, body?: any) =>
        request<T>(url, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T = any>(url: string, body?: any) =>
        request<T>(url, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T = any>(url: string) =>
        request<T>(url, { method: 'DELETE' }),
};
