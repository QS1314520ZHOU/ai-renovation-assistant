// src/components/AuthGuard.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken, useAuthStore } from '@/store/authStore';

interface Props {
    children: React.ReactNode;
}

const AuthGuard: React.FC<Props> = ({ children }) => {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const token = useAuthStore((s) => s.token);
    const activeToken = token ?? getAuthToken();

    if (!isLoggedIn || !activeToken) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
