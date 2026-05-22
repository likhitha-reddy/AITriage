import {api} from './api';
import {doctorService} from './doctorService';
import type {Consultation} from '../types';

const CURRENT_DATE = '2026-05-22T12:22:01Z';

interface BookConsultationPayload {
  doctorId: string;
  scheduledAt: string;
  reason: string;
}

const mockConsultations = async (): Promise<Consultation[]> => {
  const [firstDoctor, secondDoctor] = await doctorService.listDoctors();

  return [
    {
      id: 'consultation-001',
      doctor: firstDoctor,
      scheduledAt: CURRENT_DATE,
      reason: 'Reviewing a persistent skin rash',
      status: 'upcoming',
      meetingLink: 'https://meet.aitriage.app/consultation-001',
    },
    {
      id: 'consultation-002',
      doctor: secondDoctor,
      scheduledAt: CURRENT_DATE,
      reason: 'Stress and sleep quality follow-up',
      status: 'completed',
      notes: 'Continue daily breathing exercises and track sleep routine for 7 days.',
    },
  ];
};

export const consultationService = {
  async listConsultations(): Promise<Consultation[]> {
    try {
      const response = await api.get<Consultation[]>('/consultations');
      return response.data;
    } catch {
      return mockConsultations();
    }
  },

  async bookConsultation(payload: BookConsultationPayload): Promise<Consultation> {
    try {
      const response = await api.post<Consultation>('/consultations', payload);
      return response.data;
    } catch {
      const doctor = await doctorService.getDoctorDetail(payload.doctorId);
      return {
        id: 'consultation-new',
        doctor,
        scheduledAt: payload.scheduledAt,
        reason: payload.reason,
        status: 'upcoming',
        meetingLink: 'https://meet.aitriage.app/consultation-new',
      };
    }
  },
};
