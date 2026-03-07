import React from 'react';
import { Popup, List, Badge, Button, Empty } from 'antd-mobile';
import { BellOutline, CheckCircleOutline, ExclamationTriangleOutline, CloseCircleOutline, InformationCircleOutline } from 'antd-mobile-icons';
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
    const unreadCount = notifications.filter((n: AppNotification) => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircleOutline style={{ color: '#10B981' }} />;
            case 'warning': return <ExclamationTriangleOutline style={{ color: '#F59E0B' }} />;
            case 'error': return <CloseCircleOutline style={{ color: '#EF4444' }} />;
            default: return <InformationCircleOutline style={{ color: '#3B82F6' }} />;
        }
    };

    return (
        <Popup
            visible={visible}
            onMaskClick={onClose}
            bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '70vh', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ padding: '16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>通知中心 {unreadCount > 0 && <Badge content={unreadCount} style={{ marginLeft: 4 }} />}</div>
                <Button size="mini" fill="none" onClick={clearAll} style={{ fontSize: 12, color: '#9CA3AF' }}>清除全部</Button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <Empty description="暂无新消息" style={{ marginTop: 60 }} />
                ) : (
                    <List>
                        {notifications.map((n: AppNotification) => (
                            <List.Item
                                key={n.id}
                                prefix={getIcon(n.type)}
                                extra={<div style={{ fontSize: 11, color: '#9CA3AF' }}>{dayjs(n.createdAt).fromNow()}</div>}
                                description={n.content}
                                onClick={() => markAsRead(n.id)}
                                style={{
                                    '--prefix-width': '24px',
                                    '--padding-left': '16px',
                                    background: n.read ? 'transparent' : '#F0FDF4',
                                } as any}
                            >
                                <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                            </List.Item>
                        ))}
                    </List>
                )}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid #F3F4F6' }}>
                <Button block onClick={onClose}>关闭</Button>
            </div>
        </Popup>
    );
};
