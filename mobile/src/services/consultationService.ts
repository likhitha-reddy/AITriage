import {api} from './api';
import {doctorService} from './doctorService';
import {mapConsultation} from './mappers';
import type {Consultation, Doctor} from '../types';

interface BookConsultationPayload {
  doctorId: string;
  scheduledAt: string;
  notes: string;
  triageResultId?: string;
}

const enrichConsultations = async (records: Record<string, unknown>[]) => {
  const doctorIds = Array.from(new Set(records.map(item => String(item.doctor_id ?? '')).filter(Boolean)));
  const doctors = await Promise.all(doctorIds.map(async doctorId => {
    try {
      return await doctorService.getDoctorDetail(doctorId);
    } catch {
      return undefined;
    }
  }));

  const doctorMap = doctorIds.reduce<Record<string, Doctor>>((accumulator, doctorId, index) => {
    const doctor = doctors[index];
    if (doctor) {
      accumulator[doctorId] = doctor;
    }
    return accumulator;
  }, {});

  return records.map(item => mapConsultation(item, doctorMap[String(item.doctor_id ?? '')]));
};

export const consultationService = {
  async listConsultations(): Promise<Consultation[]> {
    const response = await api.get('/consultations');
    return enrichConsultations(response.data as Record<string, unknown>[]);
  },

  async bookConsultation(payload: BookConsultationPayload): Promise<Consultation> {
    const response = await api.post('/consultations', {
      doctor_id: Number(payload.doctorId),
      triage_result_id: payload.triageResultId ? Number(payload.triageResultId) : undefined,
      scheduled_at: payload.scheduledAt,
      notes: payload.notes,
    });
    const doctor = await doctorService.getDoctorDetail(payload.doctorId);
    return mapConsultation(response.data as Record<string, unknown>, doctor);
  },

  async cancelConsultation(consultationId: string): Promise<Consultation> {
    try {
      const response = await api.patch(`/consultations/${consultationId}/cancel`);
      const doctor = await doctorService.getDoctorDetail(String((response.data as Record<string, unknown>).doctor_id ?? ''));
      return mapConsultation(response.data as Record<string, unknown>, doctor);
    } catch {
      const response = await api.patch(`/consultations/${consultationId}`, {status: 'cancelled'});
      const doctorId = String((response.data as Record<string, unknown>).doctor_id ?? '');
      const doctor = doctorId ? await doctorService.getDoctorDetail(doctorId) : undefined;
      return mapConsultation(response.data as Record<string, unknown>, doctor);
    }
  },
};
