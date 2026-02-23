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

interface ItunesSearchResponse {
  resultCount: number;
  results: Array<{ wrapperType?: string; kind?: string } & Partial<ItunesTrack>>;
}

export async function searchItunes(query: string, limit = 15): Promise<ItunesTrack[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data: ItunesSearchResponse = await res.json();
  return data.results
    .filter((r) => r.wrapperType === 'track' && r.kind === 'song' && r.trackId !== undefined)
    .map((r) => ({
      trackId: r.trackId!,
      trackName: r.trackName ?? '',
      artistName: r.artistName ?? '',
      primaryGenreName: r.primaryGenreName ?? '',
      artworkUrl100: r.artworkUrl100 ?? '',
      previewUrl: r.previewUrl,
      trackTimeMillis: r.trackTimeMillis,
      collectionName: r.collectionName,
    }));
}
