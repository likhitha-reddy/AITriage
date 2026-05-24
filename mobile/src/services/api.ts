import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios';

interface HandlerConfig {
  onUnauthorized?: () => void | Promise<void>;
  onError?: (message: string) => void;
}

interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  userJson: string | null;
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const runtimeEnv = (globalThis as {process?: {env?: Record<string, string | undefined>}}).process?.env;

export const API_BASE_URL = runtimeEnv?.API_BASE_URL ?? 'http://localhost:8005/api/v1';
export const ACCESS_TOKEN_KEY = '@aitriage/access-token';
export const REFRESH_TOKEN_KEY = '@aitriage/refresh-token';
export const USER_KEY = '@aitriage/user';

const requestTimeout = 20000;

let handlers: HandlerConfig = {};
let refreshPromise: Promise<string | null> | null = null;

export const bareApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerApiHandlers = (config: HandlerConfig) => {
  handlers = config;
};

export const getStoredSession = async (): Promise<StoredSession> => {
  const values = await AsyncStorage.multiGet([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  return {
    accessToken: values[0]?.[1] ?? null,
    refreshToken: values[1]?.[1] ?? null,
    userJson: values[2]?.[1] ?? null,
  };
};

export const persistAuthSession = async (payload: {
  accessToken: string;
  refreshToken: string;
  user?: unknown;
}) => {
  const entries: [string, string][] = [
    [ACCESS_TOKEN_KEY, payload.accessToken],
    [REFRESH_TOKEN_KEY, payload.refreshToken],
  ];

  if (payload.user !== undefined) {
    entries.push([USER_KEY, JSON.stringify(payload.user)]);
  }

  await AsyncStorage.multiSet(entries);
};

export const clearAuthSession = async () => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
};

const extractErrorMessage = (error: AxiosError) => {
  const detail = (error.response?.data as {detail?: string} | undefined)?.detail;
  if (detail) {
    return detail;
  }
  if (!error.response) {
    return 'Network error. Check your connection and try again.';
  }
  if (error.response.status >= 500) {
    return 'We hit a server problem. Please try again shortly.';
  }
  return error.message || 'Request failed.';
};

const refreshAccessToken = async () => {
  const {refreshToken, userJson} = await getStoredSession();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await bareApi.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    await persistAuthSession({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      user: response.data.user ?? (userJson ? JSON.parse(userJson) : undefined),
    });
    return String(response.data.access_token);
  } catch {
    return null;
  }
};

api.interceptors.request.use(async config => {
  const {accessToken} = await getStoredSession();
  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const isAuthRequest = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register') || config?.url?.includes('/auth/refresh');

    if (status === 401 && config && !config._retry && !isAuthRequest) {
      config._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const nextToken = await refreshPromise;
      refreshPromise = null;

      if (nextToken) {
        const headers = AxiosHeaders.from(config.headers);
        headers.set('Authorization', `Bearer ${nextToken}`);
        config.headers = headers;
        return api.request(config);
      }

      await clearAuthSession();
      await handlers.onUnauthorized?.();
      handlers.onError?.('Your session expired. Please sign in again.');
    } else if (!error.response) {
      handlers.onError?.('Network error. Check your connection and try again.');
    } else if (status && status >= 500) {
      handlers.onError?.('We hit a server problem. Please try again shortly.');
    }

    return Promise.reject(new Error(extractErrorMessage(error)));
  },
);
