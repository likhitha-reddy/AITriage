import {api} from './api';
import {mapUser} from './mappers';
import type {User} from '../types';

interface ProfileUpdatePayload {
  name: string;
  phone?: string;
  dateOfBirth?: string;
  password?: string;
}

export const patientService = {
  async getProfile(): Promise<User> {
    const response = await api.get('/patients/me');
    return mapUser(response.data as Record<string, unknown>);
  },

  async updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    const response = await api.patch('/patients/me', {
      name: payload.name,
      phone: payload.phone || null,
      date_of_birth: payload.dateOfBirth || null,
      password: payload.password || undefined,
    });
    return mapUser(response.data as Record<string, unknown>);
  },
};
