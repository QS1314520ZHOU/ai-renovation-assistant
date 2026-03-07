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

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            userId: null,
            nickname: null,
            role: null,
            isLoggedIn: false,

            setAuth: (token, userId, nickname, role) => {
                localStorage.setItem('token', token);
                set({ token, userId, nickname, role, isLoggedIn: true });
            },

            logout: () => {
                localStorage.removeItem('token');
                set({ token: null, userId: null, nickname: null, role: null, isLoggedIn: false });
            },
        }),
        { name: 'renovation-auth' }
    )
);
