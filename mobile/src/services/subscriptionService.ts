import {api} from './api';
import {mapSubscription} from './mappers';
import type {Subscription} from '../types';
import {CURRENT_DATETIME} from '../utils/constants';

export const subscriptionService = {
  async getStatus(): Promise<Subscription | null> {
    try {
      const response = await api.get('/subscriptions/status');
      return mapSubscription(response.data as Record<string, unknown>);
    } catch {
      return null;
    }
  },

  async subscribe(plan: string): Promise<Subscription> {
    const response = await api.post('/subscriptions', {
      plan,
      started_at: CURRENT_DATETIME,
    });
    return mapSubscription(response.data as Record<string, unknown>);
  },

  async cancel(): Promise<Subscription> {
    const response = await api.post('/subscriptions/cancel');
    return mapSubscription(response.data as Record<string, unknown>);
  },
};
