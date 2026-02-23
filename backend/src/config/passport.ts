import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const prisma = new PrismaClient();

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email provided by Google'));

          const googleId = profile.id;
          const name = profile.displayName || email;
          const avatarUrl = profile.photos?.[0]?.value || null;

          // Find by googleId first
          let user = await prisma.user.findUnique({ where: { googleId } });

          if (!user) {
            // Try to link to existing account with same email
            const byEmail = await prisma.user.findUnique({ where: { email } });
            if (byEmail) {
              user = await prisma.user.update({
                where: { id: byEmail.id },
                data: { googleId },
              });
            } else {
              // Create new user
              user = await prisma.user.create({
                data: { email, googleId, name, avatarUrl },
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

export default passport;
