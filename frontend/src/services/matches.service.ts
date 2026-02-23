import api from './api';
import { Match } from '../types';

export const matchesService = {
  getMatches: async () => {
    const res = await api.get<{ success: boolean; data: { matches: Match[] } }>('/matches');
    return res.data.data.matches;
  },

  computeMatches: async () => {
    const res = await api.post('/matches/compute');
    return res.data.data;
  },
};
