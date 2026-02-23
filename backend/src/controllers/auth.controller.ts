import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const secure = env.NODE_ENV === 'production';
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

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

export const googleCallback = (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const { accessToken, refreshToken } = generateTokens(user.id);
  setCookies(res, accessToken, refreshToken);
  res.redirect(env.FRONTEND_URL || 'http://localhost:5173');
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  sendSuccess(res, { message: 'Logged out successfully' });
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: userSelect,
    });

    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};
