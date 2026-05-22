import {create} from 'zustand';

import type {CareCategory, MedicalHistory, PickedImage, TriageResult} from '../types';

interface TriageState {
  category: CareCategory;
  symptomsText: string;
  images: PickedImage[];
  medicalHistory: MedicalHistory;
  lastResult: TriageResult | null;
  isSubmitting: boolean;
  setCategory: (category: CareCategory) => void;
  setSymptomsText: (symptomsText: string) => void;
  setImages: (images: PickedImage[]) => void;
  setMedicalHistory: (medicalHistory: Partial<MedicalHistory>) => void;
  setResult: (result: TriageResult | null) => void;
  setSubmitting: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  category: 'general' as CareCategory,
  symptomsText: '',
  images: [] as PickedImage[],
  medicalHistory: {
    allergies: '',
    currentMedications: '',
  },
  lastResult: null as TriageResult | null,
  isSubmitting: false,
};

export const useTriageStore = create<TriageState>(set => ({
  ...initialState,
  setCategory: category => set({category}),
  setSymptomsText: symptomsText => set({symptomsText}),
  setImages: images => set({images}),
  setMedicalHistory: medicalHistory =>
    set(state => ({
      medicalHistory: {
        ...state.medicalHistory,
        ...medicalHistory,
      },
    })),
  setResult: result => set({lastResult: result}),
  setSubmitting: value => set({isSubmitting: value}),
  reset: () => set(initialState),
}));
