import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListMusic, Plus, Trash2, Search, Download, Music, X,
  ChevronDown, ChevronUp, Loader2, Edit2, Check, Eye, FileMusic,
} from 'lucide-react';
import { playlistsService } from '../services/playlists.service';
import { songsService } from '../services/songs.service';
import { Playlist, Song, ItunesTrack, SongWithSections } from '../types';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';

// ─── Song search (iTunes + local) ────────────────────────────────────────────

type SearchSource = 'itunes' | 'local';

const AddSongPanel = ({
  onAdd, onClose,
}: { onAdd: (song: Song) => Promise<void>; onClose: () => void }) => {
  const [source, setSource] = useState<SearchSource>('itunes');
  const [query, setQuery] = useState('');
  const [itunesResults, setItunesResults] = useState<ItunesTrack[]>([]);
  const [localResults, setLocalResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const toast = useToast();

  const debouncedQuery = useDebounce(query, 400);

  // Live search on debounced query change
  useEffect(() => {
    setItunesResults([]); setLocalResults([]);
    if (!debouncedQuery.trim()) return;
    setSearching(true);
    const search = source === 'itunes'
      ? songsService.searchItunes(debouncedQuery.trim()).then(setItunesResults)
      : songsService.getSongs({ search: debouncedQuery.trim() }).then(setLocalResults);
    search.catch(() => {}).finally(() => setSearching(false));
  }, [debouncedQuery, source]);

  const handleItunes = async (track: ItunesTrack) => {
    setAdding(String(track.trackId));
    try {
      const song = await songsService.findOrCreateFromItunes(track);
      await onAdd(song);
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Failed to add'); }
    finally { setAdding(null); }
  };

  const handleLocal = async (song: Song) => {
    setAdding(song.id);
    try { await onAdd(song); }
    catch (e: any) { toast.error(e?.response?.data?.error ?? 'Failed to add'); }
    finally { setAdding(null); }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Source toggle */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {(['itunes', 'local'] as SearchSource[]).map(s => (
          <button key={s}
            onClick={() => { setSource(s); setItunesResults([]); setLocalResults([]); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${source === s ? 'bg-accent-purple/30 text-accent-purple-light' : 'text-white/40 hover:text-white/70'}`}
          >{s === 'itunes' ? '🎵 iTunes' : '📁 My Library'}</button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={source === 'itunes' ? 'Search iTunes… (live)' : 'Search your library… (live)'}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pl-9 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-purple/50 transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          </div>
        </div>
        <button onClick={onClose} className="px-3 py-2 border border-white/10 rounded-xl text-white/40 hover:text-white text-sm"><X size={13} /></button>
      </div>

      {/* Results */}
      {(source === 'itunes' ? itunesResults : localResults).length > 0 && (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {source === 'itunes' && itunesResults.map(track => (
            <div key={track.trackId} className="flex items-center gap-2 p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl">
              {track.artworkUrl100 && <img src={track.artworkUrl100.replace('100x100bb', '50x50bb')} alt="" className="w-9 h-9 rounded-lg shrink-0 object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{track.trackName}</p>
                <p className="text-xs text-white/40 truncate">{track.artistName}</p>
              </div>
              <button onClick={() => handleItunes(track)} disabled={adding === String(track.trackId)}
                className="px-2.5 py-1 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 rounded-lg text-accent-purple-light text-xs disabled:opacity-40 flex items-center gap-1 shrink-0"
              >{adding === String(track.trackId) ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}Add</button>
            </div>
          ))}
          {source === 'local' && localResults.map(song => (
            <div key={song.id} className="flex items-center gap-2 p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl">
              {song.artworkUrl
                ? <img src={song.artworkUrl} alt="" className="w-9 h-9 rounded-lg shrink-0 object-cover" />
                : <div className="w-9 h-9 rounded-lg bg-accent-purple/20 flex items-center justify-center shrink-0"><Music size={14} className="text-accent-purple-light" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{song.title}</p>
                <p className="text-xs text-white/40 truncate">{song.artist}</p>
              </div>
              <button onClick={() => handleLocal(song)} disabled={adding === song.id}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-white/70 text-xs disabled:opacity-40 flex items-center gap-1 shrink-0"
              >{adding === song.id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}Add</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Playlist card ────────────────────────────────────────────────────────────

const PlaylistCard = ({
  playlist, onUpdate, onDelete,
}: { playlist: Playlist; onUpdate: (p: Playlist) => void; onDelete: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(playlist.name);
  const [showAdd, setShowAdd] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const saveName = async () => {
    setEditingName(false);
    if (!nameDraft.trim() || nameDraft === playlist.name) { setNameDraft(playlist.name); return; }
    try {
      const updated = await playlistsService.updatePlaylist(playlist.id, nameDraft.trim());
      onUpdate(updated);
    } catch { setNameDraft(playlist.name); toast.error('Failed to rename'); }
  };

  const removeSong = async (songId: string) => {
    setRemoving(songId);
    try {
      const updated = await playlistsService.removeSong(playlist.id, songId);
      onUpdate(updated);
    } catch { toast.error('Failed to remove'); }
    finally { setRemoving(null); }
  };

  const addSong = async (song: Song) => {
    const updated = await playlistsService.addSong(playlist.id, song.id);
    onUpdate(updated);
    toast.success(`Added "${song.title}"`);
  };

  const secsToMMSS = (ms: number | null | undefined) => {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-surface-800/30">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.03] border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-purple/40 to-accent-pink/30 flex items-center justify-center shrink-0">
          <ListMusic size={15} className="text-accent-purple-light" />
        </div>

        {editingName ? (
          <input
            type="text" value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameDraft(playlist.name); } }}
            autoFocus
            className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-accent-purple/50 pb-px"
          />
        ) : (
          <button
            onClick={() => { setEditingName(true); }}
            className="flex-1 text-left text-sm font-semibold text-white/90 hover:text-white transition-colors group flex items-center gap-1.5"
          >
            {playlist.name}
            <Edit2 size={11} className="text-white/0 group-hover:text-white/30 transition-colors" />
          </button>
        )}

        <span className="text-xs text-white/30 shrink-0">{playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}</span>

        <button
          onClick={() => setShowAdd(v => !v)}
          className="p-1.5 rounded-lg text-white/30 hover:text-accent-purple-light hover:bg-accent-purple/10 transition-all shrink-0"
          title="Add song"
        ><Plus size={15} /></button>

        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-all shrink-0"
        >{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>

        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
          title="Delete playlist"
        ><Trash2 size={13} /></button>
      </div>

      {/* Add song panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-white/5 px-4 pb-3">
            <AddSongPanel onAdd={addSong} onClose={() => setShowAdd(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song list */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {playlist.songs.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/25 text-sm">
                No songs yet — click <strong>+</strong> to add some
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {playlist.songs.map((ps, idx) => {
                  const song = ps.song;
                  return (
                    <div key={ps.songId} className="flex items-center gap-3 px-4 py-3 group/song hover:bg-white/[0.02] transition-colors">
                      <span className="text-xs text-white/20 w-5 text-right shrink-0">{idx + 1}</span>
                      {song.artworkUrl
                        ? <img src={song.artworkUrl} alt="" className="w-9 h-9 rounded-lg shrink-0 object-cover" />
                        : <div className="w-9 h-9 rounded-lg bg-accent-purple/15 flex items-center justify-center shrink-0"><Music size={14} className="text-accent-purple-light/60" /></div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">{song.title}</p>
                        <p className="text-xs text-white/40 truncate">
                          {song.artist}
                          {song.key && <span className="ml-2 text-white/30">• {song.key}</span>}
                          {song.bpm > 0 && <span className="ml-1 text-white/30">{song.bpm} bpm</span>}
                          {song.duration && <span className="ml-1 text-white/25">{secsToMMSS(song.duration)}</span>}
                        </p>
                      </div>
                      {/* Edit / View / Remove actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover/song:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => navigate(`/jamsync/editor?id=${ps.songId}`)}
                          title="Edit in Editor"
                          className="p-1.5 rounded-lg text-white/30 hover:text-accent-purple-light hover:bg-accent-purple/10 transition-colors"
                        ><FileMusic size={13} /></button>
                        <button
                          onClick={() => navigate(`/jamsync/sheets/${ps.songId}`)}
                          title="View sheet"
                          className="p-1.5 rounded-lg text-white/30 hover:text-accent-blue-light hover:bg-accent-blue/10 transition-colors"
                        ><Eye size={13} /></button>
                        <button
                          onClick={() => removeSong(ps.songId)}
                          disabled={removing === ps.songId}
                          title="Remove from playlist"
                          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          {removing === ps.songId ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── PlaylistsPage ────────────────────────────────────────────────────────────

export const PlaylistsPage = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    playlistsService.getPlaylists().then(setPlaylists).finally(() => setLoading(false));
  }, []);

  const createPlaylist = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const pl = await playlistsService.createPlaylist(newName.trim());
      setPlaylists(prev => [pl, ...prev]);
      setNewName(''); setCreating(false);
      toast.success(`Playlist "${pl.name}" created`);
    } catch { toast.error('Failed to create playlist'); }
    finally { setSaving(false); }
  };

  const deletePlaylist = async (id: string) => {
    setDeleting(id);
    try {
      await playlistsService.deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      toast.success('Playlist deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const totalSongs = playlists.reduce((n, p) => n + p.songs.length, 0);

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-[0_0_20px_rgba(96,165,250,0.3)]">
              <ListMusic size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Playlists</h1>
              <p className="text-xs text-white/35">
                {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} · {totalSongs} song{totalSongs !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 rounded-xl text-accent-purple-light text-sm font-medium transition-all"
          ><Plus size={15} />New Playlist</button>
        </div>

        {/* New playlist form */}
        <AnimatePresence>
          {creating && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-surface-800/40 border border-white/8 rounded-2xl p-4">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">Playlist name</label>
              <div className="flex gap-2">
                <input
                  type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createPlaylist(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }}
                  placeholder="My Favourite Jams…" autoFocus
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-purple/50 transition-colors"
                />
                <button onClick={createPlaylist} disabled={saving || !newName.trim()}
                  className="px-4 py-2.5 bg-accent-purple hover:bg-accent-purple/80 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Create
                </button>
                <button onClick={() => { setCreating(false); setNewName(''); }} className="px-4 py-2.5 border border-white/10 rounded-xl text-white/40 hover:text-white text-sm">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-white/30" />
          </div>
        )}

        {/* Empty state */}
        {!loading && playlists.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <ListMusic size={32} className="text-white/20" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/60 mb-1">No playlists yet</h2>
              <p className="text-sm text-white/30 max-w-xs">
                Create a playlist to organise your songs and sheets for rehearsals
              </p>
            </div>
            <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-6 py-3 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 rounded-2xl text-accent-purple-light font-semibold transition-all">
              <Plus size={18} />Create First Playlist
            </button>
          </motion.div>
        )}

        {/* Playlists */}
        {!loading && playlists.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {playlists.map(pl => (
                <motion.div key={pl.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                  {deleting === pl.id ? (
                    <div className="border border-red-500/20 rounded-2xl p-4 bg-red-500/5 flex items-center gap-3">
                      <Loader2 size={16} className="animate-spin text-red-400" />
                      <span className="text-sm text-red-400">Deleting "{pl.name}"…</span>
                    </div>
                  ) : (
                    <PlaylistCard
                      playlist={pl}
                      onUpdate={updated => setPlaylists(prev => prev.map(p => p.id === updated.id ? updated : p))}
                      onDelete={() => deletePlaylist(pl.id)}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
