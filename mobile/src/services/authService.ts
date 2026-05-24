import {bareApi, clearAuthSession, getStoredSession, persistAuthSession} from './api';
import {mapUser} from './mappers';
import type {AuthResponse} from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: string;
}

const mapAuthResponse = (data: Record<string, unknown>): AuthResponse => ({
  accessToken: String(data.access_token ?? ''),
  refreshToken: String(data.refresh_token ?? ''),
  tokenType: String(data.token_type ?? 'bearer'),
  user: mapUser((data.user ?? {}) as Record<string, unknown>),
});

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await bareApi.post('/auth/login', {email, password});
    const mapped = mapAuthResponse(response.data as Record<string, unknown>);
    await persistAuthSession({...mapped, user: mapped.user});
    return mapped;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await bareApi.post('/auth/register', {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      date_of_birth: payload.dateOfBirth,
      subscription_tier: 'free',
    });
    const mapped = mapAuthResponse(response.data as Record<string, unknown>);
    await persistAuthSession({...mapped, user: mapped.user});
    return mapped;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await bareApi.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    const mapped = mapAuthResponse(response.data as Record<string, unknown>);
    await persistAuthSession({...mapped, user: mapped.user});
    return mapped;
  },

  async logout(): Promise<void> {
    await clearAuthSession();
  },

  async getStoredSession(): Promise<AuthResponse | null> {
    const stored = await getStoredSession();
    if (!stored.accessToken || !stored.userJson) {
      return null;
    }

    return {
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken ?? '',
      tokenType: 'bearer',
      user: mapUser(JSON.parse(stored.userJson) as Record<string, unknown>),
    };
  },
};
