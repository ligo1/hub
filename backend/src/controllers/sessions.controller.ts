import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, SessionStatus } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const sessionInclude = {
  room: true,
  members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  songs: {
    orderBy: { order: 'asc' as const },
    include: { song: { select: { id: true, title: true, artist: true, artworkUrl: true } } },
  },
};

export const getSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        members: { some: { userId: req.userId } },
      },
      include: sessionInclude,
      orderBy: { startTime: 'asc' },
    });
    sendSuccess(res, { sessions });
  } catch (err) {
    next(err);
  }
};

export const createSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      roomId: z.string(),
      title: z.string(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      memberIds: z.array(z.string()).optional(),
      songIds: z.array(z.string()).optional(),
    });
    const { roomId, title, startTime, endTime, memberIds = [], songIds = [] } = schema.parse(req.body);

    // Conflict detection: room double-booking
    const conflict = await prisma.session.findFirst({
      where: {
        roomId,
        status: { not: SessionStatus.CANCELLED },
        OR: [
          { startTime: { lt: new Date(endTime), gte: new Date(startTime) } },
          { endTime: { gt: new Date(startTime), lte: new Date(endTime) } },
          { startTime: { lte: new Date(startTime) }, endTime: { gte: new Date(endTime) } },
        ],
      },
    });
    if (conflict) return sendError(res, 'Room is already booked for this time slot', 409);

    const allMemberIds = Array.from(new Set([req.userId!, ...memberIds]));

    const session = await prisma.session.create({
      data: {
        roomId,
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: SessionStatus.PLANNED,
        members: {
          create: allMemberIds.map((uid) => ({
            userId: uid,
            instrumentId: 'unknown',
          })),
        },
        songs: {
          create: songIds.map((sid, idx) => ({ songId: sid, order: idx + 1 })),
        },
      },
      include: sessionInclude,
    });
    sendSuccess(res, { session }, 201);
  } catch (err) {
    next(err);
  }
};

export const getSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        room: true,
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, instruments: { include: { instrument: true } } } },
          },
        },
        songs: {
          orderBy: { order: 'asc' },
          include: { song: { select: { id: true, title: true, artist: true, artworkUrl: true } } },
        },
      },
    });
    if (!session) return sendError(res, 'Session not found', 404);
    sendSuccess(res, { session });
  } catch (err) {
    next(err);
  }
};

export const updateSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    });
    const data = schema.parse(req.body);
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
      include: sessionInclude,
    });
    sendSuccess(res, { session });
  } catch (err) {
    next(err);
  }
};

export const deleteSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ userId: z.string(), instrumentId: z.string() });
    const { userId, instrumentId } = schema.parse(req.body);
    const member = await prisma.sessionMember.create({
      data: { sessionId: req.params.id, userId, instrumentId },
    });
    sendSuccess(res, { member }, 201);
  } catch (err) {
    next(err);
  }
};

export const addSong = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ songId: z.string(), order: z.number().int().optional() });
    const { songId, order = 1 } = schema.parse(req.body);
    const sessionSong = await prisma.sessionSong.create({
      data: { sessionId: req.params.id, songId, order },
    });
    sendSuccess(res, { sessionSong }, 201);
  } catch (err) {
    next(err);
  }
};
