import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { searchItunes as itunesSearch } from '../services/itunes.service';
import { getLrcLibLyrics } from '../services/lrclib.service';
import { searchSongsterr, getSongsterrData } from '../services/songsterr.service';

const prisma = new PrismaClient();

export const getSongs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, genre, key } = req.query as Record<string, string | undefined>;
    const songs = await prisma.song.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { artist: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          genre ? { genre: { equals: genre, mode: 'insensitive' } } : {},
          key ? { key: { equals: key, mode: 'insensitive' } } : {},
        ],
      },
      orderBy: { title: 'asc' },
    });
    sendSuccess(res, { songs });
  } catch (err) {
    next(err);
  }
};

export const getSong = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lines: {
              orderBy: { order: 'asc' },
              include: { chords: true },
            },
          },
        },
      },
    });
    if (!song) return sendError(res, 'Song not found', 404);
    sendSuccess(res, { song });
  } catch (err) {
    next(err);
  }
};

export const createSong = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      title: z.string(),
      artist: z.string().default(''),
      genre: z.string().default(''),
      key: z.string().default(''),
      bpm: z.number().int().nonnegative().default(0),
    });
    const data = schema.parse(req.body);
    const song = await prisma.song.create({ data });
    sendSuccess(res, { song }, 201);
  } catch (err) {
    next(err);
  }
};

export const updateSongMeta = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      artist: z.string().optional(),
      genre: z.string().optional(),
      key: z.string().optional(),
      bpm: z.number().int().nonnegative().optional(),
    });
    const data = schema.parse(req.body);
    const existing = await prisma.song.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Song not found', 404);
    const song = await prisma.song.update({ where: { id: req.params.id }, data });
    sendSuccess(res, { song });
  } catch (err) {
    next(err);
  }
};

export const saveSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const songId = req.params.id;
    const schema = z.object({
      sections: z.array(
        z.object({
          name: z.string(),
          lines: z.array(
            z.object({
              text: z.string(),
              timestamp: z.number().nullable().optional(),
              chords: z.array(
                z.object({
                  wordIndex: z.number().int().nonnegative(),
                  chord: z.string(),
                }),
              ),
            }),
          ),
        }),
      ),
    });
    const { sections } = schema.parse(req.body);

    const existing = await prisma.song.findUnique({ where: { id: songId } });
    if (!existing) return sendError(res, 'Song not found', 404);

    // Replace all sections (cascades to lines + chords via Prisma schema)
    await prisma.songSection.deleteMany({ where: { songId } });

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      const section = await prisma.songSection.create({
        data: { songId, name: sec.name, order: sIdx },
      });

      for (let lIdx = 0; lIdx < sec.lines.length; lIdx++) {
        const l = sec.lines[lIdx];
        const words = l.text.trim().split(/\s+/).filter(Boolean);
        const line = await prisma.lyricLine.create({
          data: {
            sectionId: section.id,
            lyricText: l.text,
            order: lIdx,
            startTime: l.timestamp ?? undefined,
          },
        });

        for (const c of l.chords) {
          if (!c.chord.trim()) continue;
          // Normalize wordIndex → beatPosition (0–1) for JamMode compatibility
          const beatPosition = words.length > 1 ? c.wordIndex / (words.length - 1) : 0;
          await prisma.chordBeat.create({
            data: { lineId: line.id, chord: c.chord, beatPosition },
          });
        }
      }
    }

    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: { lines: { orderBy: { order: 'asc' }, include: { chords: true } } },
        },
      },
    });
    sendSuccess(res, { song });
  } catch (err) {
    next(err);
  }
};

export const getSongSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = await prisma.songSection.findMany({
      where: { songId: req.params.id },
      orderBy: { order: 'asc' },
      include: {
        lines: {
          orderBy: { order: 'asc' },
          include: { chords: true },
        },
      },
    });
    sendSuccess(res, { sections });
  } catch (err) {
    next(err);
  }
};

