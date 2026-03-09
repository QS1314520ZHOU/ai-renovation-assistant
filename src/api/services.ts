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

import { BudgetResult, BudgetScheme } from '@/types';

export const budgetApi = {
    calculate: (data: {
        project_id?: string;
        city_code?: string;
        city_name?: string;
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
    session_type: string;
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

    upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return http.post<{ url: string }>('/ai/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    inspect: (data: { phase: string, items: string, file: File }) => {
        const formData = new FormData();
        formData.append('phase', data.phase);
        formData.append('items', data.items);
        formData.append('file', data.file);
        return http.post<{ reply: string }>('/ai/inspect', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// ---- AI 效果图 ----
export interface DesignOption {
    label: string;
    value: string;
}

export interface DesignGenerateResult {
    source_image_url: string;
    generated_image_url: string;
    style: string;
    room_type: string;
    provider: string;
    is_mock: boolean;
    note?: string;
    prompt?: string;
    control_mode: string;
    strength: number;
    seed?: number;
    preferences: Record<string, any>;
}

export const designApi = {
    getOptions: () =>
        http.get<{ styles: DesignOption[]; room_types: DesignOption[] }>('/design/styles'),

    generate: (data: {
        file: File;
        style: string;
        room_type: string;
        preferences?: Record<string, any>;
        control_mode?: 'none' | 'canny' | 'depth' | 'mlsd';
        strength?: number;
        seed?: number;
    }) => {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('style', data.style);
        formData.append('room_type', data.room_type);
        if (data.preferences) {
            formData.append('preferences', JSON.stringify(data.preferences));
        }
        if (data.control_mode) {
            formData.append('control_mode', data.control_mode);
        }
        if (typeof data.strength === 'number') {
            formData.append('strength', String(data.strength));
        }
        if (typeof data.seed === 'number') {
            formData.append('seed', String(data.seed));
        }
        return http.post<DesignGenerateResult>('/design/generate', formData);
    },
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
    bootstrap: (projectId: string, data: any) =>
        http.post<any>(`/construction/${projectId}/bootstrap`, data),

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
        http.get<any[]>(`/construction/${projectId}/payments`),

    getChecklists: (projectId: string) =>
        http.get<any[]>(`/construction/${projectId}/checklists`),

    updateChecklist: (projectId: string, data: any) =>
        http.put<any>(`/construction/${projectId}/checklists`, data),

    getPurchases: (projectId: string) =>
        http.get<any[]>(`/construction/${projectId}/purchases`),

    updatePurchase: (projectId: string, data: any) =>
        http.put<any>(`/construction/${projectId}/purchases`, data),
};

// ---- 报价体检 ----
export const quoteApi = {
    upload: (projectId: string, file: File) => {
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('file', file);
        return http.post<any>('/quotes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    checkText: (projectId: string, text: string) =>
        http.post<any>('/quotes/check-text', { project_id: projectId, text }),

    getReport: (quoteId: string) =>
        http.get<any>(`/quotes/${quoteId}/report`),
};

// ---- 合同体检 ----
export const contractApi = {
    upload: (projectId: string, file: File) => {
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('file', file);
        return http.post<any>('/contracts/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    checkText: (projectId: string, text: string) =>
        http.post<any>('/contracts/text', { project_id: projectId, text }),

    getReport: (reportId: string) =>
        http.get<any>(`/contracts/report/${reportId}`),
};

// ---- 材料推荐 ----
export const materialApi = {
    getRecommendation: (projectId: string, itemId: string, totalBudget: number) => {
        const params = new URLSearchParams({
            project_id: projectId,
            item_id: itemId,
            total_budget: totalBudget.toString()
        });
        return http.get<any>(`/materials/recommendation?${params.toString()}`);
    }
};

// ---- 系统配置 ----
export const configApi = {
    get: () => http.get<any[]>('/config/'),
    update: (key: string, value: any, description?: string) =>
        http.post<any>('/config/', { key, value, description }),
};
