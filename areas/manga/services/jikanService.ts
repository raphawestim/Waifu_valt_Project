import type { MangaMediaItem, MediaType } from '../types/manga.types';
import { mediaToSearchResult, type MangaAnimeSearchResult } from '../types/manga.types';
import { getApiBaseUrl } from '../../../shared/services/apiClient';

interface JikanMedia {
  mal_id: number;
  title: string;
  title_japanese?: string;
  synopsis?: string | null;
  status?: string;
  score?: number | null;
  popularity?: number | null;
  year?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  episodes?: number | null;
  type?: string;
  genres?: Array<{ name: string }>;
  authors?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
  images?: { jpg?: { image_url?: string; large_image_url?: string } };
  url: string;
}

interface JikanResponse {
  data?: JikanMedia[];
}

interface JikanDetailsResponse {
  data?: JikanMedia;
}

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const API_BASE_URL = getApiBaseUrl();
const cache = new Map<string, MangaMediaItem[] | MangaMediaItem>();

function normalizeJikan(media: JikanMedia, type: MediaType): MangaMediaItem {
  return {
    id: `jikan-${type}-${media.mal_id}`,
    source: 'jikan',
    externalId: String(media.mal_id),
    type,
    title: media.title,
    titleNative: media.title_japanese,
    description: media.synopsis || undefined,
    coverUrl: media.images?.jpg?.large_image_url || media.images?.jpg?.image_url,
    genres: media.genres?.map((genre) => genre.name),
    status: media.status,
    chapters: media.chapters || undefined,
    volumes: media.volumes || undefined,
    episodes: media.episodes || undefined,
    score: media.score || undefined,
    popularity: media.popularity || undefined,
    year: media.year || undefined,
    format: media.type,
    sourceUrl: media.url,
    metadata: {
      provider: 'Jikan',
      authors: media.authors?.map((author) => author.name),
      studios: media.studios?.map((studio) => studio.name),
    },
  };
}

async function fetchJikan<T>(path: string): Promise<T> {
  const response = await fetch(`${JIKAN_BASE_URL}${path}`);
  if (response.status === 429) throw new Error('Jikan rate limit reached. Wait a moment and try again.');
  if (!response.ok) throw new Error('Jikan request failed.');
  return (await response.json()) as T;
}

async function fetchProxy<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(payload.message || 'Jikan proxy request failed.');
  return payload;
}

async function searchJikanType(type: MediaType, query: string): Promise<MangaMediaItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const cacheKey = `search:${type}:${trimmed.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (Array.isArray(cached)) return cached;
  let payload: JikanResponse;
  try {
    const url = new URL(`${API_BASE_URL}/external/jikan/search`);
    url.searchParams.set('q', trimmed);
    url.searchParams.set('type', type);
    payload = await fetchProxy<JikanResponse>(`${url.pathname}${url.search}`);
  } catch {
    payload = await fetchJikan<JikanResponse>(`/${type}?q=${encodeURIComponent(trimmed)}&limit=12&sfw=true`);
  }
  const results = (payload.data || []).map((media) => normalizeJikan(media, type));
  cache.set(cacheKey, results);
  return results;
}

export const searchJikanManga = (query: string) => searchJikanType('manga', query);
export const searchJikanAnime = (query: string) => searchJikanType('anime', query);

export async function getTopManga(): Promise<MangaMediaItem[]> {
  const cacheKey = 'top:manga';
  const cached = cache.get(cacheKey);
  if (Array.isArray(cached)) return cached;
  let payload: JikanResponse;
  try {
    payload = await fetchProxy<JikanResponse>('/external/jikan/top?type=manga');
  } catch {
    payload = await fetchJikan<JikanResponse>('/top/manga?limit=16');
  }
  const results = (payload.data || []).map((media) => normalizeJikan(media, 'manga'));
  cache.set(cacheKey, results);
  return results;
}

export async function getTopAnime(): Promise<MangaMediaItem[]> {
  const cacheKey = 'top:anime';
  const cached = cache.get(cacheKey);
  if (Array.isArray(cached)) return cached;
  let payload: JikanResponse;
  try {
    payload = await fetchProxy<JikanResponse>('/external/jikan/top?type=anime');
  } catch {
    payload = await fetchJikan<JikanResponse>('/top/anime?limit=16');
  }
  const results = (payload.data || []).map((media) => normalizeJikan(media, 'anime'));
  cache.set(cacheKey, results);
  return results;
}

export async function getJikanMangaDetails(id: string | number): Promise<MangaMediaItem> {
  const numericId = Number(String(id).replace('jikan-manga-', ''));
  const cacheKey = `details:manga:${numericId}`;
  const cached = cache.get(cacheKey);
  if (cached && !Array.isArray(cached)) return cached;
  let payload: JikanDetailsResponse;
  try {
    payload = await fetchProxy<JikanDetailsResponse>(`/external/jikan/media/manga/${numericId}`);
  } catch {
    payload = await fetchJikan<JikanDetailsResponse>(`/manga/${numericId}`);
  }
  if (!payload.data) throw new Error('Jikan manga details not found.');
  const result = normalizeJikan(payload.data, 'manga');
  cache.set(cacheKey, result);
  return result;
}

export async function getJikanAnimeDetails(id: string | number): Promise<MangaMediaItem> {
  const numericId = Number(String(id).replace('jikan-anime-', ''));
  const cacheKey = `details:anime:${numericId}`;
  const cached = cache.get(cacheKey);
  if (cached && !Array.isArray(cached)) return cached;
  let payload: JikanDetailsResponse;
  try {
    payload = await fetchProxy<JikanDetailsResponse>(`/external/jikan/media/anime/${numericId}`);
  } catch {
    payload = await fetchJikan<JikanDetailsResponse>(`/anime/${numericId}`);
  }
  if (!payload.data) throw new Error('Jikan anime details not found.');
  const result = normalizeJikan(payload.data, 'anime');
  cache.set(cacheKey, result);
  return result;
}

export async function searchJikan(query: string): Promise<MangaAnimeSearchResult[]> {
  const [animeResults, mangaResults] = await Promise.all([searchJikanAnime(query), searchJikanManga(query)]);
  return [...animeResults, ...mangaResults].slice(0, 12).map(mediaToSearchResult);
}
