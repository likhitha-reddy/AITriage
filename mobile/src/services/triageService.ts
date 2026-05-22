import AsyncStorage from '@react-native-async-storage/async-storage';

import {api} from './api';
import {mapTriageResult} from './mappers';
import type {ProgressEntry, ProgressPayload, SymptomPayload, TriageResult} from '../types';
import {CURRENT_DATETIME} from '../utils/constants';

const TRIAGE_RESULTS_KEY = '@aitriage/triage-results';
const PROGRESS_KEY = '@aitriage/progress';

const readCachedResults = async (): Promise<TriageResult[]> => {
  const cached = await AsyncStorage.getItem(TRIAGE_RESULTS_KEY);
  return cached ? (JSON.parse(cached) as TriageResult[]) : [];
};

const cacheResults = async (results: TriageResult[]) => {
  await AsyncStorage.setItem(TRIAGE_RESULTS_KEY, JSON.stringify(results));
};

const readProgressEntries = async (): Promise<ProgressEntry[]> => {
  const cached = await AsyncStorage.getItem(PROGRESS_KEY);
  return cached ? (JSON.parse(cached) as ProgressEntry[]) : [];
};

const cacheProgressEntries = async (entries: ProgressEntry[]) => {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(entries));
};

const createMultipartData = (payload: SymptomPayload) => {
  const formData = new FormData();
  formData.append('symptoms_text', payload.symptomsText);
  formData.append('category', payload.category);
  formData.append('medical_history', JSON.stringify(payload.medicalHistory));
  formData.append('image_urls', JSON.stringify(payload.images.map(image => image.uri)));

  payload.images.forEach((image, index) => {
    formData.append('files', {
      uri: image.uri,
      name: image.name ?? `upload-${index + 1}.jpg`,
      type: image.type ?? 'image/jpeg',
    } as never);
  });

  return formData;
};

export const triageService = {
  async submitSymptoms(payload: SymptomPayload): Promise<TriageResult> {
    let response;

    if (payload.images.length > 0) {
      try {
        response = await api.post('/triage', createMultipartData(payload), {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch {
        response = await api.post('/triage', {
          symptoms_text: payload.symptomsText,
          image_urls: payload.images.map(image => image.uri),
          category: payload.category,
          medical_history: payload.medicalHistory,
        });
      }
    } else {
      response = await api.post('/triage', {
        symptoms_text: payload.symptomsText,
        image_urls: [],
        category: payload.category,
        medical_history: payload.medicalHistory,
      });
    }

    const mapped = mapTriageResult(response.data as Record<string, unknown>);
    const cached = await readCachedResults();
    await cacheResults([mapped, ...cached.filter(item => item.id !== mapped.id)].slice(0, 10));
    return mapped;
  },

  async getRecentResults(): Promise<TriageResult[]> {
    try {
      const response = await api.get('/triage/results');
      const mapped = (response.data as Record<string, unknown>[]).map(item => mapTriageResult(item));
      await cacheResults(mapped);
      return mapped;
    } catch {
      return readCachedResults();
    }
  },

  async getTriageResult(resultId: string): Promise<TriageResult> {
    try {
      const response = await api.get(`/triage/${resultId}`);
      return mapTriageResult(response.data as Record<string, unknown>);
    } catch {
      const cached = await readCachedResults();
      const fallback = cached.find(item => item.id === resultId);
      if (fallback) {
        return fallback;
      }
      throw new Error('Unable to load the triage result.');
    }
  },

  async submitProgress(payload: ProgressPayload): Promise<ProgressEntry> {
    try {
      const response = await api.post('/triage/progress', payload);
      const entry: ProgressEntry = {
        id: String((response.data as Record<string, unknown>).id ?? Date.now()),
        currentSymptoms: String((response.data as Record<string, unknown>).current_symptoms ?? payload.currentSymptoms),
        improvementRating: Number((response.data as Record<string, unknown>).improvement_rating ?? payload.improvementRating),
        newSymptoms: String((response.data as Record<string, unknown>).new_symptoms ?? payload.newSymptoms),
        createdAt: String((response.data as Record<string, unknown>).created_at ?? CURRENT_DATETIME),
      };
      const cached = await readProgressEntries();
      await cacheProgressEntries([entry, ...cached].slice(0, 7));
      return entry;
    } catch {
      const entry: ProgressEntry = {
        id: `${Date.now()}`,
        currentSymptoms: payload.currentSymptoms,
        improvementRating: payload.improvementRating,
        newSymptoms: payload.newSymptoms,
        createdAt: CURRENT_DATETIME,
      };
      const cached = await readProgressEntries();
      await cacheProgressEntries([entry, ...cached].slice(0, 7));
      return entry;
    }
  },

  async getProgressEntries(): Promise<ProgressEntry[]> {
    return readProgressEntries();
  },
};
