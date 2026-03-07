// src/components/RoleGuard.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Toast } from 'antd-mobile';

interface RoleGuardProps {
    children: React.ReactElement;
    requiredRole: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, requiredRole }) => {
    const { isLoggedIn, role } = useAuthStore();

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (role !== requiredRole) {
        Toast.show({ content: '权限不足，无法访问此页面', icon: 'fail' });
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleGuard;
