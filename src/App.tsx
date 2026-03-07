// src/App.tsx

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loading } from 'antd-mobile';
import AuthGuard from '@/components/AuthGuard';
import RoleGuard from '@/components/RoleGuard';
import AppLayout from '@/components/Layout/AppLayout';

const Login = lazy(() => import('@/pages/Login'));
const Home = lazy(() => import('@/pages/Home'));
const AIConsult = lazy(() => import('@/pages/AIConsult'));
const QuickBudget = lazy(() => import('@/pages/QuickBudget'));
const BudgetResult = lazy(() => import('@/pages/BudgetResult'));
const MissingCheck = lazy(() => import('@/pages/MissingCheck'));
const Glossary = lazy(() => import('@/pages/Glossary'));
const MyProject = lazy(() => import('@/pages/MyProject'));
const Settings = lazy(() => import('@/pages/Settings'));
const QuoteCheck = lazy(() => import('@/pages/QuoteCheck'));
const Construction = lazy(() => import('@/pages/Construction'));
const Checklist = lazy(() => import('@/pages/Construction/Checklist'));
const Purchases = lazy(() => import('@/pages/Construction/Purchases'));
const ConstructionLog = lazy(() => import('@/pages/Construction/ConstructionLog'));
const Payments = lazy(() => import('@/pages/Construction/Payments'));
const PostRenovation = lazy(() => import('@/pages/Construction/PostRenovation'));

const Fallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loading color="primary" />
    </div>
);

// 带 Layout 的受保护页面
const ProtectedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthGuard>
        <AppLayout>{children}</AppLayout>
    </AuthGuard>
);

// 管理员页面
const AdminPage: React.FC<{ children: React.ReactElement }> = ({ children }) => (
    <RoleGuard requiredRole="admin">
        <AppLayout>{children}</AppLayout>
    </RoleGuard>
);

const App: React.FC = () => {
    return (
        <Suspense fallback={<Fallback />}>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={<ProtectedPage><Home /></ProtectedPage>} />
                <Route path="/ai-consult" element={<ProtectedPage><AIConsult /></ProtectedPage>} />
                <Route path="/quick-budget" element={<ProtectedPage><QuickBudget /></ProtectedPage>} />
                <Route path="/budget-result" element={<ProtectedPage><BudgetResult /></ProtectedPage>} />
                <Route path="/missing-check" element={<ProtectedPage><MissingCheck /></ProtectedPage>} />
                <Route path="/glossary" element={<ProtectedPage><Glossary /></ProtectedPage>} />
                <Route path="/my-project" element={<ProtectedPage><MyProject /></ProtectedPage>} />
                <Route path="/settings" element={<AdminPage><Settings /></AdminPage>} />
                <Route path="/quote-check" element={<ProtectedPage><QuoteCheck /></ProtectedPage>} />
                <Route path="/construction" element={<ProtectedPage><Construction /></ProtectedPage>} />
                <Route path="/construction/checklist" element={<ProtectedPage><Checklist /></ProtectedPage>} />
                <Route path="/construction/purchases" element={<ProtectedPage><Purchases /></ProtectedPage>} />
                <Route path="/construction/log" element={<ProtectedPage><ConstructionLog /></ProtectedPage>} />
                <Route path="/construction/payments" element={<ProtectedPage><Payments /></ProtectedPage>} />
                <Route path="/construction/post" element={<ProtectedPage><PostRenovation /></ProtectedPage>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default App;
