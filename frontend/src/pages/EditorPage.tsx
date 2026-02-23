import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Plus, Trash2, Save, Search, Download, ChevronDown, ChevronUp,
  FileMusic, X, Loader2, Timer, ListMusic, Check,
} from 'lucide-react';
import { songsService, EditorSectionPayload } from '../services/songs.service';
import { playlistsService } from '../services/playlists.service';
import { ItunesTrack, Song, SongWithSections, Playlist } from '../types';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';

// ─── Chord validation ─────────────────────────────────────────────────────────

const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const QUALITIES = ['', 'm', '7', 'maj7', 'm7', 'dim', 'dim7', 'aug', 'sus2', 'sus4', 'add9', 'add2', '6', 'm6', '9', 'm9', '5', '11', '13'];
const ALL_CHORDS = ROOTS.flatMap(r => QUALITIES.map(q => r + q));

// Root + optional accidental + optional quality + optional slash bass
const CHORD_RE = /^[A-G][#b]?(m(aj)?7?|maj7?|dim7?|aug7?|sus[24]?|add[29]|[2-9]|11|13|m[679]|m11|m13|5)?(\/[A-G][#b]?)?$/;

function isValidChord(s: string): boolean {
  return s === '' || CHORD_RE.test(s);
}

function suggestChords(input: string): string[] {
  if (!input) return [];
  const lower = input.toLowerCase();
  return ALL_CHORDS.filter(c => c.toLowerCase().startsWith(lower)).slice(0, 6);
}

// ─── Local editor types ────────────────────────────────────────────────────────

interface EditorChord { wordIndex: number; chord: string }
interface EditorLine { id: string; timestamp: number | null; text: string; chords: EditorChord[] }
interface EditorSection { id: string; name: string; lines: EditorLine[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();

function secsToMMSS(secs: number | null): string {
  if (secs == null) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function mmssToSecs(val: string): number | null {
  const t = val.trim();
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10), s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
  }
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function songToEditorState(song: SongWithSections): EditorSection[] {
  return song.sections.map(sec => ({
    id: uid(), name: sec.name,
    lines: sec.lines.map(line => {
      const words = splitWords(line.lyricText);
      return {
        id: uid(), timestamp: line.startTime ?? null, text: line.lyricText,
        chords: line.chords.map(c => ({
          wordIndex: words.length > 1 ? Math.round(c.beatPosition * (words.length - 1)) : 0,
          chord: c.chord,
        })),
      };
    }),
  }));
}

function emptyLine(): EditorLine { return { id: uid(), timestamp: null, text: '', chords: [] }; }
function emptySection(name = 'Verse 1'): EditorSection { return { id: uid(), name, lines: [emptyLine()] }; }

function sectionsToPayload(sections: EditorSection[]): EditorSectionPayload[] {
  return sections.map(s => ({
    name: s.name,
    lines: s.lines.map(l => ({ text: l.text, timestamp: l.timestamp, chords: l.chords })),
  }));
}

function totalLineCount(sections: EditorSection[]): number {
  return sections.reduce((n, s) => n + s.lines.length, 0);
}

// ─── TimestampInput ────────────────────────────────────────────────────────────

const TimestampInput = ({
  value, onChange, duration,
}: { value: number | null; onChange: (v: number | null) => void; duration: number | null }) => {
  const [raw, setRaw] = useState(secsToMMSS(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => { if (!focused) setRaw(secsToMMSS(value)); }, [value, focused]);

  const pct = value != null && duration ? Math.min(100, Math.round((value / duration) * 100)) : null;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        type="text" value={raw} placeholder="0:00"
        onChange={e => setRaw(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const p = mmssToSecs(raw);
          onChange(p);
          setRaw(secsToMMSS(p));
        }}
        className="w-14 text-center text-xs bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-white/60 focus:outline-none focus:border-accent-purple/50 focus:text-white transition-colors font-mono"
      />
      {pct != null && (
        <div className="w-14 h-0.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-accent-purple/60 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
};

// ─── ChordSlot ────────────────────────────────────────────────────────────────

const ChordSlot = ({ chord, word, onSave }: { chord: string; word: string; onSave: (c: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chord);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(chord); setError(false);
    setSuggestions(suggestChords(chord));
    setActiveIdx(-1); setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
  };

  const commit = useCallback((val = draft) => {
    const t = val.trim();
    if (t && !isValidChord(t)) { setError(true); return; }
    setEditing(false); setError(false); setSuggestions([]); setActiveIdx(-1);
    onSave(t);
  }, [draft, onSave]);

  const handleChange = (val: string) => {
    setDraft(val); setError(false);
    setSuggestions(suggestChords(val)); setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const picked = activeIdx >= 0 ? suggestions[activeIdx] : undefined;
      if (picked) { setDraft(picked); commit(picked); } else commit();
    } else if (e.key === 'Escape') { setEditing(false); setError(false); setSuggestions([]); setDraft(chord); }
  };

  if (editing) {
    return (
      <div className="relative flex flex-col items-center min-w-[2.5rem]">
        <input
          ref={inputRef} type="text" value={draft}
          onChange={e => handleChange(e.target.value)}
          onBlur={() => { if (activeIdx < 0) commit(); }}
          onKeyDown={handleKeyDown}
          autoComplete="off" spellCheck={false}
          className={`w-16 text-center text-xs font-bold rounded px-1 py-0.5 focus:outline-none mb-0.5 transition-colors ${
            error
              ? 'bg-red-500/20 border border-red-500/60 text-red-400'
              : 'bg-accent-purple/20 border border-accent-purple/60 text-accent-purple-light'
          }`}
        />
        {error && (
          <div className="absolute top-7 left-1/2 -translate-x-1/2 text-[9px] text-red-400 whitespace-nowrap z-20 bg-surface-900/90 px-1.5 py-0.5 rounded border border-red-500/30">
            Not a valid chord
          </div>
        )}
        {!error && suggestions.length > 0 && (
          <div className="absolute top-7 left-1/2 -translate-x-1/2 z-30 bg-surface-900 border border-white/15 rounded-lg overflow-hidden shadow-xl min-w-[3.5rem]">
            {suggestions.map((s, i) => (
              <button
                key={s}
                onMouseDown={e => { e.preventDefault(); setDraft(s); commit(s); }}
                className={`block w-full text-xs px-3 py-1 text-left font-mono transition-colors ${
                  i === activeIdx ? 'bg-accent-purple/30 text-accent-purple-light' : 'text-white/70 hover:bg-white/8'
                }`}
              >{s}</button>
            ))}
          </div>
        )}
        <span className="text-sm text-white/70 px-1 whitespace-nowrap select-none leading-relaxed">{word}</span>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit} title={`Add chord above "${word}"`}
      className="flex flex-col items-center min-w-[2.5rem] group/word hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
    >
      <span className={`text-xs font-bold text-center h-5 leading-5 transition-colors font-mono ${
        chord ? 'text-amber-400' : 'text-transparent group-hover/word:text-white/25'
      }`} style={{ minWidth: '2rem' }}>{chord || '+'}</span>
      <span className="text-sm text-white/70 whitespace-nowrap select-none leading-relaxed">{word}</span>
    </button>
  );
};

// ─── LineRow ──────────────────────────────────────────────────────────────────

const LineRow = ({
  line, onChange, onRemove, canRemove, onAddLineAfter, duration,
}: {
  line: EditorLine; onChange: (l: EditorLine) => void; onRemove: () => void;
  canRemove: boolean; onAddLineAfter: () => void; duration: number | null;
}) => {
  const words = splitWords(line.text);

  const setChord = (wi: number, chord: string) => {
    const next = line.chords.filter(c => c.wordIndex !== wi);
    if (chord) next.push({ wordIndex: wi, chord });
    onChange({ ...line, chords: next });
  };

  const handleTextChange = (newText: string) => {
    const nw = splitWords(newText);
    const maxIdx = Math.max(0, nw.length - 1);
    const seen = new Set<number>();
    const clamped = line.chords
      .map(c => ({ ...c, wordIndex: Math.min(c.wordIndex, maxIdx) }))
      .filter(c => { if (seen.has(c.wordIndex)) return false; seen.add(c.wordIndex); return true; });
    onChange({ ...line, text: newText, chords: clamped });
  };

  return (
    <div className="flex items-start gap-3 group/line py-1">
      <div className="shrink-0 mt-6">
        <TimestampInput value={line.timestamp} onChange={ts => onChange({ ...line, timestamp: ts })} duration={duration} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="overflow-x-auto pb-1">
          {words.length > 0 ? (
            <div className="flex flex-wrap gap-x-1">
              {words.map((w, wi) => (
                <ChordSlot
                  key={wi} word={w}
                  chord={line.chords.find(c => c.wordIndex === wi)?.chord ?? ''}
                  onSave={ch => setChord(wi, ch)}
                />
              ))}
            </div>
          ) : (
            <div className="h-12 flex items-center">
              <span className="text-white/20 text-xs italic">type lyrics below to build the chord grid above</span>
            </div>
          )}
        </div>
        <input
          type="text" value={line.text}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddLineAfter(); } }}
          placeholder="Type lyrics here… (Enter adds next line)"
          className="w-full bg-transparent border-t border-white/8 text-sm text-white/60 px-1 pt-1.5 pb-0.5 focus:outline-none focus:text-white placeholder:text-white/18 transition-colors"
        />
      </div>

      {canRemove && (
        <button
          onClick={onRemove}
          className="mt-6 opacity-0 group-hover/line:opacity-100 transition-opacity text-white/25 hover:text-red-400 shrink-0"
          title="Remove line"
        ><X size={14} /></button>
      )}
    </div>
  );
};

// ─── SectionBlock ─────────────────────────────────────────────────────────────

const SectionBlock = ({
  section, onUpdate, onRemove, canRemove, duration,
}: {
  section: EditorSection; onUpdate: (s: EditorSection) => void;
  onRemove: () => void; canRemove: boolean; duration: number | null;
}) => {
  const [editingName, setEditingName] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const updateLine = (idx: number, line: EditorLine) => {
    const lines = [...section.lines]; lines[idx] = line;
    onUpdate({ ...section, lines });
  };

  const addLineAfter = (idx: number) => {
    const lines = [...section.lines];
    lines.splice(idx + 1, 0, emptyLine());
    onUpdate({ ...section, lines });
  };

  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-surface-800/30">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/5">
        <button onClick={() => setCollapsed(c => !c)} className="text-white/30 hover:text-white/60 transition-colors shrink-0">
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>

        {editingName ? (
          <input
            ref={nameRef} type="text" value={section.name}
            onChange={e => onUpdate({ ...section, name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            autoFocus
            className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-accent-purple/50 pb-px"
          />
        ) : (
          <button
            onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 0); }}
            className="flex-1 text-left text-sm font-semibold text-white/80 hover:text-white transition-colors"
            title="Click to rename"
          >{section.name || 'Unnamed Section'}</button>
        )}

        <span className="text-xs text-white/25 shrink-0">{section.lines.length}L</span>

        {canRemove && (
          <button onClick={onRemove} className="text-white/20 hover:text-red-400 transition-colors shrink-0 ml-1" title="Remove section">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 py-2 divide-y divide-white/5">
          {section.lines.map((line, idx) => (
            <LineRow
              key={line.id} line={line} duration={duration}
              onChange={l => updateLine(idx, l)}
              onRemove={() => onUpdate({ ...section, lines: section.lines.filter((_, i) => i !== idx) })}
              canRemove={section.lines.length > 1}
              onAddLineAfter={() => addLineAfter(idx)}
            />
          ))}
          <div className="pt-2">
            <button
              onClick={() => onUpdate({ ...section, lines: [...section.lines, emptyLine()] })}
              className="flex items-center gap-1.5 text-xs text-white/25 hover:text-accent-purple-light transition-colors py-1.5"
            ><Plus size={12} />Add line</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Song search (supports iTunes + local library) ────────────────────────────

type SearchSource = 'itunes' | 'local';

const SongSearch = ({ onSelect, onCancel }: {
  onSelect: (song: SongWithSections) => void;
  onCancel: () => void;
}) => {
  const [source, setSource] = useState<SearchSource>('itunes');
  const [query, setQuery] = useState('');
  const [itunesResults, setItunesResults] = useState<ItunesTrack[]>([]);
  const [localResults, setLocalResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const toast = useToast();

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    setItunesResults([]); setLocalResults([]);
    if (!debouncedQuery.trim()) return;
    setSearching(true);
    const fetch = source === 'itunes'
      ? songsService.searchItunes(debouncedQuery.trim()).then(setItunesResults)
      : songsService.getSongs({ search: debouncedQuery.trim() }).then(setLocalResults);
    fetch.catch(() => {}).finally(() => setSearching(false));
  }, [debouncedQuery, source]);

  const importItunes = async (track: ItunesTrack) => {
    setImporting(String(track.trackId));
    try {
      const base = await songsService.findOrCreateFromItunes(track);
      onSelect(await songsService.getSong(base.id));
    } catch { toast.error('Import failed'); }
    finally { setImporting(null); }
  };

  const loadLocal = async (song: Song) => {
    setImporting(song.id);
    try { onSelect(await songsService.getSong(song.id)); }
    catch { toast.error('Failed to load song'); }
    finally { setImporting(null); }
  };

  return (
    <div className="space-y-3">
      {/* Source toggle */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {(['itunes', 'local'] as SearchSource[]).map(s => (
          <button
            key={s}
            onClick={() => { setSource(s); setItunesResults([]); setLocalResults([]); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              source === s ? 'bg-accent-purple/30 text-accent-purple-light' : 'text-white/40 hover:text-white/70'
            }`}
          >{s === 'itunes' ? '🎵 iTunes' : '📁 My Library'}</button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={source === 'itunes' ? 'Search iTunes… (live)' : 'Search your library… (live)'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-purple/50 transition-colors"
            autoFocus
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </div>
        </div>
        <button onClick={onCancel} className="px-4 py-2.5 border border-white/10 rounded-xl text-white/40 hover:text-white text-sm shrink-0">Cancel</button>
      </div>

      {/* iTunes results */}
      {source === 'itunes' && itunesResults.length > 0 && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-xl">
          {itunesResults.map(track => (
            <div key={track.trackId} className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-colors">
              {track.artworkUrl100 && <img src={track.artworkUrl100.replace('100x100bb', '60x60bb')} alt="" className="w-10 h-10 rounded-lg shrink-0 object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{track.trackName}</p>
                <p className="text-xs text-white/40 truncate">{track.artistName}</p>
              </div>
              <button
                onClick={() => importItunes(track)} disabled={importing === String(track.trackId)}
                className="px-3 py-1.5 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 rounded-lg text-accent-purple-light text-xs font-medium transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                {importing === String(track.trackId) ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}Import
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Local results */}
      {source === 'local' && localResults.length > 0 && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-xl">
          {localResults.map(song => (
            <div key={song.id} className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-colors">
              {song.artworkUrl
                ? <img src={song.artworkUrl} alt="" className="w-10 h-10 rounded-lg shrink-0 object-cover" />
                : <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center shrink-0"><Music size={16} className="text-accent-purple-light" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-white/40 truncate">{song.artist}</p>
              </div>
              <button
                onClick={() => loadLocal(song)} disabled={importing === song.id}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-white/70 text-xs font-medium transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                {importing === song.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}Open
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SaveToPlaylist popover ────────────────────────────────────────────────────

const SaveToPlaylist = ({ songId, onClose }: { songId: string; onClose: () => void }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const toast = useToast();

  useEffect(() => {
    playlistsService.getPlaylists().then(p => {
      setPlaylists(p);
      setAdded(new Set(p.filter(pl => pl.songs.some(s => s.songId === songId)).map(pl => pl.id)));
    }).finally(() => setLoading(false));
  }, [songId]);

  const toggle = async (playlist: Playlist) => {
    setBusy(playlist.id);
    try {
      if (added.has(playlist.id)) {
        await playlistsService.removeSong(playlist.id, songId);
        setAdded(s => { const n = new Set(s); n.delete(playlist.id); return n; });
        toast.success(`Removed from "${playlist.name}"`);
      } else {
        await playlistsService.addSong(playlist.id, songId);
        setAdded(s => new Set([...s, playlist.id]));
        toast.success(`Added to "${playlist.name}"`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Failed');
    } finally { setBusy(null); }
  };

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    setBusy('new');
    try {
      const pl = await playlistsService.createPlaylist(newName.trim());
      await playlistsService.addSong(pl.id, songId);
      setPlaylists(p => [pl, ...p]);
      setAdded(s => new Set([...s, pl.id]));
      setNewName(''); setCreating(false);
      toast.success(`Created "${pl.name}" and added sheet`);
    } catch { toast.error('Failed'); }
    finally { setBusy(null); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-surface-800/95 border border-white/12 rounded-2xl p-4 shadow-2xl space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><ListMusic size={14} />Save to Playlist</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X size={14} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-white/30" /></div>
      ) : (
        <>
          {playlists.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {playlists.map(pl => (
                <button
                  key={pl.id} onClick={() => toggle(pl)}
                  disabled={busy === pl.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    added.has(pl.id) ? 'border-accent-purple bg-accent-purple' : 'border-white/20'
                  }`}>
                    {added.has(pl.id) && <Check size={11} className="text-white" />}
                  </div>
                  <span className="flex-1 text-sm text-white/80 truncate">{pl.name}</span>
                  <span className="text-xs text-white/30 shrink-0">{pl.songs.length} songs</span>
                  {busy === pl.id && <Loader2 size={12} className="animate-spin text-white/40" />}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30 text-center py-2">No playlists yet</p>
          )}

          {creating ? (
            <div className="flex gap-2 pt-1">
              <input
                type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createAndAdd()}
                placeholder="Playlist name…" autoFocus
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-purple/50"
              />
              <button onClick={createAndAdd} disabled={busy === 'new' || !newName.trim()} className="px-3 py-1.5 bg-accent-purple/30 rounded-lg text-accent-purple-light text-xs font-medium disabled:opacity-40">
                {busy === 'new' ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
              </button>
              <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-white/30 hover:text-white text-xs"><X size={12} /></button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-white/15 hover:border-accent-purple/30 text-white/35 hover:text-accent-purple-light text-xs transition-all"
            ><Plus size={12} />New playlist</button>
          )}
        </>
      )}
    </motion.div>
  );
};

// ─── MetaField ────────────────────────────────────────────────────────────────

const MetaField = ({ label, value, onChange, placeholder, type = 'text', className = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; className?: string;
}) => (
  <div className={className}>
    <label className="text-[10px] font-medium text-white/35 uppercase tracking-wide mb-1 block">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={type === 'number' ? 0 : undefined}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 transition-colors"
    />
  </div>
);

// ─── EditorPage ───────────────────────────────────────────────────────────────

export const EditorPage = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [songId, setSongId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [durationRaw, setDurationRaw] = useState(''); // MM:SS display
  const [durationSecs, setDurationSecs] = useState<number | null>(null);
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const hasContent = sections.length > 0;

  const handleDurationBlur = () => {
    const s = mmssToSecs(durationRaw);
    setDurationSecs(s);
    setDurationRaw(secsToMMSS(s));
  };

  const handleImport = (song: SongWithSections) => {
    setSongId(song.id);
    setTitle(song.title); setArtist(song.artist || '');
    setGenre(song.genre || ''); setKey(song.key || '');
    setBpm(song.bpm ? String(song.bpm) : '');
    const secs = song.duration ? Math.round(song.duration / 1000) : null;
    setDurationSecs(secs); setDurationRaw(secsToMMSS(secs));
    setSections(songToEditorState(song));
    setShowImport(false);
    const lineCount = song.sections.reduce((n, s) => n + s.lines.length, 0);
    toast.success(`Loaded "${song.title}" — ${lineCount} lines. Click any word to add a chord.`);
  };

  // Auto-load song when navigated to with ?id=<songId>
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) return;
    setLoadingId(true);
    songsService.getSong(id)
      .then(handleImport)
      .catch(() => toast.error('Failed to load song'))
      .finally(() => setLoadingId(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const newSheet = () => {
    setSongId(null); setTitle(''); setArtist(''); setGenre(''); setKey(''); setBpm('');
    setDurationSecs(null); setDurationRaw('');
    setSections([emptySection()]); setShowImport(false); setShowPlaylist(false);
  };

  const addSection = () => {
    const candidates = ['Chorus', 'Verse 2', 'Bridge', 'Pre-Chorus', 'Outro', 'Intro', 'Solo'];
    const existing = new Set(sections.map(s => s.name.toLowerCase()));
    const next = candidates.find(n => !existing.has(n.toLowerCase())) ?? 'Section';
    setSections(prev => [...prev, emptySection(next)]);
  };

  const autoDistribute = () => {
    if (!durationSecs) { toast.error('Set song duration first'); return; }
    const total = totalLineCount(sections);
    if (!total) return;
    let idx = 0;
    setSections(sections.map(sec => ({
      ...sec,
      lines: sec.lines.map(line => ({
        ...line,
        timestamp: Math.round((idx++ / total) * durationSecs),
      })),
    })));
    toast.success('Timestamps distributed evenly');
  };

  const save = async () => {
    if (!title.trim()) { toast.error('Please enter a song title'); return; }
    setSaving(true);
    try {
      let id = songId;
      const isNew = !id;
      if (!id) {
        const created = await songsService.createSong({
          title: title.trim(), artist: artist.trim() || 'Unknown',
          genre: genre.trim(), key: key.trim(), bpm: parseInt(bpm, 10) || 0,
        });
        id = created.id; setSongId(id);
      } else {
        await songsService.updateSongMeta(id, {
          title: title.trim(), artist: artist.trim(),
          genre: genre.trim(), key: key.trim(), bpm: parseInt(bpm, 10) || 0,
          duration: durationSecs != null ? durationSecs * 1000 : undefined,
        });
      }
      await songsService.saveSongSections(id, sectionsToPayload(sections));
      toast.success('Sheet saved!');
      // On first save, open the playlist picker so the user can immediately add it
      if (isNew) setShowPlaylist(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <FileMusic size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Chords &amp; Lyrics</h1>
              <p className="text-xs text-white/35">Create or import song sheets with chord annotations</p>
            </div>
          </div>

          {hasContent && (
            <div className="flex items-center gap-2">
              {songId && (
                <div className="relative">
                  <button
                    onClick={() => setShowPlaylist(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-white/10 hover:border-accent-purple/30 rounded-xl text-white/50 hover:text-accent-purple-light text-sm transition-all"
                  ><ListMusic size={14} />Playlists</button>
                  <AnimatePresence>
                    {showPlaylist && (
                      <div className="absolute right-0 top-full mt-2 w-72 z-50">
                        <SaveToPlaylist songId={songId} onClose={() => setShowPlaylist(false)} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <button
                onClick={save} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-purple hover:bg-accent-purple/80 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Save Sheet
              </button>
            </div>
          )}
        </div>

        {/* Song metadata */}
        <AnimatePresence>
          {hasContent && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-surface-800/40 border border-white/8 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MetaField label="Title" value={title} onChange={setTitle} placeholder="Song title" className="col-span-2 md:col-span-1" />
                <MetaField label="Artist" value={artist} onChange={setArtist} placeholder="Artist name" className="col-span-2 md:col-span-1" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <MetaField label="Key" value={key} onChange={setKey} placeholder="e.g. Am" />
                <MetaField label="BPM" value={bpm} onChange={setBpm} placeholder="120" type="number" />
                <MetaField label="Genre" value={genre} onChange={setGenre} placeholder="e.g. Rock" />
                {/* Duration with auto-distribute */}
                <div>
                  <label className="text-[10px] font-medium text-white/35 uppercase tracking-wide mb-1 block">Duration</label>
                  <div className="flex gap-1">
                    <input
                      type="text" value={durationRaw}
                      onChange={e => setDurationRaw(e.target.value)}
                      onBlur={handleDurationBlur}
                      placeholder="3:45"
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-purple/50 transition-colors font-mono"
                    />
                    <button
                      onClick={autoDistribute} title="Auto-distribute timestamps evenly"
                      className="shrink-0 px-2 py-2 bg-white/5 hover:bg-accent-purple/20 border border-white/10 hover:border-accent-purple/30 rounded-xl text-white/30 hover:text-accent-purple-light transition-all"
                    ><Timer size={14} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import / search panel */}
        <AnimatePresence>
          {showImport && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-surface-800/40 border border-white/8 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                <Search size={14} />Find a song to edit
              </h2>
              <SongSearch onSelect={handleImport} onCancel={() => setShowImport(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state (auto-load from ?id=) */}
        {loadingId && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="animate-spin text-accent-purple/60" />
            <p className="text-sm text-white/30">Loading song…</p>
          </div>
        )}

        {/* Empty state */}
        {!hasContent && !showImport && !loadingId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Music size={32} className="text-white/20" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/60 mb-1">No sheet open</h2>
              <p className="text-sm text-white/30 max-w-xs">Start from scratch or find a song to import lyrics + timestamps</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={newSheet} className="flex items-center justify-center gap-2 px-6 py-3 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 rounded-2xl text-accent-purple-light font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <Plus size={18} />New Sheet
              </button>
              <button onClick={() => setShowImport(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white font-semibold transition-all">
                <Search size={18} />Find Song
              </button>
            </div>
          </motion.div>
        )}

        {/* Sections */}
        {hasContent && !showImport && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {sections.map((sec, idx) => (
                <motion.div key={sec.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.15 }}>
                  <SectionBlock
                    section={sec} canRemove={sections.length > 1} duration={durationSecs}
                    onUpdate={updated => { const n = [...sections]; n[idx] = updated; setSections(n); }}
                    onRemove={() => setSections(sections.filter((_, i) => i !== idx))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={addSection} className="flex items-center gap-2 px-4 py-2.5 border border-white/10 hover:border-accent-purple/30 rounded-xl text-white/45 hover:text-accent-purple-light text-sm font-medium transition-all">
                <Plus size={14} />Add Section
              </button>
              <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2.5 border border-white/8 hover:border-white/15 rounded-xl text-white/25 hover:text-white/60 text-sm transition-all">
                <Search size={14} />Open Different Song
              </button>
            </div>
          </div>
        )}

        {hasContent && (
          <p className="text-center text-xs text-white/20 pt-2">
            Click any word to add/edit a chord · Enter in lyrics field to add a new line · Click section name to rename
          </p>
        )}
      </div>
    </div>
  );
};
