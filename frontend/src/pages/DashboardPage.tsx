import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Play, Users, Music2, MapPin, Clock,
  ChevronDown, ChevronUp, UserPlus, ListMusic,
  Calendar, X, Star, Loader2,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { sessionsService } from '../services/sessions.service';
import { matchesService } from '../services/matches.service';
import { usersService } from '../services/users.service';
import { songsService } from '../services/songs.service';
import { playlistsService } from '../services/playlists.service';
import { Session, Match, Room, Song, ItunesTrack, Playlist } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

type Tab = 'set' | 'manage' | 'play';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am–10pm

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-accent-blue/20 text-accent-blue-light border-accent-blue/30',
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  COMPLETED: 'bg-white/10 text-white/40 border-white/10',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-400/30',
};

const Countdown = ({ target }: { target: string }) => {
  const [diff, setDiff] = useState('');
  useEffect(() => {
    const update = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) { setDiff('Starting now'); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setDiff(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [target]);
  return <span>{diff}</span>;
};

// ─── SET SESSION TAB ──────────────────────────────────────────────────────────

const SetSessionTab = ({
  rooms, matches, userWishlist, onCreated,
}: {
  rooms: Room[];
  matches: Match[];
  userWishlist: { songId: string; song: Song }[];
  onCreated: (s: Session) => void;
}) => {
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    roomId: '',
    date: new Date().toISOString().split('T')[0],
    startHour: '18',
    endHour: '20',
  });
  const [members, setMembers] = useState<Match[]>([]);
  const [setlist, setSetlist] = useState<Song[]>([]);
  const [songSearch, setSongSearch] = useState('');
  const [songResults, setSongResults] = useState<ItunesTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingSongId, setAddingSongId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [songRatings] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('jam_ratings') || '{}'); } catch { return {}; }
  });
  // Playlist import
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const playlistPickerRef = useRef<HTMLDivElement>(null);

  // Debounced live search
  const debouncedSongSearch = useDebounce(songSearch, 400);
  useEffect(() => {
    if (!debouncedSongSearch.trim()) { setSongResults([]); return; }
    setSearching(true);
    songsService.searchItunes(debouncedSongSearch)
      .then(res => setSongResults(res))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedSongSearch]);

  // Close playlist picker on outside click
  useEffect(() => {
    if (!showPlaylistPicker) return;
    const handler = (e: MouseEvent) => {
      if (playlistPickerRef.current && !playlistPickerRef.current.contains(e.target as Node))
        setShowPlaylistPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPlaylistPicker]);

  const openPlaylistPicker = async () => {
    setShowPlaylistPicker(v => !v);
    if (!showPlaylistPicker) {
      setLoadingPlaylists(true);
      playlistsService.getPlaylists().then(setPlaylists).finally(() => setLoadingPlaylists(false));
    }
  };

  const addFromPlaylist = (pl: Playlist) => {
    const newSongs = pl.songs
      .map(ps => ps.song as unknown as Song)
      .filter(s => !setlist.find(sl => sl.id === s.id));
    if (!newSongs.length) { toast.error(`All songs from "${pl.name}" already in setlist`); return; }
    setSetlist(prev => [...prev, ...newSongs]);
    setShowPlaylistPicker(false);
    toast.success(`Added ${newSongs.length} song${newSongs.length > 1 ? 's' : ''} from "${pl.name}"`);
  };

  const filteredResults = (minRating > 0
    ? songResults.filter((t) => (songRatings[t.trackId] ?? 0) >= minRating)
    : songResults
  ).filter(t => !setlist.find(sl => sl.itunesTrackId === t.trackId));

  const addSong = async (track: ItunesTrack) => {
    if (setlist.find((s) => s.itunesTrackId === track.trackId)) return;
    setSongResults([]); setSongSearch('');
    setAddingSongId(track.trackId);
    try {
      const song = await songsService.findOrCreateFromItunes(track);
      setSetlist((prev) => [...prev, song]);
    } finally {
      setAddingSongId(null);
    }
  };

  const addFromWishlist = (song: Song) => {
    if (setlist.find((s) => s.id === song.id)) return;
    setSetlist((prev) => [...prev, song]);
  };

  const toggleMember = (match: Match) => {
    if (members.find((m) => m.id === match.id)) {
      setMembers((prev) => prev.filter((m) => m.id !== match.id));
    } else {
      setMembers((prev) => [...prev, match]);
    }
  };

  const moveSong = (idx: number, dir: -1 | 1) => {
    const newList = [...setlist];
    const target = idx + dir;
    if (target < 0 || target >= newList.length) return;
    [newList[idx], newList[target]] = [newList[target], newList[idx]];
    setSetlist(newList);
  };

  const handleCreate = async () => {
    if (!form.title || !form.roomId || !form.date) {
      toast.error('Title, room and date are required');
      return;
    }
    setSaving(true);
    try {
      const startTime = new Date(`${form.date}T${form.startHour.padStart(2, '0')}:00:00`).toISOString();
      const endTime = new Date(`${form.date}T${form.endHour.padStart(2, '0')}:00:00`).toISOString();
      const session = await sessionsService.createSession({
        title: form.title,
        roomId: form.roomId,
        startTime,
        endTime,
        memberIds: members.map((m) => m.user.id),
        songIds: setlist.map((s) => s.id),
      });
      onCreated(session);
      toast.success('Session created!');
      setForm({ title: '', roomId: '', date: new Date().toISOString().split('T')[0], startHour: '18', endHour: '20' });
      setMembers([]);
      setSetlist([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create session');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Title */}
      <Input
        label="Session Title"
        placeholder="Friday Rock Night"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />

      {/* Room */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Where</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setForm((f) => ({ ...f, roomId: room.id }))}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                form.roomId === room.id
                  ? 'bg-accent-purple/20 border-accent-purple/50 text-white'
                  : 'bg-surface-700 border-white/5 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${form.roomId === room.id ? 'bg-accent-purple/30' : 'bg-surface-600'}`}>
                <MapPin size={14} className={form.roomId === room.id ? 'text-accent-purple-light' : 'text-white/40'} />
              </div>
              <div>
                <p className="font-medium text-sm">{room.name}</p>
                <p className="text-xs text-white/40">Capacity: {room.capacity}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* When */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">When</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <div>
            <label className="block text-xs text-white/40 mb-1">Start</label>
            <select
              className="w-full bg-surface-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-purple-light"
              value={form.startHour}
              onChange={(e) => setForm((f) => ({ ...f, startHour: e.target.value }))}
              aria-label="Start hour"
            >
              {HOURS.map((h) => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">End</label>
            <select
              className="w-full bg-surface-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-purple-light"
              value={form.endHour}
              onChange={(e) => setForm((f) => ({ ...f, endHour: e.target.value }))}
              aria-label="End hour"
            >
              {HOURS.map((h) => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          <span className="flex items-center gap-1.5"><UserPlus size={14} /> Invite Members</span>
        </label>
        {matches.length === 0 ? (
          <p className="text-white/30 text-sm">No matches found yet. Find musicians in the Match tab.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {matches.map((match) => {
              const added = !!members.find((m) => m.id === match.id);
              return (
                <button
                  key={match.id}
                  onClick={() => toggleMember(match)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${
                    added
                      ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purple-light'
                      : 'bg-surface-700 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <Avatar src={match.user.avatarUrl} name={match.user.name} size="xs" />
                  {match.user.name}
                  {added && <X size={12} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Setlist builder */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          <span className="flex items-center gap-1.5"><ListMusic size={14} /> Setlist</span>
        </label>

        {/* Search + rating filter + playlist picker */}
        <div className="relative mb-2">
          <div className="flex gap-2 mb-1.5">
            <div className="flex-1">
              <Input
                icon={searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                placeholder="Search iTunes… (live)"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
              />
            </div>
            {/* From Playlist button */}
            <div className="relative" ref={playlistPickerRef}>
              <button
                onClick={openPlaylistPicker}
                title="Add songs from a playlist"
                className={`flex items-center gap-1.5 h-full px-3 rounded-xl border text-sm font-medium transition-all ${
                  showPlaylistPicker
                    ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple-light'
                    : 'bg-surface-700 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                }`}
              ><ListMusic size={14} /><span className="hidden sm:inline">Playlist</span></button>

              <AnimatePresence>
                {showPlaylistPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1.5 w-72 bg-surface-800 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="px-3 py-2.5 border-b border-white/5 text-xs font-medium text-white/50">Add songs from playlist</div>
                    {loadingPlaylists ? (
                      <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-white/30" /></div>
                    ) : playlists.length === 0 ? (
                      <div className="px-4 py-5 text-center text-sm text-white/30">No playlists yet</div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto py-1">
                        {playlists.map(pl => (
                          <div key={pl.id}>
                            <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors">
                              <button
                                onClick={() => setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id)}
                                className="flex-1 flex items-center gap-2 text-left min-w-0"
                              >
                                <ListMusic size={13} className="text-accent-purple-light shrink-0" />
                                <span className="text-sm text-white/80 truncate">{pl.name}</span>
                                <span className="text-xs text-white/30 shrink-0">{pl.songs.length}</span>
                                {expandedPlaylist === pl.id ? <ChevronUp size={12} className="text-white/30 shrink-0" /> : <ChevronDown size={12} className="text-white/30 shrink-0" />}
                              </button>
                              <button
                                onClick={() => addFromPlaylist(pl)}
                                className="shrink-0 px-2 py-1 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 rounded-lg text-accent-purple-light text-xs font-medium"
                              >Add all</button>
                            </div>
                            {expandedPlaylist === pl.id && pl.songs.length > 0 && (
                              <div className="pl-8 pr-3 pb-1 space-y-0.5">
                                {pl.songs.map(ps => {
                                  const inSet = !!setlist.find(s => s.id === ps.songId);
                                  return (
                                    <button
                                      key={ps.songId}
                                      onClick={() => {
                                        if (!inSet) {
                                          setSetlist(prev => [...prev, ps.song as unknown as Song]);
                                        }
                                      }}
                                      disabled={inSet}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-40 text-left transition-colors"
                                    >
                                      <span className="text-xs text-white/70 flex-1 truncate">{ps.song.title}</span>
                                      {inSet
                                        ? <span className="text-[10px] text-accent-purple-light shrink-0">added</span>
                                        : <Plus size={10} className="text-white/30 shrink-0" />
                                      }
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Min-rating filter chips */}
            <div className="flex items-center gap-1 bg-surface-700 rounded-xl px-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMinRating(n)}
                  className={`p-1 rounded transition-colors ${minRating === n ? 'text-accent-gold' : 'text-white/20 hover:text-white/50'}`}
                  aria-label={n === 0 ? 'Show all' : `${n}+ stars`}
                  title={n === 0 ? 'All songs' : `${n}+ stars only`}
                >
                  {n === 0
                    ? <span className="text-xs font-medium px-0.5">All</span>
                    : <Star size={13} className={n <= minRating ? 'fill-accent-gold' : ''} />
                  }
                </button>
              ))}
            </div>
          </div>
          {(filteredResults.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-700 rounded-xl border border-white/10 overflow-hidden z-10 shadow-xl">
              {searching ? (
                <div className="px-4 py-3 text-sm text-white/40">Searching iTunes...</div>
              ) : filteredResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/40">No songs match that rating</div>
              ) : (
                filteredResults.slice(0, 6).map((track) => (
                  <button
                    key={track.trackId}
                    onClick={() => addSong(track)}
                    disabled={addingSongId === track.trackId}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-600 transition-colors text-left disabled:opacity-50"
                  >
                    {track.artworkUrl100 ? (
                      <img src={track.artworkUrl100} alt={track.trackName} className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <Music2 size={14} className="text-accent-purple-light flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{track.trackName}</p>
                      <p className="text-xs text-white/40">{track.artistName}</p>
                    </div>
                    {addingSongId === track.trackId && (
                      <span className="text-xs text-white/40 flex-shrink-0">Adding...</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Wishlist quick-add */}
        {userWishlist.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-white/40 mb-1.5">From your wishlist:</p>
            <div className="flex flex-wrap gap-1.5">
              {userWishlist.map(({ songId, song }) => {
                const inSet = setlist.find((s) => s.id === songId);
                return (
                  <button
                    key={songId}
                    onClick={() => addFromWishlist(song)}
                    disabled={!!inSet}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      inSet
                        ? 'bg-accent-purple/10 border-accent-purple/20 text-accent-purple-light/50 cursor-default'
                        : 'bg-surface-700 border-white/10 text-white/60 hover:border-accent-purple/40 hover:text-white'
                    }`}
                  >
                    {song.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current setlist */}
        {setlist.length > 0 ? (
          <div className="space-y-1.5">
            {setlist.map((song, idx) => (
              <div key={song.id} className="flex items-center gap-2 bg-surface-700 rounded-xl px-3 py-2">
                <span className="text-white/30 text-xs w-5 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{song.title}</p>
                  <p className="text-xs text-white/40">{song.artist}{song.key ? ` · ${song.key}` : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveSong(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-white/30 hover:text-white disabled:opacity-20 transition-colors"
                    aria-label="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveSong(idx, 1)}
                    disabled={idx === setlist.length - 1}
                    className="p-1 text-white/30 hover:text-white disabled:opacity-20 transition-colors"
                    aria-label="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => setSetlist((prev) => prev.filter((s) => s.id !== song.id))}
                    className="p-1 text-white/20 hover:text-red-400 transition-colors"
                    aria-label="Remove song"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm">No songs added yet</p>
        )}
      </div>

      <Button onClick={handleCreate} loading={saving} icon={<Plus size={14} />} className="w-full sm:w-auto">
        Create Session
      </Button>
    </div>
  );
};

// ─── MANAGE TAB ───────────────────────────────────────────────────────────────

const ManageTab = ({
  sessions, onRefresh,
}: {
  sessions: Session[];
  onRefresh: () => void;
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [importSearch, setImportSearch] = useState('');
  const [importResults, setImportResults] = useState<ItunesTrack[]>([]);
  const [importing, setImporting] = useState(false);
  const [importingTrackId, setImportingTrackId] = useState<number | null>(null);

  const upcoming = sessions.filter((s) => s.status === 'PLANNED' || s.status === 'ACTIVE');
  const past = sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'CANCELLED');

  const debouncedImportSearch = useDebounce(importSearch, 400);
  useEffect(() => {
    if (!debouncedImportSearch.trim()) { setImportResults([]); return; }
    setImporting(true);
    songsService.searchItunes(debouncedImportSearch)
      .then(setImportResults)
      .catch(() => {})
      .finally(() => setImporting(false));
  }, [debouncedImportSearch]);

  const handleImportSong = async (sessionId: string, track: ItunesTrack, session: Session) => {
    setImportingTrackId(track.trackId);
    try {
      const song = await songsService.findOrCreateFromItunes(track);
      if (session.songs.find((ss) => ss.songId === song.id)) return;
      await sessionsService.addSong(sessionId, { songId: song.id });
      toast.success(`${song.title} added to session`);
      setImportSearch('');
      setImportResults([]);
      onRefresh();
    } catch {
      toast.error('Failed to add song');
    } finally {
      setImportingTrackId(null);
    }
  };

  const SessionCard = ({ session }: { session: Session }) => {
    const isOpen = expanded === session.id;
    return (
      <Card className="overflow-hidden">
        <div
          className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setExpanded(isOpen ? null : session.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[session.status]}`}>
                  {session.status}
                </span>
                <h3 className="font-semibold text-white truncate">{session.title}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                <span className="flex items-center gap-1"><MapPin size={11} />{session.room.name}</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' '}{new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1"><Users size={11} />{session.members.length}</span>
                <span className="flex items-center gap-1"><Music2 size={11} />{session.songs.length} songs</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(session.status === 'PLANNED' || session.status === 'ACTIVE') && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/jam/${session.id}`); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-purple/20 text-accent-purple-light hover:bg-accent-purple/30 transition-all text-xs font-medium"
                >
                  <Play size={12} /> Play
                </button>
              )}
              <ChevronDown
                size={16}
                className={`text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
                {/* Members */}
                {session.members.length > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-2">Members</p>
                    <div className="flex flex-wrap gap-2">
                      {session.members.map((m) => (
                        <div key={m.userId} className="flex items-center gap-1.5 bg-surface-700 rounded-full px-2.5 py-1">
                          <Avatar src={m.user.avatarUrl} name={m.user.name} size="xs" />
                          <span className="text-xs text-white">{m.user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Songs */}
                {session.songs.length > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-2">Setlist</p>
                    <div className="space-y-1">
                      {session.songs.map((ss, idx) => (
                        <div key={ss.songId} className="flex items-center gap-2 text-sm">
                          <span className="text-white/30 text-xs w-4">{idx + 1}.</span>
                          {ss.song?.artworkUrl ? (
                            <img src={ss.song.artworkUrl} alt={ss.song.title} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                          ) : (
                            <Music2 size={12} className="text-accent-purple-light flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-white/70 truncate block">{ss.song?.title ?? `Song ${idx + 1}`}</span>
                            {ss.song?.artist && <span className="text-white/30 text-xs truncate block">{ss.song.artist}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import more songs */}
                {(session.status === 'PLANNED' || session.status === 'ACTIVE') && (
                  <div>
                    <p className="text-xs text-white/40 mb-2">Import more songs</p>
                    <Input
                      icon={<Search size={12} />}
                      placeholder="Search iTunes and add songs..."
                      value={importSearch}
                      onChange={(e) => setImportSearch(e.target.value)}
                    />
                    {(importResults.length > 0 || importing) && (
                      <div className="mt-1 bg-surface-600 rounded-xl border border-white/10 overflow-hidden shadow-xl">
                        {importing ? (
                          <div className="px-4 py-2 text-xs text-white/40">Searching iTunes...</div>
                        ) : (
                          importResults.slice(0, 4).map((track) => (
                            <button
                              key={track.trackId}
                              onClick={() => handleImportSong(session.id, track, session)}
                              disabled={importingTrackId === track.trackId}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-500 transition-colors text-left disabled:opacity-50"
                            >
                              {track.artworkUrl100 ? (
                                <img src={track.artworkUrl100} alt={track.trackName} className="w-7 h-7 rounded object-cover flex-shrink-0" />
                              ) : (
                                <Music2 size={12} className="text-accent-purple-light" />
                              )}
                              <span className="text-sm text-white flex-1 truncate">{track.trackName}</span>
                              <span className="text-xs text-white/40">{track.artistName}</span>
                              {importingTrackId === track.trackId
                                ? <span className="text-xs text-white/40 ml-1">Adding...</span>
                                : <Plus size={12} className="text-accent-purple-light ml-1" />
                              }
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {upcoming.length === 0 && past.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar size={32} className="mx-auto text-white/20 mb-3" />
          <p className="text-white font-medium">No sessions yet</p>
          <p className="text-white/40 text-sm mt-1">Create your first session in the Set Session tab</p>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Upcoming</p>
              <div className="space-y-2">
                {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Past</p>
              <div className="space-y-2 opacity-60">
                {past.slice(0, 5).map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── PLAY TAB ─────────────────────────────────────────────────────────────────

const PlayTab = ({ sessions }: { sessions: Session[] }) => {
  const navigate = useNavigate();
  const active = sessions.filter((s) => s.status === 'ACTIVE');
  const planned = sessions.filter((s) => s.status === 'PLANNED');
  const ready = [...active, ...planned];

  if (ready.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Music2 size={32} className="mx-auto text-white/20 mb-3" />
        <p className="text-white font-medium">No sessions ready to play</p>
        <p className="text-white/40 text-sm mt-1">Create and schedule a session first</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {ready.map((session) => (
        <Card
          key={session.id}
          glow={session.status === 'ACTIVE'}
          className={`p-4 ${session.status === 'ACTIVE' ? 'bg-gradient-to-br from-accent-purple/20 to-surface-800 border-accent-purple/30' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${session.status === 'ACTIVE' ? 'bg-green-500/20' : 'bg-accent-blue/20'}`}>
              <Music2 size={22} className={session.status === 'ACTIVE' ? 'text-green-400' : 'text-accent-blue-light'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-white truncate">{session.title}</h3>
                {session.status === 'ACTIVE' && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>}
              </div>
              <p className="text-xs text-white/40">
                {session.room.name} · {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex -space-x-1.5">
                  {session.members.slice(0, 4).map((m) => (
                    <Avatar key={m.userId} name={m.user.name} src={m.user.avatarUrl} size="xs" className="ring-2 ring-surface-800" />
                  ))}
                </div>
                <span className="text-xs text-white/40">{session.members.length} members · {session.songs.length} songs</span>
                {session.status === 'PLANNED' && (
                  <span className="text-xs font-bold text-accent-blue-light ml-auto">
                    <Countdown target={session.startTime} />
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={<Play size={12} />}
              onClick={() => navigate(`/jam/${session.id}`)}
              className="flex-shrink-0 self-center"
            >
              {session.status === 'ACTIVE' ? 'Join' : 'Play'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('manage');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [sData, rData, mData] = await Promise.all([
        sessionsService.getSessions(),
        usersService.getRooms(),
        matchesService.getMatches(),
      ]);
      setSessions(sData);
      setRooms(rData);
      setMatches(mData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'set', label: 'Set Session' },
    { id: 'manage', label: 'Manage' },
    { id: 'play', label: 'Play' },
  ];

  const userWishlist = user?.songWishlist ?? [];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sessions</h1>
        <p className="text-white/40 text-sm mt-0.5">Set up, manage, and play your jam sessions</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 p-1 rounded-xl border border-white/5 mb-6 w-fit">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-accent-purple/20 text-accent-purple-light' : 'text-white/50 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'set' && (
              <SetSessionTab
                rooms={rooms}
                matches={matches}
                userWishlist={userWishlist}
                onCreated={(s) => { setSessions((prev) => [...prev, s]); setTab('manage'); }}
              />
            )}
            {tab === 'manage' && (
              <ManageTab sessions={sessions} onRefresh={load} />
            )}
            {tab === 'play' && (
              <PlayTab sessions={sessions} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
