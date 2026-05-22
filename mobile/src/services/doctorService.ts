import {api} from './api';
import {mapDoctor} from './mappers';
import type {Doctor} from '../types';

interface DoctorFilters {
  specialization?: string;
  available?: boolean;
}

export const doctorService = {
  async listDoctors(filters: DoctorFilters = {}): Promise<Doctor[]> {
    const response = await api.get('/doctors', {
      params: {
        specialization: filters.specialization || undefined,
        available: filters.available ? 'true' : undefined,
        available_only: filters.available ? 'true' : undefined,
      },
    });

    return (response.data as Record<string, unknown>[]).map(item => mapDoctor(item));
  },

  async getDoctorDetail(doctorId: string): Promise<Doctor> {
    const response = await api.get(`/doctors/${doctorId}`);
    return mapDoctor(response.data as Record<string, unknown>);
  },
};
