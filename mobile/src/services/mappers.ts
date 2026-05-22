import {DEFAULT_DOCTOR_SLOTS, MENTAL_HEALTH_HELPLINES, PLAN_PERKS} from '../utils/constants';
import type {
  ActionLevel,
  Consultation,
  Doctor,
  Diagnosis,
  Prescription,
  PrescriptionDrug,
  Subscription,
  TriageResult,
  TriageSeverity,
  User,
  CareCategory,
} from '../types';

const splitName = (name: string) => {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(' '),
  };
};

export const mapUser = (raw: Record<string, unknown>): User => {
  const name = String(raw.name ?? 'Patient');
  const {firstName, lastName} = splitName(name);

  return {
    id: String(raw.id ?? ''),
    name,
    firstName: firstName || name,
    lastName,
    email: String(raw.email ?? ''),
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    dateOfBirth: typeof raw.date_of_birth === 'string' ? raw.date_of_birth : undefined,
    subscriptionTier: String(raw.subscription_tier ?? 'free'),
    createdAt: typeof raw.created_at === 'string' ? raw.created_at : undefined,
  };
};

export const mapDoctor = (raw: Record<string, unknown>): Doctor => ({
  id: String(raw.id ?? ''),
  name: String(raw.name ?? 'Doctor'),
  specialization: String(raw.specialization ?? 'General Health'),
  qualification: String(raw.qualification ?? 'Licensed clinician'),
  experienceYears: Number(raw.experience_years ?? 0),
  fee: Number(raw.consultation_fee ?? 0),
  rating: Number(raw.rating ?? 0),
  available: Boolean(raw.is_available ?? true),
  bio: `${String(raw.name ?? 'This clinician')} specializes in ${String(raw.specialization ?? 'care planning').toLowerCase()} and virtual-first follow up care.`,
  availableSlots: Array.isArray(raw.available_slots)
    ? raw.available_slots.map(slot => String(slot))
    : DEFAULT_DOCTOR_SLOTS,
});

const determineCategory = (text: string): CareCategory => {
  const value = text.toLowerCase();
  if (/(anxiety|stress|panic|mood|sad|depress|sleep|burnout)/.test(value)) {
    return 'mental_health';
  }
  if (/(skin|rash|itch|acne|eczema|derma|throat)/.test(value)) {
    return 'dermatology';
  }
  return 'general';
};

const determineSeverity = (action: string): TriageSeverity => {
  const value = action.toLowerCase();
  if (value.includes('emergency')) {
    return 'red';
  }
  if (value.includes('urgent')) {
    return 'orange';
  }
  if (value.includes('consultation') || value.includes('schedule')) {
    return 'yellow';
  }
  return 'green';
};

const determineActionLevel = (action: string): ActionLevel => {
  const value = action.toLowerCase();
  if (value.includes('emergency')) {
    return 'emergency';
  }
  if (value.includes('urgent')) {
    return 'urgent-care';
  }
  if (value.includes('consultation') || value.includes('schedule')) {
    return 'consultation';
  }
  return 'self-care';
};

const recommendedSpecialization = (category: CareCategory): string => {
  if (category === 'mental_health') {
    return 'Mental Health';
  }
  if (category === 'dermatology') {
    return 'Dermatology';
  }
  return 'General Health';
};

const buildDiagnosis = (value: string, index: number, confidenceScore: number): Diagnosis => ({
  id: `${index + 1}`,
  name: value,
  confidence: Math.max(0.2, Number((confidenceScore - index * 0.12).toFixed(2))),
  description: 'AI-assisted pattern matching suggests this may be relevant, but clinician confirmation is still recommended.',
});

