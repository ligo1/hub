import api from './api';
import { Note } from '../types';

type NotePayload = {
  title: string;
  content: string;
  projectId: string;
};

export const notesService = {
  list: async (projectId?: string): Promise<Note[]> => {
    const params = projectId ? { projectId } : {};
    const res = await api.get<{ success: boolean; data: { notes: Note[] } }>('/notes', { params });
    return res.data.data.notes;
  },

  create: async (data: NotePayload): Promise<Note> => {
    const res = await api.post<{ success: boolean; data: { note: Note } }>('/notes', data);
    return res.data.data.note;
  },

  update: async (id: string, data: { title?: string; content?: string }): Promise<Note> => {
    const res = await api.put<{ success: boolean; data: { note: Note } }>(`/notes/${id}`, data);
    return res.data.data.note;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },
};
