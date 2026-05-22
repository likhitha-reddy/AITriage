import axios, {AxiosHeaders} from 'axios';

import {authService} from './authService';

export const api = axios.create({
  baseURL: 'https://api.aitriage.app/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async config => {
  const token = await authService.getToken();

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});
