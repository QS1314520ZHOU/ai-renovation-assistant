import { create } from 'zustand';
import { AppNotification } from '@/types';

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    addNotification: (notification) => set((state) => ({
        notifications: [
            {
                ...notification,
                id: crypto.randomUUID(),
                read: false,
                createdAt: new Date().toISOString(),
            },
            ...state.notifications,
        ],
    })),
    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
        ),
    })),
    clearAll: () => set({ notifications: [] }),
}));
