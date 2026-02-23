import api from './api';
import { Song, SongWithSections, ItunesTrack } from '../types';

export interface EditorSectionPayload {
  name: string;
  lines: Array<{
    text: string;
    timestamp: number | null;
    chords: Array<{ wordIndex: number; chord: string }>;
  }>;
}

export const songsService = {
  getSongs: async (params?: { search?: string; genre?: string; key?: string }) => {
    const res = await api.get<{ success: boolean; data: { songs: Song[] } }>('/songs', { params });
    return res.data.data.songs;
  },

  getSong: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { song: SongWithSections } }>(`/songs/${id}`);
    return res.data.data.song;
  },

  getSongSections: async (id: string) => {
    const res = await api.get(`/songs/${id}/sections`);
    return res.data.data.sections;
  },

  searchItunes: async (query: string): Promise<ItunesTrack[]> => {
    const res = await api.get<{ success: boolean; data: { tracks: ItunesTrack[] } }>(
      '/songs/search/itunes',
      { params: { q: query } }
    );
    return res.data.data.tracks;
  },

  findOrCreateFromItunes: async (track: ItunesTrack): Promise<Song> => {
    const res = await api.post<{ success: boolean; data: { song: Song } }>(
      '/songs/from-itunes',
      track
    );
    return res.data.data.song;
  },

  updateLyrics: async (songId: string, lyricsText: string): Promise<SongWithSections> => {
    const res = await api.put<{ success: boolean; data: { song: SongWithSections } }>(
      `/songs/${songId}/lyrics`,
      { lyricsText }
    );
    return res.data.data.song;
  },

  createSong: async (data: { title: string; artist: string; genre: string; key: string; bpm: number }): Promise<Song> => {
    const res = await api.post<{ success: boolean; data: { song: Song } }>('/songs', data);
    return res.data.data.song;
  },

  updateSongMeta: async (id: string, data: { title?: string; artist?: string; genre?: string; key?: string; bpm?: number; duration?: number }): Promise<Song> => {
    const res = await api.put<{ success: boolean; data: { song: Song } }>(`/songs/${id}`, data);
    return res.data.data.song;
  },

  saveSongSections: async (songId: string, sections: EditorSectionPayload[]): Promise<SongWithSections> => {
    const res = await api.put<{ success: boolean; data: { song: SongWithSections } }>(
      `/songs/${songId}/sections`,
      { sections }
    );
    return res.data.data.song;
  },
};
