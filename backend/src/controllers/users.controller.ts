import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const instrumentSchema = z.object({
  instrumentId: z.string(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']),
});

const availabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    timeSlotStart: z.string(),
    timeSlotEnd: z.string(),
    frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  })
);

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
  instruments: { include: { instrument: true } },
  songWishlist: { include: { song: true } },
  availability: true,
};

export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: userSelect,
    });
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId !== req.params.id) return sendError(res, 'Forbidden', 403);
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: userSelect,
    });
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};

export const addInstrument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId !== req.params.id) return sendError(res, 'Forbidden', 403);
    const { instrumentId, level } = instrumentSchema.parse(req.body);
    const existing = await prisma.userInstrument.findFirst({
      where: { userId: req.params.id, instrumentId },
    });
    if (existing) {
      const ui = await prisma.userInstrument.update({
        where: { id: existing.id },
        data: { level },
        include: { instrument: true },
      });
      return sendSuccess(res, { userInstrument: ui });
    }
    const ui = await prisma.userInstrument.create({
      data: { userId: req.params.id, instrumentId, level },
      include: { instrument: true },
    });
    sendSuccess(res, { userInstrument: ui }, 201);
  } catch (err) {
    next(err);
  }
};

export const removeInstrument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId !== req.params.id) return sendError(res, 'Forbidden', 403);
    await prisma.userInstrument.deleteMany({
      where: { userId: req.params.id, id: req.params.instrumentId },
    });
    sendSuccess(res, { message: 'Instrument removed' });
  } catch (err) {
    next(err);
  }
};

export const getAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const availability = await prisma.availability.findMany({
      where: { userId: req.params.id },
    });
    sendSuccess(res, { availability });
  } catch (err) {
    next(err);
  }
};

export const updateAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId !== req.params.id) return sendError(res, 'Forbidden', 403);
    const slots = availabilitySchema.parse(req.body);
    await prisma.availability.deleteMany({ where: { userId: req.params.id } });
    const availability = await prisma.availability.createMany({
      data: slots.map((s) => ({ ...s, userId: req.params.id })),
    });
    sendSuccess(res, { availability });
  } catch (err) {
    next(err);
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId !== req.params.id) return sendError(res, 'Forbidden', 403);
    const { songId } = z.object({ songId: z.string() }).parse(req.body);
    await prisma.userSong.upsert({
      where: { userId_songId: { userId: req.params.id, songId } },
      update: {},
      create: { userId: req.params.id, songId },
    });
    sendSuccess(res, { message: 'Song added to wishlist' }, 201);
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId !== req.params.id) return sendError(res, 'Forbidden', 403);
    await prisma.userSong.deleteMany({
      where: { userId: req.params.id, songId: req.params.songId },
    });
    sendSuccess(res, { message: 'Song removed from wishlist' });
  } catch (err) {
    next(err);
  }
};
