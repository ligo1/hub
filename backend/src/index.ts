import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { songsRouter } from './routes/songs.routes';
import { sessionsRouter } from './routes/sessions.routes';
import { roomsRouter } from './routes/rooms.routes';
import { matchesRouter } from './routes/matches.routes';
import { instrumentsRouter } from './routes/instruments.routes';
import { projectsRouter } from './routes/projects.routes';
import { tasksRouter } from './routes/tasks.routes';
import { notesRouter } from './routes/notes.routes';
import { playlistsRouter } from './routes/playlists.routes';
import { setupJamSocket } from './sockets/jam.socket';
import { env } from './config/env';
import passport from './config/passport';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const allowedOrigins = [
  env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:80',
  'http://localhost',
];

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(rateLimiter);

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/songs', songsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/instruments', instrumentsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/notes', notesRouter);
app.use('/api/playlists', playlistsRouter);

app.get('/api/health', (_, res) => res.json({ success: true, data: { status: 'ok' } }));

setupJamSocket(io);
app.use(errorHandler);

const PORT = parseInt(env.PORT, 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`JamSync backend running on port ${PORT} [${env.NODE_ENV}]`);
});

export { io };
