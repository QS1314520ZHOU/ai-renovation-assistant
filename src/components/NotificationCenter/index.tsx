import React from 'react';
import { Popup, List, Badge, Button } from 'antd-mobile';
import { CheckCircleOutline, ExclamationTriangleOutline, CloseCircleOutline, InformationCircleOutline } from 'antd-mobile-icons';
import { useNotificationStore } from '@/store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { AppNotification } from '@/types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface NotificationCenterProps {
    visible: boolean;
    onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ visible, onClose }) => {
    const { notifications, markAsRead, clearAll } = useNotificationStore();
    const unreadCount = notifications.filter((item: AppNotification) => !item.read).length;

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'success': return <CheckCircleOutline style={{ color: '#10B981' }} />;
            case 'warning': return <ExclamationTriangleOutline style={{ color: '#F59E0B' }} />;
            case 'error': return <CloseCircleOutline style={{ color: '#EF4444' }} />;
            default: return <InformationCircleOutline style={{ color: '#3B82F6' }} />;
        }
    };

    return (
        <Popup visible={visible} onMaskClick={onClose} bodyStyle={{ height: '72vh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="page-topbar" style={{ borderRadius: 0, boxShadow: 'none', padding: '18px 18px 14px' }}>
                <div>
                    <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>消息中心</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>通知</div>
                        {unreadCount > 0 && <Badge content={unreadCount} />}
                    </div>
                </div>
                <Button size="small" fill="none" onClick={clearAll}>清空全部</Button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
                {notifications.length === 0 ? (
                    <div className="empty-card" style={{ marginTop: 20 }}>
                        <div className="empty-title">暂时没有通知</div>
                        <div className="empty-desc">系统提醒、预算完成和施工节点消息会出现在这里。</div>
                    </div>
                ) : (
                    <List>
                        {notifications.map((item: AppNotification) => (
                            <List.Item
                                key={item.id}
                                prefix={getIcon(item.type)}
                                extra={<div style={{ fontSize: 11, color: 'var(--color-text-light)' }}>{dayjs(item.createdAt).fromNow()}</div>}
                                description={item.content}
                                onClick={() => markAsRead(item.id)}
                                style={{ '--prefix-width': '24px', '--padding-left': '16px', background: item.read ? 'rgba(255, 255, 255, 0.72)' : 'rgba(238, 242, 255, 0.88)' } as React.CSSProperties}
                            >
                                <div style={{ fontSize: 14, fontWeight: item.read ? 600 : 700, color: 'var(--color-text)' }}>{item.title}</div>
                            </List.Item>
                        ))}
                    </List>
                )}
            </div>

            <div style={{ padding: '12px 16px 16px' }}>
                <Button block color="primary" shape="rounded" onClick={onClose}>我知道了</Button>
            </div>
        </Popup>
    );
};