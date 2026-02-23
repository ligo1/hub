import { Router } from 'express';
import { getSongs, getSong, createSong, getSongSections, searchItunesHandler, findOrCreateFromItunes, updateLyrics, updateSongMeta, saveSections } from '../controllers/songs.controller';
import { authenticate } from '../middleware/auth';

export const songsRouter = Router();

// iTunes routes must come before /:id to avoid Express treating "search" as an id
songsRouter.get('/search/itunes', authenticate, searchItunesHandler);
songsRouter.post('/from-itunes', authenticate, findOrCreateFromItunes);

songsRouter.get('/', authenticate, getSongs);
songsRouter.get('/:id', authenticate, getSong);
songsRouter.post('/', authenticate, createSong);
songsRouter.get('/:id/sections', authenticate, getSongSections);
songsRouter.put('/:id/lyrics', authenticate, updateLyrics);
songsRouter.put('/:id/sections', authenticate, saveSections);
songsRouter.put('/:id', authenticate, updateSongMeta);
