import { Router } from 'express';
import {
  getPlaylists, createPlaylist, updatePlaylist, deletePlaylist,
  addSongToPlaylist, removeSongFromPlaylist,
} from '../controllers/playlists.controller';
import { authenticate } from '../middleware/auth';

export const playlistsRouter = Router();

playlistsRouter.get('/', authenticate, getPlaylists);
playlistsRouter.post('/', authenticate, createPlaylist);
playlistsRouter.put('/:id', authenticate, updatePlaylist);
playlistsRouter.delete('/:id', authenticate, deletePlaylist);
playlistsRouter.post('/:id/songs', authenticate, addSongToPlaylist);
playlistsRouter.delete('/:id/songs/:songId', authenticate, removeSongFromPlaylist);
