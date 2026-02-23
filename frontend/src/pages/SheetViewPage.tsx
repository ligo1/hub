import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileMusic, Edit3, Loader2, Music, Clock, Zap, Tag, User } from 'lucide-react';
import { songsService } from '../services/songs.service';
import { SongWithSections, LyricLine } from '../types';
import { useToast } from '../hooks/useToast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function secsToMMSS(secs: number | null | undefined): string {
  if (secs == null) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function durationDisplay(ms: number | undefined): string {
  if (!ms) return '';
  return secsToMMSS(Math.round(ms / 1000));
}

// Convert beatPosition → wordIndex for display
function chordsForLine(line: LyricLine): Map<number, string> {
  const words = splitWords(line.lyricText);
  const map = new Map<number, string>();
  for (const c of line.chords) {
    const wi = words.length > 1 ? Math.round(c.beatPosition * (words.length - 1)) : 0;
    if (!map.has(wi)) map.set(wi, c.chord);
  }
  return map;
}

// ─── ReadonlyLine ─────────────────────────────────────────────────────────────

const ReadonlyLine = ({ line }: { line: LyricLine }) => {
  const words = splitWords(line.lyricText);
  const chordMap = chordsForLine(line);
  const hasChords = chordMap.size > 0;

  return (
    <div className="flex items-start gap-4 py-1.5">
      {/* Timestamp */}
      <span className="shrink-0 w-12 text-right text-xs text-white/25 font-mono mt-1 leading-relaxed">
        {line.startTime != null ? secsToMMSS(line.startTime) : ''}
      </span>

      {/* Words with chords above */}
      <div className="flex-1 min-w-0">
        {words.length > 0 ? (
          <div className="flex flex-wrap gap-x-1.5 gap-y-0">
            {words.map((word, wi) => {
              const chord = chordMap.get(wi) ?? '';
              return (
                <div key={wi} className="flex flex-col items-center">
                  <span className={`text-xs font-bold font-mono h-5 leading-5 text-center min-w-[2rem] ${
                    chord ? 'text-amber-400' : hasChords ? 'text-transparent' : 'hidden'
                  }`}>
                    {chord || (hasChords ? '·' : '')}
                  </span>
                  <span className="text-sm text-white/80 whitespace-nowrap leading-relaxed">{word}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-6" /> // empty line spacer
        )}
      </div>
    </div>
  );
};

// ─── ReadonlySection ──────────────────────────────────────────────────────────

const ReadonlySection = ({ name, lines }: { name: string; lines: LyricLine[] }) => (
  <div className="space-y-0.5">
    <div className="text-xs font-semibold uppercase tracking-widest text-accent-purple/60 mb-2 ml-16">
      {name}
    </div>
    <div className="divide-y divide-white/[0.04]">
      {lines.map(line => (
        <ReadonlyLine key={line.id} line={line} />
      ))}
    </div>
  </div>
);

// ─── SheetViewPage ────────────────────────────────────────────────────────────

export const SheetViewPage = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [song, setSong] = useState<SongWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!songId) { setError(true); setLoading(false); return; }
    songsService.getSong(songId)
      .then(s => { setSong(s); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); toast.error('Failed to load sheet'); });
  }, [songId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSections = song && song.sections.length > 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-accent-purple/60" />
          <p className="text-sm text-white/30">Loading sheet…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <Music size={28} className="text-white/20" />
          </div>
          <p className="text-white/50">Sheet not found</p>
          <button
            onClick={() => navigate('/jamsync/playlists')}
            className="text-sm text-accent-purple-light hover:text-accent-purple transition-colors"
          >← Back to Playlists</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start gap-4 flex-wrap">
          {/* Artwork */}
          {song.artworkUrl ? (
            <img
              src={song.artworkUrl}
              alt={song.title}
              className="w-20 h-20 rounded-2xl object-cover shadow-[0_0_30px_rgba(0,0,0,0.5)] shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/8 flex items-center justify-center shrink-0">
              <FileMusic size={28} className="text-amber-400/60" />
            </div>
          )}

          {/* Meta */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl font-bold text-white truncate">{song.title}</h1>
            {song.artist && (
              <p className="text-base text-white/50 mt-0.5 truncate">{song.artist}</p>
            )}

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {song.key && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-purple/15 border border-accent-purple/20 text-accent-purple-light text-xs font-medium">
                  <Tag size={10} />{song.key}
                </span>
              )}
              {song.bpm > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-white/50 text-xs font-medium">
                  <Zap size={10} />{song.bpm} bpm
                </span>
              )}
              {song.genre && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-white/50 text-xs font-medium">
                  <User size={10} />{song.genre}
                </span>
              )}
              {song.duration && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-white/50 text-xs font-medium">
                  <Clock size={10} />{durationDisplay(song.duration)}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => navigate(`/jamsync/editor?id=${song.id}`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 hover:border-amber-500/35 rounded-xl text-amber-400 hover:text-amber-300 text-sm font-medium transition-all shrink-0"
          >
            <Edit3 size={14} />Edit Sheet
          </button>
        </div>

        {/* Sheet content */}
        {hasSections ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-800/30 border border-white/6 rounded-2xl p-6 space-y-8"
          >
            {song.sections.map(section => (
              <ReadonlySection
                key={section.id}
                name={section.name}
                lines={section.lines}
              />
            ))}
          </motion.div>
        ) : (
          <div className="bg-surface-800/30 border border-white/6 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <Music size={24} className="text-white/20" />
            <p className="text-sm text-white/30">No sheet content yet.</p>
            <button
              onClick={() => navigate(`/jamsync/editor?id=${song.id}`)}
              className="text-sm text-accent-purple-light hover:text-accent-purple transition-colors flex items-center gap-1.5"
            ><Edit3 size={13} />Open in Editor</button>
          </div>
        )}

        {/* Legend */}
        {hasSections && (
          <p className="text-center text-xs text-white/20">
            Chords shown in <span className="text-amber-400/60 font-mono">amber</span> above each word · timestamps on the left
          </p>
        )}
      </div>
    </div>
  );
};
