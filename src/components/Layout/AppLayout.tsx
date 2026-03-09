import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar, Badge } from 'antd-mobile';
import {
    AppOutline,
    CalculatorOutline,
    InformationCircleOutline,
    CheckShieldOutline,
    SetOutline,
    BellOutline,
} from 'antd-mobile-icons';

import { useAuthStore, useNotificationStore } from '@/store';
import { NotificationCenter } from '@/components/NotificationCenter';

const allTabs = [
    { key: '/', title: '首页', icon: <AppOutline /> },
    { key: '/ai-consult', title: 'AI咨询', icon: <CalculatorOutline /> },
    { key: '/construction', title: '施工跟踪', icon: <CheckShieldOutline /> },
    { key: '/glossary', title: '术语百科', icon: <InformationCircleOutline /> },
    { key: '/settings', title: '设置', icon: <SetOutline />, isAdmin: true },
];

const HIDE_TABBAR_PATHS = [
    '/budget-result',
    '/missing-check',
    '/quick-budget',
    '/quote-check',
    '/style-quiz',
    '/inspiration',
    '/ai-design',
    '/ar-preview',
    '/vr-tour',
    '/construction/checklist',
    '/construction/purchases',
    '/construction/log',
    '/construction/payments',
    '/construction/post',
];

export default function AppLayout({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const { notifications } = useNotificationStore();
    const [showNotify, setShowNotify] = React.useState(false);

    const unreadCount = notifications.filter((item) => !item.read).length;
    const tabs = allTabs.filter((tab) => !tab.isAdmin || role === 'admin');

    const activeKey = tabs.find((tab) => tab.key !== '/' && location.pathname.startsWith(tab.key))?.key
        || (location.pathname === '/' ? '/' : '');

    const hideTabBar = HIDE_TABBAR_PATHS.some((path) => location.pathname.startsWith(path));

    return (
        <div className="app-shell">
            <div className={`app-content ${hideTabBar ? '' : 'app-content--with-tabbar'}`}>
                {children || <Outlet />}
            </div>

            {!hideTabBar && (
                <div className="app-fab-shell">
                    <Badge content={unreadCount > 0 ? unreadCount : null}>
                        <div className="app-fab" onClick={() => setShowNotify(true)}>
                            <BellOutline />
                        </div>
                    </Badge>
                </div>
            )}

            <NotificationCenter visible={showNotify} onClose={() => setShowNotify(false)} />

            {!hideTabBar && (
                <div className="app-tabbar-shell">
                    <TabBar
                        activeKey={activeKey}
                        onChange={(key) => navigate(key)}
                        style={{ '--adm-tab-bar-active-color': 'var(--color-primary)' } as any}
                    >
                        {tabs.map((tab) => (
                            <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
                        ))}
                    </TabBar>
                </div>
            )}
        </div>
    );
}
