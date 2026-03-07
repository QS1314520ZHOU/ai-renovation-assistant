// src/components/AuthGuard.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
    children: React.ReactNode;
}

const AuthGuard: React.FC<Props> = ({ children }) => {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
