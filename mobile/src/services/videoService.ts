import AsyncStorage from '@react-native-async-storage/async-storage';

import {api} from './api';
import type {VideoSession} from '../types';

const VIDEO_SESSIONS_KEY = '@aitriage/video-sessions';

const mapVideoSession = (raw: Record<string, unknown>, fallbackConsultationId = ''): VideoSession => ({
  id: String(raw.id ?? raw.room_id ?? fallbackConsultationId ?? ''),
  consultationId: String(raw.consultation_id ?? raw.consultationId ?? fallbackConsultationId),
  roomId: String(raw.room_id ?? raw.roomId ?? `room-${fallbackConsultationId}`),
  status: String(raw.status ?? 'waiting') as VideoSession['status'],
  startedAt: typeof raw.started_at === 'string' ? raw.started_at : typeof raw.startedAt === 'string' ? raw.startedAt : undefined,
  joinedAt: typeof raw.joined_at === 'string' ? raw.joined_at : typeof raw.joinedAt === 'string' ? raw.joinedAt : undefined,
  endedAt: typeof raw.ended_at === 'string' ? raw.ended_at : typeof raw.endedAt === 'string' ? raw.endedAt : undefined,
  connectionStatus: typeof raw.connection_status === 'string' ? raw.connection_status : typeof raw.connectionStatus === 'string' ? raw.connectionStatus : undefined,
});

const readSessions = async (): Promise<Record<string, VideoSession>> => {
  const raw = await AsyncStorage.getItem(VIDEO_SESSIONS_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, VideoSession>;
  } catch {
    return {};
  }
};

const writeSessions = async (sessions: Record<string, VideoSession>) => {
  await AsyncStorage.setItem(VIDEO_SESSIONS_KEY, JSON.stringify(sessions));
};

const persistSession = async (session: VideoSession) => {
  const sessions = await readSessions();
  sessions[session.consultationId] = session;
  await writeSessions(sessions);
  return session;
};

const getStoredSessionByRoom = async (roomId: string) => {
  const sessions = await readSessions();
  return Object.values(sessions).find(item => item.roomId === roomId) ?? null;
};

export const videoService = {
  async createSession(consultationId: string): Promise<VideoSession> {
    try {
      const response = await api.post('/video/sessions', {
        consultation_id: Number(consultationId),
      });
      return persistSession(mapVideoSession(response.data as Record<string, unknown>, consultationId));
    } catch {
      const session: VideoSession = {
        id: `video-${consultationId}`,
        consultationId,
        roomId: `room-${consultationId}`,
        status: 'waiting',
        startedAt: new Date().toISOString(),
        connectionStatus: 'Awaiting patient',
      };
      return persistSession(session);
    }
  },

  async joinSession(roomId: string): Promise<VideoSession> {
    try {
      const response = await api.post(`/video/sessions/${roomId}/join`);
      return persistSession(mapVideoSession(response.data as Record<string, unknown>));
    } catch {
      const existing = await getStoredSessionByRoom(roomId);
      const session: VideoSession = {
        ...(existing ?? {
          id: roomId,
          consultationId: roomId.replace('room-', ''),
          roomId,
          startedAt: new Date().toISOString(),
        }),
        status: 'active',
        joinedAt: new Date().toISOString(),
        connectionStatus: 'In Call',
      };
      return persistSession(session);
    }
  },

  async endSession(roomId: string): Promise<VideoSession> {
    try {
      const response = await api.post(`/video/sessions/${roomId}/end`);
      return persistSession(mapVideoSession(response.data as Record<string, unknown>));
    } catch {
      const existing = await getStoredSessionByRoom(roomId);
      const session: VideoSession = {
        ...(existing ?? {
          id: roomId,
          consultationId: roomId.replace('room-', ''),
          roomId,
        }),
        status: 'ended',
        endedAt: new Date().toISOString(),
        connectionStatus: 'Call ended',
      };
      return persistSession(session);
    }
  },

  async getSession(consultationId: string): Promise<VideoSession | null> {
    try {
      const response = await api.get(`/video/sessions/consultations/${consultationId}`);
      return persistSession(mapVideoSession(response.data as Record<string, unknown>, consultationId));
    } catch {
      const sessions = await readSessions();
      return sessions[consultationId] ?? null;
    }
  },
};
