import { Router } from 'express';
import {
  getSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  addMember,
  addSong,
} from '../controllers/sessions.controller';
import { authenticate } from '../middleware/auth';

export const sessionsRouter = Router();

sessionsRouter.get('/', authenticate, getSessions);
sessionsRouter.post('/', authenticate, createSession);
sessionsRouter.get('/:id', authenticate, getSession);
sessionsRouter.put('/:id', authenticate, updateSession);
sessionsRouter.delete('/:id', authenticate, deleteSession);
sessionsRouter.post('/:id/members', authenticate, addMember);
sessionsRouter.post('/:id/songs', authenticate, addSong);
