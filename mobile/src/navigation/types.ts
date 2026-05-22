import type {NavigatorScreenParams} from '@react-navigation/native';

import type {CareCategory, PostCallRating, Prescription, TriageResult} from '../types';

export type MainTabParamList = {
  Home: undefined;
  Triage: undefined;
  Consultations: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  TriageInput: {category?: CareCategory} | undefined;
  TriageResult: {result?: TriageResult; triageId?: string};
  BookConsultation:
    | {
        doctorId?: string;
        specialization?: string;
        triageResultId?: string;
        notes?: string;
      }
    | undefined;
  Prescription: {consultationId?: string; prescription?: Prescription} | undefined;
  Progress: undefined;
  Subscription: undefined;
  Notifications: undefined;
  VideoCall: {
    consultationId: string;
    doctorName?: string;
    roomId?: string;
  };
  PostCall: {
    consultationId: string;
    doctorName?: string;
    durationSeconds: number;
    rating?: PostCallRating;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
