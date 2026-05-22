export type SubscriptionPlan = 'free' | 'basic' | 'premium' | string;
export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'past_due' | string;
export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
export type CareCategory = 'general' | 'mental_health' | 'dermatology';
export type TriageSeverity = 'green' | 'yellow' | 'orange' | 'red';
export type ActionLevel = 'self-care' | 'consultation' | 'urgent-care' | 'emergency';
export type ToastVariant = 'success' | 'error' | 'info';
export type VideoSessionStatus = 'waiting' | 'connecting' | 'active' | 'ended';
export type NotificationType = 'consultation' | 'prescription' | 'subscription' | 'payment' | 'video' | 'system';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  perks: string[];
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  subscriptionTier: string;
  createdAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  fee: number;
  rating: number;
  available: boolean;
  bio: string;
  availableSlots: string[];
}

export interface VideoSession {
  id: string;
  consultationId: string;
  roomId: string;
  status: VideoSessionStatus;
  startedAt?: string;
  joinedAt?: string;
  endedAt?: string;
  connectionStatus?: string;
}

export interface Consultation {
  id: string;
  patientId?: string;
  doctorId: string;
  doctor?: Doctor;
  triageResultId?: string;
  scheduledAt: string;
  notes?: string;
  prescriptionId?: string;
  status: ConsultationStatus;
  videoSession?: VideoSession;
  callStatus?: VideoSessionStatus;
}

export interface Diagnosis {
  id: string;
  name: string;
  confidence: number;
  description: string;
}

export interface MedicalHistory {
  allergies: string;
  currentMedications: string;
}

export interface PickedImage {
  uri: string;
  name?: string;
  type?: string;
  source?: 'camera' | 'library';
}

export interface TriageResult {
  id: string;
  symptomsText: string;
  summary: string;
  category: CareCategory;
  severity: TriageSeverity;
  actionLevel: ActionLevel;
  possibleDiagnoses: Diagnosis[];
  recommendedAction: string;
  recommendedSpecialization: string;
  careTips: string[];
  followUpWindow: string;
  confidenceScore: number;
  createdAt: string;
  medicalHistory?: MedicalHistory;
  imageUris: string[];
  crisisSupport?: string[];
}

export interface ProgressEntry {
  id: string;
  currentSymptoms: string;
  improvementRating: number;
  newSymptoms: string;
  createdAt: string;
}

export interface PrescriptionDrug {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  frequency: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  doctorId: string;
  patientId?: string;
  drugs: PrescriptionDrug[];
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}

export interface DeviceToken {
  token: string;
  platform: string;
  registeredAt: string;
}

export interface PostCallRating {
  consultationId: string;
  rating: number;
  createdAt: string;
  feedback?: string;
}

export interface SymptomPayload {
  category: CareCategory;
  symptomsText: string;
  images: PickedImage[];
  medicalHistory: MedicalHistory;
}

export interface ProgressPayload {
  currentSymptoms: string;
  improvementRating: number;
  newSymptoms: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}
