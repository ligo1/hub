import api from './api';
import { Session } from '../types';

export const sessionsService = {
  getSessions: async () => {
    const res = await api.get<{ success: boolean; data: { sessions: Session[] } }>('/sessions');
    return res.data.data.sessions;
  },

  getSession: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { session: Session } }>(`/sessions/${id}`);
    return res.data.data.session;
  },

  createSession: async (data: {
    roomId: string;
    title: string;
    startTime: string;
    endTime: string;
    memberIds?: string[];
    songIds?: string[];
  }) => {
    const res = await api.post<{ success: boolean; data: { session: Session } }>('/sessions', data);
    return res.data.data.session;
  },

  updateSession: async (id: string, data: Partial<Session>) => {
    const res = await api.put<{ success: boolean; data: { session: Session } }>(`/sessions/${id}`, data);
    return res.data.data.session;
  },

  deleteSession: async (id: string) => {
    await api.delete(`/sessions/${id}`);
  },

  addMember: async (sessionId: string, data: { userId: string; instrumentId: string }) => {
    const res = await api.post(`/sessions/${sessionId}/members`, data);
    return res.data.data;
  },

  addSong: async (sessionId: string, data: { songId: string; order?: number }) => {
    const res = await api.post(`/sessions/${sessionId}/songs`, data);
    return res.data.data;
  },
};
