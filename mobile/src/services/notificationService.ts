import AsyncStorage from '@react-native-async-storage/async-storage';

import {api} from './api';
import type {DeviceToken, Notification} from '../types';

const NOTIFICATIONS_KEY = '@aitriage/notifications';
const DEVICE_TOKENS_KEY = '@aitriage/device-tokens';

const isoOffset = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

const seedNotifications = (): Notification[] => ([
  {
    id: 'notification-1',
    type: 'consultation',
    title: 'Consultation confirmed',
    body: 'Your video consultation has been booked and is ready to join when it starts.',
    createdAt: isoOffset(1),
    isRead: false,
  },
  {
    id: 'notification-2',
    type: 'prescription',
    title: 'Prescription update pending',
    body: 'Your doctor will upload the prescription shortly after the consultation.',
    createdAt: isoOffset(6),
    isRead: false,
  },
  {
    id: 'notification-3',
    type: 'subscription',
    title: 'Premium support reminder',
    body: 'Upgrade anytime to unlock faster consultations and priority follow-ups.',
    createdAt: isoOffset(30),
    isRead: true,
    readAt: isoOffset(4),
  },
]);

const mapNotification = (raw: Record<string, unknown>): Notification => ({
  id: String(raw.id ?? raw.notification_id ?? Date.now()),
  type: String(raw.type ?? 'system') as Notification['type'],
  title: String(raw.title ?? raw.heading ?? 'Notification'),
  body: String(raw.body ?? raw.message ?? ''),
  createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
  isRead: Boolean(raw.is_read ?? raw.isRead ?? raw.read_at ?? raw.readAt),
  readAt:
    typeof raw.read_at === 'string'
      ? raw.read_at
      : typeof raw.readAt === 'string'
        ? raw.readAt
        : undefined,
});

const readNotifications = async (): Promise<Notification[]> => {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  if (!raw) {
    const seeded = seedNotifications();
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as Notification[];
  } catch {
    return [];
  }
};

const writeNotifications = async (notifications: Notification[]) => {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const readTokens = async (): Promise<DeviceToken[]> => {
  const raw = await AsyncStorage.getItem(DEVICE_TOKENS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as DeviceToken[];
  } catch {
    return [];
  }
};

const writeTokens = async (tokens: DeviceToken[]) => {
  await AsyncStorage.setItem(DEVICE_TOKENS_KEY, JSON.stringify(tokens));
};

const sortNotifications = (notifications: Notification[]) =>
  [...notifications].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

export const notificationService = {
  async registerDevice(token: string, platform: string): Promise<DeviceToken> {
    const payload = {token, platform};

    try {
      const response = await api.post('/notifications/devices', payload);
      return {
        token: String((response.data as Record<string, unknown>).token ?? token),
        platform: String((response.data as Record<string, unknown>).platform ?? platform),
        registeredAt: String((response.data as Record<string, unknown>).registered_at ?? new Date().toISOString()),
      };
    } catch {
      const tokens = await readTokens();
      const next: DeviceToken = {token, platform, registeredAt: new Date().toISOString()};
      const filtered = tokens.filter(item => item.token !== token);
      await writeTokens([...filtered, next]);
      return next;
    }
  },

  async unregisterDevice(token: string): Promise<void> {
    try {
      await api.delete(`/notifications/devices/${encodeURIComponent(token)}`);
    } catch {
      const tokens = await readTokens();
      await writeTokens(tokens.filter(item => item.token !== token));
    }
  },

  async getNotifications(unreadOnly = false): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications', {
        params: {
          unread_only: unreadOnly ? 'true' : undefined,
        },
      });
      const notifications = (response.data as Record<string, unknown>[]).map(item => mapNotification(item));
      return sortNotifications(unreadOnly ? notifications.filter(item => !item.isRead) : notifications);
    } catch {
      const notifications = await readNotifications();
      const filtered = unreadOnly ? notifications.filter(item => !item.isRead) : notifications;
      return sortNotifications(filtered);
    }
  },

  async markRead(notificationId: string): Promise<Notification> {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`);
      return mapNotification(response.data as Record<string, unknown>);
    } catch {
      const notifications = await readNotifications();
      const updated = notifications.map(item =>
        item.id === notificationId
          ? {
              ...item,
              isRead: true,
              readAt: item.readAt ?? new Date().toISOString(),
            }
          : item,
      );
      await writeNotifications(updated);
      return updated.find(item => item.id === notificationId) as Notification;
    }
  },

  async markAllRead(): Promise<void> {
    try {
      await api.post('/notifications/read-all');
    } catch {
      const notifications = await readNotifications();
      await writeNotifications(
        notifications.map(item => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      return Number((response.data as Record<string, unknown>).unread_count ?? 0);
    } catch {
      const notifications = await readNotifications();
      return notifications.filter(item => !item.isRead).length;
    }
  },
};
