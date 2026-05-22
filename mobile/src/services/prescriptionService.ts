import {api} from './api';
import {mapPrescription} from './mappers';
import type {Prescription} from '../types';

export const prescriptionService = {
  async getByConsultation(consultationId: string): Promise<Prescription> {
    const response = await api.get(`/prescriptions/consultation/${consultationId}`);
    return mapPrescription(response.data as Record<string, unknown>);
  },
};
