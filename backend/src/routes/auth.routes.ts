import { Router } from 'express';
import passport from '../config/passport';
import { googleCallback, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { env } from '../config/env';

export const authRouter = Router();

authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

authRouter.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=oauth_failed`,
    })(req, res, next);
  },
  googleCallback
);

authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
