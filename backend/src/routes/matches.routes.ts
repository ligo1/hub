import { Router } from 'express';
import { getMatches, computeMatches } from '../controllers/matches.controller';
import { authenticate } from '../middleware/auth';

export const matchesRouter = Router();

matchesRouter.get('/', authenticate, getMatches);
matchesRouter.post('/compute', authenticate, computeMatches);
