import {create} from 'zustand';

import {notificationService} from '../services/notificationService';
import type {Notification} from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  stopAutoRefresh: () => void;
  clear: () => void;
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

const ensureAutoRefresh = () => {
  if (!refreshInterval) {
    refreshInterval = setInterval(() => {
      void useNotificationStore.getState().refresh();
    }, 60000);
  }
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  initialized: false,
  initialize: async () => {
    if (get().initialized) {
      ensureAutoRefresh();
      return;
    }

    await get().refresh();
    set({initialized: true});
    ensureAutoRefresh();
  },
  refresh: async () => {
    set({loading: true});
    try {
      const [notifications, unreadCount] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      set({notifications, unreadCount});
    } finally {
      set({loading: false});
    }
  },
  markRead: async notificationId => {
    await notificationService.markRead(notificationId);
    await get().refresh();
  },
  markAllRead: async () => {
    await notificationService.markAllRead();
    await get().refresh();
  },
  stopAutoRefresh: () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  },
  clear: () => {
    get().stopAutoRefresh();
    set({notifications: [], unreadCount: 0, initialized: false, loading: false});
  },
}));
