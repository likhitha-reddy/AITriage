import {api} from './api';
import type {Doctor} from '../types';

const CURRENT_DATE = '2026-05-22T12:22:01Z';

const mockDoctors: Doctor[] = [
  {
    id: 'doctor-001',
    name: 'Dr. Maya Chen',
    specialization: 'Dermatology',
    fee: 95,
    rating: 4.9,
    experienceYears: 11,
    availableSlots: [CURRENT_DATE],
    bio: 'Focuses on skin conditions, rash evaluations, and follow-up treatment planning.',
  },
  {
    id: 'doctor-002',
    name: 'Dr. Rafael Brooks',
    specialization: 'Mental Health',
    fee: 110,
    rating: 4.8,
    experienceYears: 13,
    availableSlots: [CURRENT_DATE],
    bio: 'Experienced in anxiety, burnout, and virtual-first patient support.',
  },
  {
    id: 'doctor-003',
    name: 'Dr. Alina Foster',
    specialization: 'Family Medicine',
    fee: 85,
    rating: 4.7,
    experienceYears: 9,
    availableSlots: [CURRENT_DATE],
    bio: 'Helps patients coordinate primary care, medication reviews, and wellness check-ins.',
  },
];

export const doctorService = {
  async listDoctors(): Promise<Doctor[]> {
    try {
      const response = await api.get<Doctor[]>('/doctors');
      return response.data;
    } catch {
      return mockDoctors;
    }
  },

  async getDoctorDetail(doctorId: string): Promise<Doctor> {
    try {
      const response = await api.get<Doctor>(`/doctors/${doctorId}`);
      return response.data;
    } catch {
      const doctor = mockDoctors.find(item => item.id === doctorId) ?? mockDoctors[0];
      return doctor;
    }
  },
};
