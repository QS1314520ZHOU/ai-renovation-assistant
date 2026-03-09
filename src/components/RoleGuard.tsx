// src/components/RoleGuard.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken, useAuthStore } from '@/store/authStore';

interface RoleGuardProps {
    children: React.ReactElement;
    requiredRole: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, requiredRole }) => {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const role = useAuthStore((s) => s.role);
    const token = useAuthStore((s) => s.token);
    const activeToken = token ?? getAuthToken();

    if (!isLoggedIn || !activeToken) {
        return <Navigate to="/login" replace />;
    }

    if (role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleGuard;
