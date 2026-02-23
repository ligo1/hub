const API_KEY = process.env.MUSIXMATCH_API_KEY ?? '';
const BASE = 'https://api.musixmatch.com/ws/1.1';

interface MxmResponse<T> {
  message: {
    header: { status_code: number };
    body: T;
  };
}

async function mxmFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}&apikey=${API_KEY}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json() as MxmResponse<T>;
    if (json.message.header.status_code !== 200) return null;
    return json.message.body;
  } catch {
    return null;
  }
}

export async function searchMusixmatch(artist: string, title: string): Promise<number | null> {
  const body = await mxmFetch<{ track_list: Array<{ track: { track_id: number } }> }>(
    `/track.search?q_artist=${encodeURIComponent(artist)}&q_track=${encodeURIComponent(title)}&page_size=1&page=1&s_track_rating=desc`
  );
  return body?.track_list?.[0]?.track?.track_id ?? null;
}

export async function getMusixmatchLyrics(trackId: number): Promise<string | null> {
  const body = await mxmFetch<{ lyrics: { lyrics_body: string } }>(
    `/track.lyrics.get?track_id=${trackId}`
  );
  return body?.lyrics?.lyrics_body ?? null;
}

export interface LyricSection {
  name: string;
  lines: string[];
}

export function parseLyricsToSections(lyricsText: string): LyricSection[] {
  // Remove Musixmatch commercial footer ("******* This Lyrics is NOT for...")
  const cleaned = lyricsText.replace(/\*{3,}[\s\S]*$/m, '').trim();

  // Split into paragraphs by blank lines
  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return paragraphs.map((para, idx) => ({
    name: `Part ${idx + 1}`,
    lines: para.split('\n').map((l) => l.trim()).filter(Boolean),
  }));
}
