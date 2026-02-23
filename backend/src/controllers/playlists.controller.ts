import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const withSongs = {
  songs: {
    orderBy: { order: 'asc' as const },
    include: {
      song: {
        include: {
          sections: {
            orderBy: { order: 'asc' as const },
            include: { lines: { orderBy: { order: 'asc' as const }, include: { chords: true } } },
          },
        },
      },
    },
  },
};

export const getPlaylists = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
      include: withSongs,
    });
    sendSuccess(res, { playlists });
  } catch (err) {
    next(err);
  }
};

export const createPlaylist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const playlist = await prisma.playlist.create({
      data: { name, userId: req.userId! },
      include: withSongs,
    });
    sendSuccess(res, { playlist }, 201);
  } catch (err) {
    next(err);
  }
};

export const updatePlaylist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const existing = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) return sendError(res, 'Playlist not found', 404);
    const playlist = await prisma.playlist.update({
      where: { id: req.params.id },
      data: { name },
      include: withSongs,
    });
    sendSuccess(res, { playlist });
  } catch (err) {
    next(err);
  }
};

export const deletePlaylist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) return sendError(res, 'Playlist not found', 404);
    await prisma.playlist.delete({ where: { id: req.params.id } });
    sendSuccess(res, {});
  } catch (err) {
    next(err);
  }
};

export const addSongToPlaylist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { songId } = z.object({ songId: z.string() }).parse(req.body);
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist || playlist.userId !== req.userId) return sendError(res, 'Playlist not found', 404);

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) return sendError(res, 'Song not found', 404);

    // Upsert to avoid duplicate error
    const existing = await prisma.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId: req.params.id, songId } },
    });
    if (existing) return sendError(res, 'Song already in playlist', 409);

    const count = await prisma.playlistSong.count({ where: { playlistId: req.params.id } });
    await prisma.playlistSong.create({
      data: { playlistId: req.params.id, songId, order: count },
    });

    // Touch updatedAt
    await prisma.playlist.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });

    const updated = await prisma.playlist.findUnique({ where: { id: req.params.id }, include: withSongs });
    sendSuccess(res, { playlist: updated }, 201);
  } catch (err) {
    next(err);
  }
};

export const removeSongFromPlaylist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist || playlist.userId !== req.userId) return sendError(res, 'Playlist not found', 404);

    await prisma.playlistSong.delete({
      where: { playlistId_songId: { playlistId: req.params.id, songId: req.params.songId } },
    });

    await prisma.playlist.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
    const updated = await prisma.playlist.findUnique({ where: { id: req.params.id }, include: withSongs });
    sendSuccess(res, { playlist: updated });
  } catch (err) {
    next(err);
  }
};
