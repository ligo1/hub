// LRCLIB — free, no API key, ~3M songs with synced lyrics
// Docs: https://lrclib.net/api/docs

const BASE = 'https://lrclib.net/api';
const HEADERS = { 'User-Agent': 'JamSync/1.0 (https://github.com/jamsync)' };

export interface LrcLine {
  text: string;
  startTime: number | null; // seconds from start of track
}

export interface LyricSection {
  name: string;
  lines: LrcLine[];
}

// Parse LRC format: "[mm:ss.xx] text" lines into structured data
function parseLrc(lrcText: string): LrcLine[] {
  const result: LrcLine[] = [];

  for (const raw of lrcText.split('\n')) {
    const line = raw.trim();
    // Skip metadata tags like [ti:], [ar:], [offset:], etc.
    if (/^\[(?:ti|ar|al|by|offset|re|ve|length):/i.test(line)) continue;

    const match = line.match(/^\[(\d{1,2}):(\d{2}\.\d+)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        result.push({ text, startTime: minutes * 60 + seconds });
      }
    }
  }

  return result;
}

// Parse plain lyrics (no timestamps) into LrcLine[]
function parsePlain(plainText: string): LrcLine[] {
  return plainText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text) => ({ text, startTime: null }));
}

// Group lines into sections:
//  - For synced lyrics: split on time gaps > GAP_THRESHOLD seconds
//  - For plain lyrics: split on blank lines (paragraph breaks)
const GAP_THRESHOLD = 3; // seconds of silence = new section

function groupIntoSections(lines: LrcLine[], synced: boolean): LyricSection[] {
  if (lines.length === 0) return [];

  const sections: LyricSection[] = [];
  let current: LrcLine[] = [];
  let sectionIdx = 1;

  for (let i = 0; i < lines.length; i++) {
    const prev = lines[i - 1];
    const cur = lines[i];

    const isGap =
      synced &&
      prev?.startTime !== null &&
      cur.startTime !== null &&
      cur.startTime - (prev?.startTime ?? 0) > GAP_THRESHOLD;

    if (isGap && current.length > 0) {
      sections.push({ name: `Part ${sectionIdx}`, lines: current });
      sectionIdx++;
      current = [];
    }

    current.push(cur);
  }

  if (current.length > 0) {
    sections.push({ name: `Part ${sectionIdx}`, lines: current });
  }

  return sections;
}

interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

async function lrclibGet(url: string): Promise<LrclibResponse | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as LrclibResponse;
  } catch {
    return null;
  }
}

async function lrclibSearch(url: string): Promise<LrclibResponse[]> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    return (await res.json()) as LrclibResponse[];
  } catch {
    return [];
  }
}

export async function getLrcLibLyrics(
  title: string,
  artist: string,
  album?: string,
  durationMs?: number,
): Promise<{ sections: LyricSection[]; synced: boolean } | null> {
  const durationSec = durationMs ? Math.round(durationMs / 1000) : undefined;

  // Try exact match first (faster, more accurate)
  let data: LrclibResponse | null = null;

  if (durationSec) {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
      ...(album ? { album_name: album } : {}),
      duration: String(durationSec),
    });
    data = await lrclibGet(`${BASE}/get?${params}`);
  }

  // Fall back to search if exact match fails
  if (!data) {
    const params = new URLSearchParams({ q: `${artist} ${title}`, limit: '1' });
    const results = await lrclibSearch(`${BASE}/search?${params}`);
    data = results[0] ?? null;
  }

  if (!data || data.instrumental) return null;

  if (data.syncedLyrics) {
    const lines = parseLrc(data.syncedLyrics);
    if (lines.length === 0) return null;
    return { sections: groupIntoSections(lines, true), synced: true };
  }

  if (data.plainLyrics) {
    const lines = parsePlain(data.plainLyrics);
    if (lines.length === 0) return null;
    return { sections: groupIntoSections(lines, false), synced: false };
  }

  return null;
}
