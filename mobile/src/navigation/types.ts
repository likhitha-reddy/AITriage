import type {NavigatorScreenParams} from '@react-navigation/native';

import type {Prescription, TriageResult} from '../types';

export type MainTabParamList = {
  Home: undefined;
  Triage: undefined;
  Consultations: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  TriageResult: {result: TriageResult};
  BookConsultation: {doctorId?: string} | undefined;
  Prescription: {prescription?: Prescription} | undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
