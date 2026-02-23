import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // no rate limiting in dev at all
  message: { success: false, error: 'Too many requests, please try again later.' },
});
