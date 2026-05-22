import {create} from 'zustand';

import type {TriageResult} from '../types';

interface TriageState {
  description: string;
  imageUris: string[];
  lastResult: TriageResult | null;
  isSubmitting: boolean;
  setDescription: (description: string) => void;
  setImages: (imageUris: string[]) => void;
  setResult: (result: TriageResult | null) => void;
  setSubmitting: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  description: '',
  imageUris: [] as string[],
  lastResult: null as TriageResult | null,
  isSubmitting: false,
};

export const useTriageStore = create<TriageState>(set => ({
  ...initialState,
  setDescription: description => set({description}),
  setImages: imageUris => set({imageUris}),
  setResult: result => set({lastResult: result}),
  setSubmitting: value => set({isSubmitting: value}),
  reset: () => set(initialState),
}));
