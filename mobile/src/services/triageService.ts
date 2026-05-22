import {api} from './api';
import type {SymptomPayload, TriageResult} from '../types';

const CURRENT_DATE = '2026-05-22T12:22:01Z';

const buildMockResult = (description: string): TriageResult => {
  const lowerDescription = description.toLowerCase();
  const dermatologyMatch = lowerDescription.includes('rash') || lowerDescription.includes('itch');

  return {
    id: 'triage-001',
    summary: dermatologyMatch
      ? 'Your symptoms may align with a mild inflammatory skin condition that benefits from a clinician review.'
      : 'Your symptoms suggest a low-to-moderate urgency issue that should be monitored with supportive care.',
    possibleDiagnoses: dermatologyMatch
      ? [
          {
            id: 'diag-001',
            name: 'Contact Dermatitis',
            confidence: 0.72,
            description: 'A skin reaction often linked to irritation or allergens.',
          },
          {
            id: 'diag-002',
            name: 'Eczema Flare',
            confidence: 0.54,
            description: 'A chronic inflammatory skin pattern that can worsen with dryness and stress.',
          },
        ]
      : [
          {
            id: 'diag-003',
            name: 'Stress-related fatigue',
            confidence: 0.63,
            description: 'Symptoms may improve with hydration, sleep support, and follow-up care.',
          },
          {
            id: 'diag-004',
            name: 'Mild viral syndrome',
            confidence: 0.41,
            description: 'Monitor symptoms closely and escalate if they worsen or persist.',
          },
        ],
    recommendedAction: dermatologyMatch
      ? 'Book a dermatology consultation within 24 hours and avoid new skincare products until reviewed.'
      : 'Continue home monitoring, rest, and schedule a consultation if symptoms persist.',
    urgency: dermatologyMatch ? 'moderate' : 'low',
    careTips: dermatologyMatch
      ? ['Keep the affected area clean and dry.', 'Avoid scratching to reduce irritation.', 'Upload a clear photo for comparison during follow-up.']
      : ['Hydrate regularly and prioritize sleep.', 'Track symptom changes in the app.', 'Seek urgent care if new chest pain or breathing issues appear.'],
    followUpWindow: dermatologyMatch ? 'Within 24 hours' : 'Within 72 hours if not improving',
    createdAt: CURRENT_DATE,
  };
};

export const triageService = {
  async submitSymptoms(payload: SymptomPayload): Promise<TriageResult> {
    try {
      const response = await api.post<TriageResult>('/triage', payload);
      return response.data;
    } catch {
      return buildMockResult(payload.description);
    }
  },

  async getTriageResult(resultId: string): Promise<TriageResult> {
    try {
      const response = await api.get<TriageResult>(`/triage/${resultId}`);
      return response.data;
    } catch {
      return buildMockResult(`Follow-up request for ${resultId}`);
    }
  },
};
