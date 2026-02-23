import api from './api';
import { Playlist } from '../types';

export const playlistsService = {
  getPlaylists: async (): Promise<Playlist[]> => {
    const res = await api.get<{ success: boolean; data: { playlists: Playlist[] } }>('/playlists');
    return res.data.data.playlists;
  },

  createPlaylist: async (name: string): Promise<Playlist> => {
    const res = await api.post<{ success: boolean; data: { playlist: Playlist } }>('/playlists', { name });
    return res.data.data.playlist;
  },

  updatePlaylist: async (id: string, name: string): Promise<Playlist> => {
    const res = await api.put<{ success: boolean; data: { playlist: Playlist } }>(`/playlists/${id}`, { name });
    return res.data.data.playlist;
  },

  deletePlaylist: async (id: string): Promise<void> => {
    await api.delete(`/playlists/${id}`);
  },

  addSong: async (playlistId: string, songId: string): Promise<Playlist> => {
    const res = await api.post<{ success: boolean; data: { playlist: Playlist } }>(
      `/playlists/${playlistId}/songs`,
      { songId },
    );
    return res.data.data.playlist;
  },

  removeSong: async (playlistId: string, songId: string): Promise<Playlist> => {
    const res = await api.delete<{ success: boolean; data: { playlist: Playlist } }>(
      `/playlists/${playlistId}/songs/${songId}`,
    );
    return res.data.data.playlist;
  },
};
