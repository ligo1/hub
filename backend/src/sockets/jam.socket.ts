import { Server, Socket } from 'socket.io';

interface SessionState {
  currentLineIndex: number;
  semitones: number;
  bpm: number;
  members: string[];
}

const sessionStates = new Map<string, SessionState>();

function getOrCreateState(sessionId: string): SessionState {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, {
      currentLineIndex: 0,
      semitones: 0,
      bpm: 80,
      members: [],
    });
  }
  return sessionStates.get(sessionId)!;
}

export function setupJamSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('join_session', ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      socket.join(`session:${sessionId}`);
      const state = getOrCreateState(sessionId);

      if (!state.members.includes(userId)) {
        state.members.push(userId);
      }

      // Send current state to the newly joined user
      socket.emit('session_state', {
        currentLineIndex: state.currentLineIndex,
        semitones: state.semitones,
        bpm: state.bpm,
        members: state.members,
      });

      // Broadcast to others
      socket.to(`session:${sessionId}`).emit('member_joined', { userId });
      console.log(`[Socket] User ${userId} joined session ${sessionId}`);
    });

    socket.on('conductor_advance', ({ sessionId, lineIndex }: { sessionId: string; lineIndex: number }) => {
      const state = getOrCreateState(sessionId);
      state.currentLineIndex = lineIndex;
      io.to(`session:${sessionId}`).emit('line_changed', { lineIndex });
    });

    socket.on('transpose_change', ({ sessionId, semitones }: { sessionId: string; semitones: number }) => {
      const state = getOrCreateState(sessionId);
      state.semitones = semitones;
      io.to(`session:${sessionId}`).emit('session_state', {
        currentLineIndex: state.currentLineIndex,
        semitones: state.semitones,
        bpm: state.bpm,
        members: state.members,
      });
    });

    socket.on('bpm_change', ({ sessionId, bpm }: { sessionId: string; bpm: number }) => {
      const state = getOrCreateState(sessionId);
      state.bpm = bpm;
      io.to(`session:${sessionId}`).emit('session_state', {
        currentLineIndex: state.currentLineIndex,
        semitones: state.semitones,
        bpm: state.bpm,
        members: state.members,
      });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('session:')) {
          const sessionId = room.replace('session:', '');
          // We don't have userId here, so broadcast generic leave
          socket.to(room).emit('member_left', { socketId: socket.id });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}
