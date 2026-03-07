import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import {
    AppOutline,
    CalculatorOutline,
    InformationCircleOutline,
    CheckShieldOutline,
    SetOutline,
    BellOutline,
} from 'antd-mobile-icons';
import { useAuthStore, useNotificationStore } from '@/store';
import { Badge, Button } from 'antd-mobile';
import { NotificationCenter } from '@/components/NotificationCenter';

const allTabs = [
    { key: '/', title: '首页', icon: <AppOutline /> },
    { key: '/ai-consult', title: 'AI问诊', icon: <CalculatorOutline /> },
    { key: '/construction', title: '施工陪跑', icon: <CheckShieldOutline /> },
    { key: '/glossary', title: '装修词典', icon: <InformationCircleOutline /> },
    { key: '/settings', title: '设置', icon: <SetOutline />, isAdmin: true },
];

export default function AppLayout({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const { notifications } = useNotificationStore();
    const [showNotify, setShowNotify] = React.useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    // 根据角色过滤 Tab
    const tabs = allTabs.filter(tab => !tab.isAdmin || role === 'admin');

    // 匹配当前 tab
    const activeKey = tabs.find(t => t.key !== '/' && location.pathname.startsWith(t.key))?.key
        || (location.pathname === '/' ? '/' : '');

    // 这些子页面不显示 TabBar
    const hideTabBar = [
        '/budget-result', '/missing-check', '/quick-budget', '/quote-check',
        '/construction/checklist', '/construction/purchases',
        '/construction/log', '/construction/payments', '/construction/post',
    ].some(path => location.pathname.startsWith(path));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
            <div style={{ flex: 1, overflow: 'auto', paddingBottom: hideTabBar ? 0 : 50 }}>
                {children || <Outlet />}
            </div>

            {/* 通知铃铛 */}
            {!hideTabBar && (
                <div style={{
                    position: 'fixed',
                    right: 16,
                    bottom: 70,
                    zIndex: 99,
                }}>
                    <Badge content={unreadCount > 0 ? unreadCount : null}>
                        <div
                            onClick={() => setShowNotify(true)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                color: 'var(--color-primary)',
                                fontSize: 24
                            }}
                        >
                            <BellOutline />
                        </div>
                    </Badge>
                </div>
            )}

            <NotificationCenter visible={showNotify} onClose={() => setShowNotify(false)} />
            {!hideTabBar && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: '#fff',
                    borderTop: '1px solid var(--color-border)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    zIndex: 100,
                }}>
                    <TabBar
                        activeKey={activeKey}
                        onChange={(key) => navigate(key)}
                        style={{ '--adm-tab-bar-active-color': 'var(--color-primary)' } as any}
                    >
                        {tabs.map(tab => (
                            <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
                        ))}
                    </TabBar>
                </div>
            )}
        </div>
    );
}
