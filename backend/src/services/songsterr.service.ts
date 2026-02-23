// Songsterr unofficial API — no auth required
const BASE = 'https://www.songsterr.com/a/ra';

// Map key-signature (number of sharps, negative = flats) to key name (major)
const SHARPS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const FLATS  = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

function keyFromSignature(sharps: number): string {
  if (sharps >= 0) return SHARPS[sharps] ?? 'C';
  return FLATS[-sharps] ?? 'C';
}

export interface SongsterrData {
  bpm: number;
  key: string;
  songsterrId: number;
  chords: Array<{ chord: string; beatPosition: number; lineIndex: number }>;
}

interface SongsterrSearchItem {
  id: number;
  title: string;
  artist: { name: string };
}

interface RevisionTrack {
  name: string;
  measures: Array<{
    beats: Array<{
      value?: number;
      effects?: { chord?: { name: string } };
    }>;
    keySignature?: { key: number };
  }>;
}

interface RevisionData {
  tempo?: number;
  tracks?: RevisionTrack[];
}

export async function searchSongsterr(artist: string, title: string): Promise<number | null> {
  try {
    const url = `${BASE}/songs.json?pattern=${encodeURIComponent(`${artist} ${title}`)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const results = await res.json() as SongsterrSearchItem[];
    if (!Array.isArray(results) || results.length === 0) return null;
    return results[0].id;
  } catch {
    return null;
  }
}

export async function getSongsterrData(songId: number): Promise<SongsterrData | null> {
  try {
    const url = `${BASE}/song/${songId}/revision/default.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json() as RevisionData;

    const bpm = data.tempo ?? 0;

    // Find key from first measure of first track
    let key = '';
    let chordTrack: RevisionTrack | undefined;

    for (const track of data.tracks ?? []) {
      const firstMeasure = track.measures?.[0];
      if (firstMeasure?.keySignature !== undefined && !key) {
        key = keyFromSignature(firstMeasure.keySignature.key);
      }
      // Prefer a track explicitly named "Chords" or one that has chord annotations
      const hasChords = track.measures?.some((m) =>
        m.beats?.some((b) => b.effects?.chord?.name)
      );
      if (hasChords && !chordTrack) {
        chordTrack = track;
      }
    }

    // Extract chord positions relative to "lines" (we'll approximate: each measure = one line)
    const chords: SongsterrData['chords'] = [];
    if (chordTrack) {
      chordTrack.measures.forEach((measure, measureIdx) => {
        let beatPos = 0;
        (measure.beats ?? []).forEach((beat) => {
          if (beat.effects?.chord?.name) {
            chords.push({
              chord: beat.effects.chord.name,
              beatPosition: beatPos,
              lineIndex: measureIdx,
            });
          }
          beatPos += beat.value ?? 1;
        });
      });
    }

    return { bpm, key, songsterrId: songId, chords };
  } catch {
    return null;
  }
}