export const mapTriageResult = (raw: Record<string, unknown>): TriageResult => {
  const symptomsText = String(raw.symptoms_text ?? raw.symptomsText ?? 'Symptoms submitted');
  const possibleDiagnosesRaw = Array.isArray(raw.possible_diagnoses)
    ? raw.possible_diagnoses
    : Array.isArray(raw.possibleDiagnoses)
      ? raw.possibleDiagnoses
      : [];
  const confidenceScore = Number(raw.confidence_score ?? raw.confidenceScore ?? 0.45);
  const category = determineCategory(`${symptomsText} ${String(raw.recommended_action ?? '')}`);
  const recommendedAction = String(raw.recommended_action ?? raw.recommendedAction ?? 'Monitor symptoms and book follow-up care if needed.');
  const aiAnalysis = (raw.ai_analysis ?? {}) as Record<string, unknown>;
  const careTips = category === 'mental_health'
    ? ['Practice slow breathing for 60 seconds.', 'Reduce isolating triggers and reach out to support.', 'Use the progress tracker to log mood changes.']
    : category === 'dermatology'
      ? ['Keep the area clean and dry.', 'Avoid harsh products until reviewed.', 'Capture clear follow-up photos in the app.']
      : ['Rest, hydrate, and monitor changes closely.', 'Use the progress check-in if symptoms shift.', 'Book a consultation if symptoms persist.'];

  return {
    id: String(raw.id ?? ''),
    symptomsText,
    summary: String(aiAnalysis.summary ?? raw.summary ?? 'Your symptoms were reviewed and a next step is ready.'),
    category,
    severity: determineSeverity(recommendedAction),
    actionLevel: determineActionLevel(recommendedAction),
    possibleDiagnoses: possibleDiagnosesRaw.map((item, index) =>
      typeof item === 'string'
        ? buildDiagnosis(item, index, confidenceScore)
        : {
            id: String((item as Record<string, unknown>).id ?? index + 1),
            name: String((item as Record<string, unknown>).name ?? `Diagnosis ${index + 1}`),
            confidence: Number((item as Record<string, unknown>).confidence ?? confidenceScore),
            description: String((item as Record<string, unknown>).description ?? 'Additional clinician review is recommended.'),
          },
    ),
    recommendedAction,
    recommendedSpecialization: recommendedSpecialization(category),
    careTips,
    followUpWindow: determineSeverity(recommendedAction) === 'red'
      ? 'Immediately'
      : determineSeverity(recommendedAction) === 'orange'
        ? 'Within 4 hours'
        : determineSeverity(recommendedAction) === 'yellow'
          ? 'Within 24 hours'
          : 'Monitor over 48 hours',
    confidenceScore,
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    imageUris: Array.isArray(raw.image_urls) ? raw.image_urls.map(item => String(item)) : [],
    crisisSupport: category === 'mental_health' ? MENTAL_HEALTH_HELPLINES.map(item => `${item.label}: ${item.value}`) : undefined,
  };
};

export const mapConsultation = (raw: Record<string, unknown>, doctor?: Doctor): Consultation => ({
  id: String(raw.id ?? ''),
  patientId: raw.patient_id ? String(raw.patient_id) : undefined,
  doctorId: String(raw.doctor_id ?? doctor?.id ?? ''),
  doctor,
  triageResultId: raw.triage_result_id ? String(raw.triage_result_id) : undefined,
  scheduledAt: String(raw.scheduled_at ?? raw.scheduledAt ?? ''),
  notes: typeof raw.notes === 'string' ? raw.notes : undefined,
  prescriptionId: raw.prescription_id ? String(raw.prescription_id) : undefined,
  status: (String(raw.status ?? 'scheduled') as Consultation['status']),
});

export const mapSubscription = (raw: Record<string, unknown>): Subscription => {
  const plan = String(raw.plan ?? 'free');
  return {
    id: String(raw.id ?? plan),
    plan,
    status: String(raw.status ?? 'active'),
    startedAt: String(raw.started_at ?? ''),
    expiresAt: String(raw.expires_at ?? ''),
    perks: PLAN_PERKS[plan] ?? PLAN_PERKS.free,
  };
};

export const mapPrescription = (raw: Record<string, unknown>): Prescription => {
  const drugsRaw = Array.isArray(raw.drugs) ? raw.drugs : [];
  const drugs: PrescriptionDrug[] = drugsRaw.map((drug, index) => {
    const typed = drug as Record<string, unknown>;
    return {
      id: String(typed.id ?? index + 1),
      name: String(typed.name ?? typed.medicationName ?? `Medication ${index + 1}`),
      dosage: String(typed.dosage ?? 'Use as directed'),
      duration: String(typed.duration ?? 'As prescribed'),
      frequency: String(typed.frequency ?? 'See instructions'),
      instructions: String(typed.instructions ?? 'Follow your clinician guidance.'),
    };
  });

  return {
    id: String(raw.id ?? ''),
    consultationId: String(raw.consultation_id ?? ''),
    doctorId: String(raw.doctor_id ?? ''),
    patientId: raw.patient_id ? String(raw.patient_id) : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    drugs,
  };
};

export const buildErrorMessage = (detail: unknown, fallback: string) => {
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  if (detail && typeof detail === 'object' && 'detail' in (detail as Record<string, unknown>)) {
    const nested = (detail as Record<string, unknown>).detail;
    if (typeof nested === 'string') {
      return nested;
    }
  }
  return fallback;
};
