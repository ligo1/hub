import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  ChevronLeft, ChevronUp, ChevronDown, Volume2, VolumeX, Music2,
  List, X, Star, Plus, Minus, Play, Pause, Pencil,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { sessionsService } from '../services/sessions.service';
import { Session, SongWithSections, LyricLine } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { songsService } from '../services/songs.service';

// Chord colors: tonic=gold, subdominant=blue, dominant=red, other=purple
const getChordColor = (chord: string, key: string): string => {
  const root = key.replace(/m$/, '').replace(/[^A-G#b]/g, '');
  const chordRoot = chord.replace(/[^A-G#b]/g, '');
  const scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const tonicDeg = scale.indexOf(root.charAt(0));
  const chordDeg = scale.indexOf(chordRoot.charAt(0));
  const diff = (chordDeg - tonicDeg + 7) % 7;
  if (diff === 0) return 'bg-accent-gold/25 text-accent-gold border-accent-gold/40';
  if (diff === 3 || diff === 4) return 'bg-accent-blue/25 text-accent-blue-light border-accent-blue/40';
  if (diff === 4 || diff === 6) return 'bg-red-500/25 text-red-300 border-red-400/40';
  return 'bg-accent-purple/25 text-accent-purple-light border-accent-purple/40';
};

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const transposeChord = (chord: string, semitones: number): string => {
  if (semitones === 0) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  const [, root, suffix] = match;
  const noteIdx = NOTES.findIndex(
    (n) => n === root || (root === 'Bb' && n === 'A#') || (root === 'Eb' && n === 'D#') ||
      (root === 'Ab' && n === 'G#') || (root === 'Db' && n === 'C#') || (root === 'Gb' && n === 'F#')
  );
  if (noteIdx === -1) return chord;
  const newIdx = ((noteIdx + semitones) % 12 + 12) % 12;
  return NOTES[newIdx] + suffix;
};

const flattenLines = (song: SongWithSections): Array<{ line: LyricLine; sectionName: string; isFirstInSection: boolean }> => {
  const result: Array<{ line: LyricLine; sectionName: string; isFirstInSection: boolean }> = [];
  for (const section of song.sections) {
    section.lines.forEach((line, idx) => {
      result.push({ line, sectionName: section.name, isFirstInSection: idx === 0 });
    });
  }
  return result;
};

// Font size steps in px
const FONT_SIZES = [14, 16, 18, 20, 24, 28] as const;
type FontSize = (typeof FONT_SIZES)[number];

// Star rating component
const StarRating = ({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${n} stars`}
        >
          <Star
            size={28}
            className={`transition-colors ${n <= (hovered || value) ? 'text-accent-gold fill-accent-gold' : 'text-white/20'}`}
          />
        </button>
      ))}
    </div>
  );
};

// Render chords above words in the lyric line
function renderChordsAndLyrics(line: LyricLine, semitones: number, key: string, fontSize: FontSize) {
  const words = line.lyricText.split(' ');
  const sortedChords = [...line.chords].sort((a, b) => a.beatPosition - b.beatPosition);

  return words.map((word, wIdx) => {
    const wordPos = wIdx / Math.max(words.length - 1, 1);
    const chord = sortedChords.find(
      (c) => Math.abs(c.beatPosition - wordPos) < 1 / Math.max(words.length, 2)
    );
    const transposedChord = chord ? transposeChord(chord.chord, semitones) : null;
    const colorClass = transposedChord ? getChordColor(transposedChord, key) : '';

    return (
      <div key={wIdx} className="flex flex-col items-start">
        {transposedChord ? (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border mb-1 ${colorClass}`}>
            {transposedChord}
          </span>
        ) : (
          <span className="mb-1 h-5" />
        )}
        <span className="text-white font-medium" style={{ fontSize: `${fontSize}px` }}>{word}</span>
      </div>
    );
  });
}

