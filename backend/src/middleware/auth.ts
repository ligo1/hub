import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;

  if (!token) {
    return sendError(res, 'Unauthorized', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};