export const updateLyrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lyricsText } = req.body as { lyricsText?: string };
    const songId = req.params.id;

    const existing = await prisma.song.findUnique({ where: { id: songId } });
    if (!existing) return sendError(res, 'Song not found', 404);

    // Replace all sections (cascades to lines + chords)
    await prisma.songSection.deleteMany({ where: { songId } });

    if (lyricsText?.trim()) {
      const rawLines = lyricsText.split('\n');
      const section = await prisma.songSection.create({
        data: { songId, name: 'Lyrics', order: 0 },
      });
      let order = 0;
      for (const raw of rawLines) {
        await prisma.lyricLine.create({
          data: { sectionId: section.id, lyricText: raw, order: order++ },
        });
      }
    }

    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: { lines: { orderBy: { order: 'asc' }, include: { chords: true } } },
        },
      },
    });
    sendSuccess(res, { song });
  } catch (err) {
    next(err);
  }
};

// ─── iTunes endpoints ──────────────────────────────────────────────────────────

export const searchItunesHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (!q) return sendSuccess(res, { tracks: [] });
    const tracks = await itunesSearch(q);
    sendSuccess(res, { tracks });
  } catch (err) {
    next(err);
  }
};

export const findOrCreateFromItunes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      trackId: z.number().int(),
      trackName: z.string(),
      artistName: z.string(),
      primaryGenreName: z.string().default(''),
      artworkUrl100: z.string().default(''),
      previewUrl: z.string().optional(),
      trackTimeMillis: z.number().optional(),
      collectionName: z.string().optional(),
    });
    const track = schema.parse(req.body);

    // Return existing song if already imported
    const existing = await prisma.song.findUnique({
      where: { itunesTrackId: track.trackId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: { lines: { orderBy: { order: 'asc' }, include: { chords: true } } },
        },
      },
    });
    if (existing) return sendSuccess(res, { song: existing });

    // Create song with iTunes metadata
    const song = await prisma.song.create({
      data: {
        title: track.trackName,
        artist: track.artistName,
        genre: track.primaryGenreName,
        artworkUrl: track.artworkUrl100 || null,
        previewUrl: track.previewUrl || null,
        itunesTrackId: track.trackId,
        duration: track.trackTimeMillis ?? null,
        key: '',
        bpm: 0,
      },
    });

    // Enrich with LRCLIB (lyrics) + Songsterr (BPM/key/chords) in parallel (best-effort)
    const [lrclibResult, songsterrId] = await Promise.all([
      getLrcLibLyrics(
        track.trackName,
        track.artistName,
        track.collectionName,
        track.trackTimeMillis,
      ),
      searchSongsterr(track.artistName, track.trackName),
    ]);

    const songsterrData = songsterrId ? await getSongsterrData(songsterrId) : null;

    // Update BPM + key + songsterrId from Songsterr
    if (songsterrData) {
      await prisma.song.update({
        where: { id: song.id },
        data: {
          bpm: songsterrData.bpm || 0,
          key: songsterrData.key || '',
          songsterrId: songsterrData.songsterrId,
        },
      });
    }

    // Populate sections + lines from LRCLIB (with LRC timestamps stored as startTime)
    if (lrclibResult) {
      for (let sIdx = 0; sIdx < lrclibResult.sections.length; sIdx++) {
        const sec = lrclibResult.sections[sIdx];
        const section = await prisma.songSection.create({
          data: { songId: song.id, name: sec.name, order: sIdx },
        });

        // Track global line index for Songsterr chord mapping
        let globalLineIdx = lrclibResult.sections
          .slice(0, sIdx)
          .reduce((acc, s) => acc + s.lines.length, 0);

        for (let lIdx = 0; lIdx < sec.lines.length; lIdx++) {
          const lrcLine = sec.lines[lIdx];
          const line = await prisma.lyricLine.create({
            data: {
              sectionId: section.id,
              lyricText: lrcLine.text,
              order: lIdx,
              startTime: lrcLine.startTime ?? undefined,
            },
          });

          // Attach chords from Songsterr (measure index ≈ global lyric line index)
          if (songsterrData) {
            const lineChords = songsterrData.chords.filter(
              (c) => c.lineIndex === globalLineIdx && c.chord,
            );
            for (const c of lineChords) {
              await prisma.chordBeat.create({
                data: { lineId: line.id, chord: c.chord, beatPosition: c.beatPosition },
              });
            }
          }

          globalLineIdx++;
        }
      }
    }

    // Re-fetch with sections included
    const enriched = await prisma.song.findUnique({
      where: { id: song.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: { lines: { orderBy: { order: 'asc' }, include: { chords: true } } },
        },
      },
    });

    sendSuccess(res, { song: enriched }, 201);
  } catch (err) {
    next(err);
  }
};