export const JamModePage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [session, setSession] = useState<Session | null>(null);
  const [songList, setSongList] = useState<{ songId: string; order: number }[]>([]);
  const [songMeta, setSongMeta] = useState<Record<string, { title: string; artist: string }>>({});
  const [song, setSong] = useState<SongWithSections | null>(null);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [semitones, setSemitones] = useState(0);
  const [bpm, setBpm] = useState(80);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConductor, setIsConductor] = useState(true);
  const [memberCount, setMemberCount] = useState(1);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);

  // New state
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('jam_fontSize');
    return saved ? (Number(saved) as FontSize) : 18;
  });
  const [autoScroll, setAutoScroll] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [songRatings, setSongRatings] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('jam_ratings') || '{}'); } catch { return {}; }
  });
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);
  const [lyricsEditorText, setLyricsEditorText] = useState('');
  const [savingLyrics, setSavingLyrics] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Load session + all song metadata upfront
  useEffect(() => {
    if (!sessionId) return;
    sessionsService.getSession(sessionId).then(async (s) => {
      setSession(s);
      const sorted = [...s.songs].sort((a, b) => a.order - b.order);
      setSongList(sorted);
      if (sorted.length > 0) {
        // Load all songs concurrently so sidebar can show real titles
        const allSongs = await Promise.all(sorted.map((ss) => songsService.getSong(ss.songId)));
        const meta: Record<string, { title: string; artist: string }> = {};
        allSongs.forEach((sg) => { meta[sg.id] = { title: sg.title, artist: sg.artist }; });
        setSongMeta(meta);
        setSong(allSongs[0]);
        setBpm(allSongs[0].bpm);
        setRating(songRatings[allSongs[0].id] ?? 0);
      }
      setLoading(false);
    });
  }, [sessionId]);

  // Socket.io
  useEffect(() => {
    if (!sessionId || !user) return;
    const socket = io(API_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join_session', { sessionId, userId: user.id });
    socket.on('session_state', (state) => {
      setCurrentLineIdx(state.currentLineIndex);
      setSemitones(state.semitones);
      setBpm(state.bpm);
      setMemberCount(state.members.length);
    });
    socket.on('line_changed', ({ lineIndex }) => setCurrentLineIdx(lineIndex));
    socket.on('member_joined', () => setMemberCount((c) => c + 1));
    socket.on('member_left', () => setMemberCount((c) => Math.max(1, c - 1)));
    return () => { socket.disconnect(); };
  }, [sessionId, user]);

  // Auto-scroll to current line
  useEffect(() => {
    lineRefs.current[currentLineIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentLineIdx]);

  // Auto-advance lines
  useEffect(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    if (autoScroll && isConductor && song) {
      const lines = flattenLines(song);
      const msPerBeat = (60 / bpm) * 1000;
      const msPerLine = msPerBeat * 4; // one bar per line
      autoScrollRef.current = setInterval(() => {
        setCurrentLineIdx((prev) => {
          const next = Math.min(prev + 1, lines.length - 1);
          socketRef.current?.emit('conductor_advance', { sessionId, lineIndex: next });
          return next;
        });
      }, msPerLine);
    }
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [autoScroll, isConductor, bpm, song, sessionId]);

  // Metronome
  const tick = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  useEffect(() => {
    if (metronomeOn) {
      tick();
      metronomeRef.current = setInterval(tick, (60 / bpm) * 1000);
    } else {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    }
    return () => { if (metronomeRef.current) clearInterval(metronomeRef.current); };
  }, [metronomeOn, bpm, tick]);

  const advance = (delta: number) => {
    if (!song || !isConductor) return;
    const lines = flattenLines(song);
    const newIdx = Math.max(0, Math.min(lines.length - 1, currentLineIdx + delta));
    setCurrentLineIdx(newIdx);
    socketRef.current?.emit('conductor_advance', { sessionId, lineIndex: newIdx });
  };

  const changeTranspose = (delta: number) => {
    const newSemitones = semitones + delta;
    setSemitones(newSemitones);
    socketRef.current?.emit('transpose_change', { sessionId, semitones: newSemitones });
  };

  const changeBpm = (newBpm: number) => {
    setBpm(newBpm);
    socketRef.current?.emit('bpm_change', { sessionId, bpm: newBpm });
  };

  const loadSong = async (songId: string, idx: number) => {
    setSelectedSongIndex(idx);
    const s = await songsService.getSong(songId);
    setSong(s);
    setBpm(s.bpm);
    setCurrentLineIdx(0);
    setAutoScroll(false);
    setShowSidebar(false);
    const existingRating = songRatings[songId] ?? 0;
    setRating(existingRating);
  };

  const changeFontSize = (dir: 1 | -1) => {
    const idx = FONT_SIZES.indexOf(fontSize);
    const newIdx = Math.max(0, Math.min(FONT_SIZES.length - 1, idx + dir));
    const newSize = FONT_SIZES[newIdx];
    setFontSize(newSize);
    localStorage.setItem('jam_fontSize', String(newSize));
  };

  const saveRating = (stars: number) => {
    if (!song) return;
    const updated = { ...songRatings, [song.id]: stars };
    setSongRatings(updated);
    localStorage.setItem('jam_ratings', JSON.stringify(updated));
    setRating(stars);
    setShowRating(false);
  };

  const openLyricsEditor = () => {
    if (!song) return;
    const existing = song.sections
      .flatMap((s) => s.lines)
      .map((l) => l.lyricText)
      .join('\n');
    setLyricsEditorText(existing);
    setShowLyricsEditor(true);
  };

  const saveLyrics = async () => {
    if (!song) return;
    setSavingLyrics(true);
    try {
      const updated = await songsService.updateLyrics(song.id, lyricsEditorText);
      setSong(updated);
      setCurrentLineIdx(0);
      setShowLyricsEditor(false);
    } finally {
      setSavingLyrics(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-purple/20 flex items-center justify-center mx-auto animate-pulse">
            <Music2 size={28} className="text-accent-purple-light" />
          </div>
          <p className="text-white/50">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center gap-4">
        <Music2 size={40} className="text-white/20" />
        <p className="text-white/50">No songs in this session</p>
        <Button variant="secondary" onClick={() => navigate(-1)} icon={<ChevronLeft size={14} />}>Back</Button>
      </div>
    );
  }

  const allLines = flattenLines(song);
  const currentEntry = allLines[currentLineIdx];

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col relative">
      {/* Header */}
      <div className="bg-surface-900/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white truncate text-sm md:text-base">{song.title}</h1>
          <p className="text-white/40 text-xs truncate">
            {song.artist} · Key: {song.key}{semitones !== 0 ? ` (${semitones > 0 ? '+' : ''}${semitones})` : ''} · {bpm} BPM
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="green" size="sm">🟢 {memberCount}</Badge>
          {isConductor ? (
            <button
              onClick={() => setIsConductor(false)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-accent-gold/20 text-accent-gold border border-accent-gold/30 hover:bg-accent-gold/10 transition-all"
              title="Click to enter follow mode"
            >Conducting</button>
          ) : (
            <Button size="sm" variant="glass" onClick={() => setIsConductor(true)}>Take Control</Button>
          )}
          {/* Edit lyrics button */}
          <button
            onClick={openLyricsEditor}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white"
            aria-label="Edit lyrics"
            title="Edit lyrics"
          >
            <Pencil size={15} />
          </button>
          {/* Rating button */}
          <button
            onClick={() => { setRating(songRatings[song.id] ?? 0); setShowRating(true); }}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Rate song"
          >
            <Star size={16} className={songRatings[song.id] ? 'text-accent-gold fill-accent-gold' : 'text-white/30'} />
          </button>
          {/* Setlist sidebar toggle */}
          <button
            onClick={() => setShowSidebar((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${showSidebar ? 'bg-accent-purple/20 text-accent-purple-light' : 'hover:bg-white/5 text-white/50 hover:text-white'}`}
            aria-label="Toggle setlist"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Main area + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lyrics */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12">
          <div className="max-w-2xl mx-auto space-y-1">
            {allLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Music2 size={48} className="text-white/15" />
                <p className="text-white/40 text-lg font-medium">No lyrics available</p>
                <p className="text-white/20 text-sm mb-2">Lyrics couldn't be found automatically for this song</p>
                <button
                  onClick={openLyricsEditor}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-purple/20 text-accent-purple-light border border-accent-purple/30 hover:bg-accent-purple/30 transition-all text-sm font-medium"
                >
                  <Pencil size={14} /> Add Lyrics Manually
                </button>
              </div>
            ) : (
              allLines.map(({ line, sectionName, isFirstInSection }, idx) => (
                <div key={line.id} ref={(el) => (lineRefs.current[idx] = el)}>
                  {isFirstInSection && (
                    <div className="sticky top-2 z-10 flex justify-center my-4">
                      <Badge variant="gray" size="md" className="backdrop-blur-sm">{sectionName}</Badge>
                    </div>
                  )}
                  <motion.div
                    animate={{ opacity: idx === currentLineIdx ? 1 : 0.28, scale: idx === currentLineIdx ? 1.01 : 1 }}
                    transition={{ duration: 0.2 }}
                    className={`relative py-3 px-4 rounded-xl cursor-pointer select-none ${idx === currentLineIdx ? 'bg-surface-700/50' : 'hover:bg-white/3'}`}
                    onClick={() => isConductor && advance(idx - currentLineIdx)}
                  >
                    {idx === currentLineIdx && (
                      <motion.div
                        layoutId="active-line"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-accent-purple-light to-accent-pink rounded-full"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <div className="flex flex-wrap gap-x-2 gap-y-6 items-end">
                      {renderChordsAndLyrics(line, semitones, song.key, fontSize)}
                    </div>
                  </motion.div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Setlist sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-l border-white/5 bg-surface-800 flex-shrink-0"
            >
              <div className="w-60 h-full flex flex-col">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Setlist</span>
                  <button onClick={() => setShowSidebar(false)} className="text-white/30 hover:text-white transition-colors" aria-label="Close setlist">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {songList.map((ss, idx) => (
                    <button
                      key={ss.songId}
                      onClick={() => loadSong(ss.songId, idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedSongIndex === idx
                          ? 'bg-accent-purple/20 text-accent-purple-light'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedSongIndex === idx ? 'bg-accent-purple/40' : 'bg-surface-700'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{songMeta[ss.songId]?.title ?? `Song ${idx + 1}`}</p>
                        <p className="text-xs text-white/30 truncate">{songMeta[ss.songId]?.artist ?? ''}</p>
                        {songRatings[ss.songId] && (
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: songRatings[ss.songId] }).map((_, i) => (
                              <Star key={i} size={9} className="text-accent-gold fill-accent-gold" />
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedSongIndex === idx && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-purple-light flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls bar */}
      <div className="bg-surface-900/95 backdrop-blur-xl border-t border-white/5 px-3 py-2.5 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-2 flex-wrap justify-center">

          {/* Font size */}
          <div className="flex items-center gap-1 bg-surface-700 rounded-xl px-2 py-1.5">
            <span className="text-white/40 text-xs">A</span>
            <button
              onClick={() => changeFontSize(-1)}
              disabled={fontSize === FONT_SIZES[0]}
              className="text-white/50 hover:text-white disabled:opacity-20 transition-colors p-0.5"
              aria-label="Decrease font size"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => changeFontSize(1)}
              disabled={fontSize === FONT_SIZES[FONT_SIZES.length - 1]}
              className="text-white/50 hover:text-white disabled:opacity-20 transition-colors p-0.5"
              aria-label="Increase font size"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Transpose */}
          <div className="flex items-center gap-1 bg-surface-700 rounded-xl px-2.5 py-1.5">
            <span className="text-white/40 text-xs">Key</span>
            <button onClick={() => changeTranspose(-1)} className="text-white/60 hover:text-white p-0.5 transition-colors" aria-label="Transpose down"><ChevronDown size={16} /></button>
            <span className="text-white font-bold text-sm w-7 text-center">{semitones >= 0 ? '+' : ''}{semitones}</span>
            <button onClick={() => changeTranspose(1)} className="text-white/60 hover:text-white p-0.5 transition-colors" aria-label="Transpose up"><ChevronUp size={16} /></button>
          </div>

          {/* BPM */}
          <div className="flex items-center gap-1 bg-surface-700 rounded-xl px-2.5 py-1.5">
            <span className="text-white/40 text-xs">BPM</span>
            <button onClick={() => changeBpm(Math.max(40, bpm - 5))} className="text-white/60 hover:text-white p-0.5 transition-colors" aria-label="Decrease BPM"><ChevronDown size={16} /></button>
            <span className="text-white font-bold text-sm w-9 text-center">{bpm}</span>
            <button onClick={() => changeBpm(Math.min(240, bpm + 5))} className="text-white/60 hover:text-white p-0.5 transition-colors" aria-label="Increase BPM"><ChevronUp size={16} /></button>
          </div>

          {/* Metronome */}
          <button
            onClick={() => setMetronomeOn((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-medium ${metronomeOn ? 'bg-accent-gold/20 text-accent-gold' : 'bg-surface-700 text-white/50 hover:text-white'}`}
            aria-label={metronomeOn ? 'Stop metronome' : 'Start metronome'}
          >
            {metronomeOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            Click
          </button>

          {/* Auto-scroll */}
          {isConductor && (
            <button
              onClick={() => setAutoScroll((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-medium ${autoScroll ? 'bg-green-500/20 text-green-400' : 'bg-surface-700 text-white/50 hover:text-white'}`}
              aria-label={autoScroll ? 'Stop auto-scroll' : 'Start auto-scroll'}
            >
              {autoScroll ? <Pause size={14} /> : <Play size={14} />}
              Auto
            </button>
          )}

          {/* Navigation (conductor only) */}
          {isConductor && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => advance(-1)}
                disabled={currentLineIdx === 0}
                className="px-3 py-1.5 rounded-xl bg-surface-700 text-white/60 hover:text-white disabled:opacity-30 transition-all"
                aria-label="Previous line"
              >
                <ChevronUp size={16} />
              </button>
              <span className="text-xs text-white/30 tabular-nums">{allLines.length > 0 ? `${currentLineIdx + 1}/${allLines.length}` : '—'}</span>
              <button
                onClick={() => advance(1)}
                disabled={currentLineIdx >= allLines.length - 1}
                className="px-3 py-1.5 rounded-xl bg-accent-purple/20 text-accent-purple-light hover:bg-accent-purple/30 disabled:opacity-30 transition-all"
                aria-label="Next line"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lyrics editor modal */}
      <AnimatePresence>
        {showLyricsEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowLyricsEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-800 rounded-2xl p-6 w-full max-w-lg border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">Edit Lyrics</h3>
                  <p className="text-white/40 text-xs mt-0.5 truncate">{song.title} · {song.artist}</p>
                </div>
                <button onClick={() => setShowLyricsEditor(false)} className="text-white/30 hover:text-white transition-colors" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <p className="text-white/30 text-xs mb-3">One line per lyric line. Each line becomes a navigable step in Jam Mode.</p>
              <textarea
                className="w-full h-72 bg-surface-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent-purple-light resize-none font-mono leading-relaxed"
                placeholder={"Line one of the song\nLine two of the song\nAnother line..."}
                value={lyricsEditorText}
                onChange={(e) => setLyricsEditorText(e.target.value)}
                autoFocus
                dir="auto"
              />
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={() => setShowLyricsEditor(false)}
                  className="px-4 py-2 rounded-xl bg-surface-700 text-white/60 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <Button onClick={saveLyrics} loading={savingLyrics} size="sm">
                  Save Lyrics
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating modal */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowRating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-800 rounded-2xl p-6 w-full max-w-xs border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Rate Band Performance</h3>
                <button onClick={() => setShowRating(false)} className="text-white/30 hover:text-white transition-colors" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <p className="text-white/50 text-sm mb-1 truncate">{song.title}</p>
              <p className="text-white/30 text-xs mb-4">{song.artist}</p>
              <div className="flex justify-center mb-6">
                <StarRating value={rating} onChange={saveRating} />
              </div>
              <p className="text-center text-xs text-white/30">
                {rating === 0 ? 'Tap a star to rate' : ['', 'Needs work', 'Getting there', 'Solid!', 'Great!', 'Nailed it!'][rating]}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
