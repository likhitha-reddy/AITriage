import AsyncStorage from '@react-native-async-storage/async-storage';

import type {AuthResponse, User} from '../types';

const TOKEN_KEY = '@aitriage/token';
const USER_KEY = '@aitriage/user';
const CURRENT_DATE = '2026-05-22T12:22:01Z';

const wait = (duration = 500) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), duration);
  });

const buildMockUser = (email: string, firstName = 'Avery', lastName = 'Care') : User => ({
  id: 'user-001',
  firstName,
  lastName,
  email,
  phone: '+1 (555) 214-8899',
  subscription: {
    id: 'subscription-001',
    tier: 'care-plus',
    status: 'active',
    renewalDate: CURRENT_DATE,
    benefits: ['AI triage sessions', 'Priority consultations', 'Prescription reminders'],
  },
});

const persistSession = async (response: AuthResponse) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, response.token],
    [USER_KEY, JSON.stringify(response.user)],
  ]);
};

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await wait();

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const response = {
      token: `mock-token-${CURRENT_DATE}`,
      user: buildMockUser(email),
    };

    await persistSession(response);
    return response;
  },

  async register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    await wait();

    if (!payload.email || !payload.password) {
      throw new Error('Registration details are incomplete.');
    }

    const response = {
      token: `mock-token-${CURRENT_DATE}`,
      user: buildMockUser(payload.email, payload.firstName, payload.lastName),
    };

    await persistSession(response);
    return response;
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async getStoredSession(): Promise<AuthResponse | null> {
    const [[, token], [, user]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);

    if (!token || !user) {
      return null;
    }

    return {
      token,
      user: JSON.parse(user) as User,
    };
  },
};
