import api from './api';
import { User, Availability } from '../types';

export const usersService = {
  getUser: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { user: User } }>(`/users/${id}`);
    return res.data.data.user;
  },

  updateUser: async (id: string, data: Partial<Pick<User, 'name' | 'bio' | 'avatarUrl'>>) => {
    const res = await api.put<{ success: boolean; data: { user: User } }>(`/users/${id}`, data);
    return res.data.data.user;
  },

  addInstrument: async (userId: string, data: { instrumentId: string; level: string }) => {
    const res = await api.post(`/users/${userId}/instruments`, data);
    return res.data.data;
  },

  removeInstrument: async (userId: string, userInstrumentId: string) => {
    await api.delete(`/users/${userId}/instruments/${userInstrumentId}`);
  },

  updateAvailability: async (userId: string, availability: Omit<Availability, 'id'>[]) => {
    const res = await api.put(`/users/${userId}/availability`, availability);
    return res.data.data;
  },

  addToWishlist: async (userId: string, songId: string) => {
    const res = await api.post(`/users/${userId}/wishlist`, { songId });
    return res.data.data;
  },

  removeFromWishlist: async (userId: string, songId: string) => {
    await api.delete(`/users/${userId}/wishlist/${songId}`);
  },

  getRooms: async () => {
    const res = await api.get('/rooms');
    return res.data.data.rooms;
  },

  getInstruments: async () => {
    const res = await api.get('/instruments');
    return res.data.data.instruments;
  },
};
