export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
export type Frequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type SessionStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Instrument {
  id: string;
  name: string;
  icon: string;
}

export interface UserInstrument {
  id: string;
  instrument: Instrument;
  instrumentId: string;
  level: SkillLevel;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  key: string;
  bpm: number;
  artworkUrl?: string;
  previewUrl?: string;
  itunesTrackId?: number;
  songsterrId?: number;
  duration?: number;
}

export interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  primaryGenreName: string;
  artworkUrl100: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  collectionName?: string;
}

export interface ChordBeat {
  id: string;
  chord: string;
  beatPosition: number;
}

export interface LyricLine {
  id: string;
  order: number;
  lyricText: string;
  startTime?: number | null; // seconds from track start (from LRC timestamps)
  chords: ChordBeat[];
}

export interface SongSection {
  id: string;
  name: string;
  order: number;
  lines: LyricLine[];
}

export interface SongWithSections extends Song {
  sections: SongSection[];
}

export interface UserSong {
  userId: string;
  songId: string;
  song: Song;
}

export interface Availability {
  id: string;
  dayOfWeek: number;
  timeSlotStart: string;
  timeSlotEnd: string;
  frequency: Frequency;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  instruments: UserInstrument[];
  songWishlist: UserSong[];
  availability: Availability[];
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface SessionMember {
  sessionId: string;
  userId: string;
  instrumentId: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface SessionSong {
  sessionId: string;
  songId: string;
  order: number;
  song?: { id: string; title: string; artist: string; artworkUrl?: string };
}

export interface Session {
  id: string;
  roomId: string;
  room: Room;
  title: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  members: SessionMember[];
  songs: SessionSong[];
}

export interface Match {
  id: string;
  score: number;
  reasons: string[];
  createdAt: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PlaylistSong {
  playlistId: string;
  songId: string;
  order: number;
  song: SongWithSections;
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  songs: PlaylistSong[];
  createdAt: string;
  updatedAt: string;
}

// ─── Hub types ────────────────────────────────────────────────────────────────

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  color: string;
  icon: string;
  startDate?: string | null;
  dueDate?: string | null;
  progress: number;
  tasks: Task[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

// ─── Socket.io event types ────────────────────────────────────────────────────

// Socket.io event types
export interface SessionState {
  currentLineIndex: number;
  semitones: number;
  bpm: number;
  members: string[];
}
