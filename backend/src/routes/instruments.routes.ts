import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
export const instrumentsRouter = Router();

instrumentsRouter.get('/', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const instruments = await prisma.instrument.findMany({ orderBy: { name: 'asc' } });
    sendSuccess(res, { instruments });
  } catch (err) {
    next(err);
  }
});
