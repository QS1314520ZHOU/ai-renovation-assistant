// src/api/services.ts

import { http } from './http';

// ---- 认证 ----
export interface LoginResult {
    access_token: string;
    token_type: string;
    user_id: string;
    nickname: string | null;
    role: string | null;
}

export const authApi = {
    register: (phone: string, password: string, nickname?: string) =>
        http.post<LoginResult>('/auth/register', { phone, password, nickname }),

    login: (phone: string, password: string) =>
        http.post<LoginResult>('/auth/login', { phone, password }),
};

// ---- 项目 ----
export interface Project {
    id: string;
    name: string;
    status: string;
    city_code: string;
    city_name: string | null;
    target_budget: number | null;
    actual_spent: number;
    start_date: string | null;
    current_phase: string | null;
}

export const projectApi = {
    list: () => http.get<Project[]>('/projects/'),

    create: (data: {
        name: string;
        city_code: string;
        city_name?: string;
        target_budget?: number;
    }) => http.post<Project>('/projects/', data),

    get: (id: string) => http.get<Project>(`/projects/${id}`),

    update: (id: string, data: Record<string, any>) =>
        http.put<Project>(`/projects/${id}`, data),

    delete: (id: string) => http.delete(`/projects/${id}`),
};

// ---- 房屋 ----
export interface House {
    id: string;
    project_id: string;
    building_area: number | null;
    inner_area: number | null;
    layout_type: string | null;
    tier_preference: string;
    floor_preference: string;
    bathroom_count: number;
    special_needs: string[];
}

export const houseApi = {
    create: (projectId: string, data: any) =>
        http.post<House>(`/houses/${projectId}`, data),

    get: (projectId: string) => http.get<House>(`/houses/${projectId}`),
};

// ---- 预算 ----
export interface BudgetScheme {
    id: string;
    tier: string;
    total_amount: number | null;
    material_amount: number | null;
    labor_amount: number | null;
    management_fee: number | null;
    contingency: number | null;
    ai_explanation: string | null;
    items: BudgetItem[];
}

export interface BudgetItem {
    id: string;
    category: string;
    item_name: string;
    quantity: number | null;
    unit: string | null;
    material_unit_price: number | null;
    labor_unit_price: number | null;
    subtotal: number | null;
    is_user_modified: boolean;
    data_source: string | null;
}

export interface BudgetResult {
    project_id: string;
    schemes: BudgetScheme[];
    missing_items: any[];
    suggestions: string[];
}

export const budgetApi = {
    calculate: (data: {
        project_id: string;
        city_code: string;
        inner_area: number;
        layout_type: string;
        tier?: string;
        floor_preference?: string;
        bathroom_count?: number;
        special_needs?: string[];
    }) => http.post<BudgetResult>('/budgets/calculate', data),

    getSchemes: (projectId: string) =>
        http.get<BudgetScheme[]>(`/budgets/${projectId}/schemes`),
};

// ---- AI 问诊 ----
export interface AIChatResult {
    session_id: string;
    reply: string;
    extracted_fields: Record<string, any> | null;
    is_complete: boolean;
    missing_fields: string[];
}

export const aiApi = {
    chat: (data: {
        session_id?: string;
        project_id?: string;
        message: string;
        session_type?: string;
    }) => http.post<AIChatResult>('/ai/chat', data),
};

// ---- 词典 ----
export const glossaryApi = {
    list: (keyword?: string, category?: string) => {
        const params = new URLSearchParams();
        if (keyword) params.set('keyword', keyword);
        if (category) params.set('category', category);
        const qs = params.toString();
        return http.get<any[]>(`/glossary/${qs ? '?' + qs : ''}`);
    },
};

// ---- 施工 ----
export const constructionApi = {
    getPhases: (projectId: string) =>
        http.get<any[]>(`/construction/${projectId}/phases`),

    updatePhase: (projectId: string, data: any) =>
        http.put(`/construction/${projectId}/phases`, data),

    addLog: (projectId: string, data: any) =>
        http.post(`/construction/${projectId}/logs`, data),

    getLogs: (projectId: string) =>
        http.get<any[]>(`/construction/${projectId}/logs`),

    addPayment: (projectId: string, data: any) =>
        http.post(`/construction/${projectId}/payments`, data),

    getPayments: (projectId: string) =>
        http.get<any[]>(`/payments/${projectId}`),
};

// ---- 系统配置 ----
export const configApi = {
    get: () => http.get<any[]>('/config/'),
    update: (key: string, value: any, description?: string) =>
        http.post<any>('/config/', { key, value, description }),
};
