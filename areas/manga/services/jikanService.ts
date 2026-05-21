import type { MangaAnimeSearchResult } from '../types/manga.types';

interface JikanMedia {
  mal_id: number;
  title: string;
  synopsis?: string | null;
  status?: string;
  score?: number | null;
  year?: number | null;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  url: string;
}

interface JikanResponse {
  data?: JikanMedia[];
}

const jikanSearchCache = new Map<string, MangaAnimeSearchResult[]>();

async function searchJikanEndpoint(kind: 'anime' | 'manga', query: string): Promise<MangaAnimeSearchResult[]> {
  const response = await fetch(`https://api.jikan.moe/v4/${kind}?q=${encodeURIComponent(query)}&limit=4&sfw=true`);
  if (!response.ok) throw new Error(`Jikan ${kind} search failed.`);

  const payload = (await response.json()) as JikanResponse;
  return (payload.data || []).map((media) => ({
    id: `jikan-${kind}-${media.mal_id}`,
    source: 'jikan',
    title: media.title,
    kind,
    description: media.synopsis?.slice(0, 220) || undefined,
    imageUrl: media.images?.jpg?.large_image_url || media.images?.jpg?.image_url,
    status: media.status,
    score: media.score || undefined,
    year: media.year || undefined,
    sourceUrl: media.url,
  }));
}

export async function searchJikan(query: string): Promise<MangaAnimeSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  const cacheKey = trimmedQuery.toLowerCase();
  const cachedResults = jikanSearchCache.get(cacheKey);
  if (cachedResults) return cachedResults;

  const [animeResults, mangaResults] = await Promise.all([
    searchJikanEndpoint('anime', trimmedQuery),
    searchJikanEndpoint('manga', trimmedQuery),
  ]);

  const results = [...animeResults, ...mangaResults].slice(0, 8);
  jikanSearchCache.set(cacheKey, results);
  return results;
}
