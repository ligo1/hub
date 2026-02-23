import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, SessionStatus } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } });
    sendSuccess(res, { rooms });
  } catch (err) {
    next(err);
  }
};

export const createRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ name: z.string(), capacity: z.number().int().positive() });
    const data = schema.parse(req.body);
    const room = await prisma.room.create({ data });
    sendSuccess(res, { room }, 201);
  } catch (err) {
    next(err);
  }
};

export const getRoomSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query as { date?: string };
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const sessions = await prisma.session.findMany({
      where: {
        roomId: req.params.id,
        status: { not: SessionStatus.CANCELLED },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
      orderBy: { startTime: 'asc' },
    });
    sendSuccess(res, { sessions });
  } catch (err) {
    next(err);
  }
};
