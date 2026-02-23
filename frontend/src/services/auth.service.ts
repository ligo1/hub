import api from './api';
import { User } from '../types';

export const authService = {
  logout: async () => {
    await api.post('/auth/logout');
  },

  me: async () => {
    const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data.data.user;
  },
};
