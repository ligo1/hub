import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { computeUserMatches } from '../services/match.service';

const prisma = new PrismaClient();

export const getMatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: req.userId }, { userBId: req.userId }],
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
            instruments: { include: { instrument: true } },
            songWishlist: { include: { song: true } },
            availability: true,
          },
        },
        userB: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
            instruments: { include: { instrument: true } },
            songWishlist: { include: { song: true } },
            availability: true,
          },
        },
      },
      orderBy: { score: 'desc' },
    });

    // Return the "other" user in each match
    const normalizedMatches = matches.map((m) => ({
      id: m.id,
      score: m.score,
      reasons: m.reasons,
      createdAt: m.createdAt,
      user: m.userAId === req.userId ? m.userB : m.userA,
    }));

    sendSuccess(res, { matches: normalizedMatches });
  } catch (err) {
    next(err);
  }
};

export const computeMatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const matches = await computeUserMatches(req.userId!);
    sendSuccess(res, { matches, count: matches.length });
  } catch (err) {
    next(err);
  }
};
