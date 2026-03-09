// src/store/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    userId: string | null;
    nickname: string | null;
    role: string | null;
    isLoggedIn: boolean;

    setAuth: (token: string, userId: string, nickname: string | null, role: string | null) => void;
    logout: () => void;
}

const AUTH_STORAGE_KEY = 'renovation-auth';

const DEFAULT_AUTH_STATE = {
    token: null,
    userId: null,
    nickname: null,
    role: null,
    isLoggedIn: false,
};

export function getAuthToken(): string | null {
    const storeToken = useAuthStore.getState().token;
    if (storeToken) {
        return storeToken;
    }

    if (typeof window === 'undefined') {
        return null;
    }

    return localStorage.getItem('token');
}

export function clearAuthState() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    useAuthStore.setState(DEFAULT_AUTH_STATE);
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            ...DEFAULT_AUTH_STATE,

            setAuth: (token, userId, nickname, role) => {
                localStorage.setItem('token', token);
                set({ token, userId, nickname, role, isLoggedIn: true });
            },

            logout: () => {
                clearAuthState();
            },
        }),
        { name: AUTH_STORAGE_KEY }
    )
);
