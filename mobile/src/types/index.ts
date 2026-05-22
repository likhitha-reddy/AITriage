export type SubscriptionTier = 'free' | 'care-plus' | 'family';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due';
export type ConsultationStatus = 'upcoming' | 'completed' | 'cancelled';
export type TriageUrgency = 'low' | 'moderate' | 'high';

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  renewalDate: string;
  benefits: string[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  subscription: Subscription;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  fee: number;
  rating: number;
  experienceYears: number;
  availableSlots: string[];
  bio: string;
  avatarUrl?: string;
}

export interface Consultation {
  id: string;
  doctor: Doctor;
  scheduledAt: string;
  reason: string;
  status: ConsultationStatus;
  meetingLink?: string;
  notes?: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  confidence: number;
  description: string;
}

export interface TriageResult {
  id: string;
  summary: string;
  possibleDiagnoses: Diagnosis[];
  recommendedAction: string;
  urgency: TriageUrgency;
  careTips: string[];
  followUpWindow: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedBy: string;
  issuedAt: string;
  refillAvailable: boolean;
}

export interface SymptomPayload {
  description: string;
  imageUris: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
