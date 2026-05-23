import type { RawgGame, RawgGameDetails, RawgGenre, RawgPlatform } from '../types/games.types';
import { getApiBaseUrl } from '../../../shared/services/apiClient';

const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY as string | undefined;
const RAWG_BASE_URL = 'https://api.rawg.io/api';
const API_BASE_URL = getApiBaseUrl();

interface RawgListResponse<T> {
  results?: T[];
}

interface RawgGameApiItem {
  id: number;
  name: string;
  slug: string;
  background_image?: string | null;
  released?: string | null;
  rating?: number;
  metacritic?: number | null;
  platforms?: Array<{ platform: RawgPlatform }>;
  genres?: RawgGenre[];
}

interface RawgGameDetailsApiItem extends RawgGameApiItem {
  description_raw?: string;
  website?: string;
  developers?: Array<{ name: string }>;
  publishers?: Array<{ name: string }>;
  stores?: Array<{ store: { name: string } }>;
  screenshots?: RawgListResponse<RawgScreenshotApiItem> | string[];
}

interface RawgScreenshotApiItem {
  id: number;
  image?: string;
}

export interface RawgSearchOptions {
  pageSize?: number;
  ordering?: string;
  genre?: string;
  platform?: string;
}

function requireRawgApiKey(): string {
  if (!RAWG_API_KEY) {
    throw new Error('RAWG API key is not configured. Add VITE_RAWG_API_KEY to your local environment.');
  }
  return RAWG_API_KEY;
}

function buildRawgUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const key = requireRawgApiKey();
  const url = new URL(`${RAWG_BASE_URL}${path}`);
  url.searchParams.set('key', key);
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(name, String(value));
  });
  return url.toString();
}

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchProxyJson<T>(path: string, timeoutMs = 12000): Promise<T> {
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, timeoutMs);
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(payload.message || 'The Vault RAWG proxy request failed.');
  return payload;
}

function withQuery(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(name, String(value));
  });
  return `${url.pathname}${url.search}`;
}

function mapRawgGame(game: RawgGameApiItem): RawgGame {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    background_image: game.background_image || undefined,
    backgroundImage: game.background_image || undefined,
    released: game.released || undefined,
    rating: game.rating,
    metacritic: game.metacritic || undefined,
    platforms: (game.platforms || []).map((entry) => entry.platform).filter(Boolean).slice(0, 6),
    genres: (game.genres || []).slice(0, 4),
  };
}

async function fetchRawgList(path: string, params: Record<string, string | number | undefined>): Promise<RawgGame[]> {
  try {
    const proxyPath = path === '/games' && params.search
      ? withQuery('/external/rawg/games/search', { ...params, q: params.search })
      : withQuery(path === '/games' ? '/external/rawg/games/popular' : `/external/rawg${path}`, params);
    const proxyPayload = await fetchProxyJson<RawgListResponse<RawgGameApiItem>>(proxyPath);
    return (proxyPayload.results || []).map(mapRawgGame);
  } catch {
    // Direct RAWG remains the local development fallback.
  }

  const response = await fetchWithTimeout(buildRawgUrl(path, params));
  if (!response.ok) throw new Error('RAWG request failed.');
  const payload = (await response.json()) as RawgListResponse<RawgGameApiItem>;
  return (payload.results || []).map(mapRawgGame);
}

export function isRawgConfigured(): boolean {
  return Boolean(API_BASE_URL || RAWG_API_KEY);
}

export async function searchGames(query: string, options: RawgSearchOptions = {}): Promise<RawgGame[]> {
  if (!query.trim()) return [];
  return fetchRawgList('/games', {
    search: query.trim(),
    page_size: options.pageSize || 20,
    ordering: options.ordering,
    genres: options.genre,
    platforms: options.platform,
  });
}

export async function getPopularGames(options: RawgSearchOptions = {}): Promise<RawgGame[]> {
  const ordering = options.ordering || '-added';
  const proxyEndpoint = ordering === '-rating'
    ? '/external/rawg/games/top-rated'
    : ordering === '-released'
      ? '/external/rawg/games/recent'
      : '/external/rawg/games/popular';
  try {
    const proxyPayload = await fetchProxyJson<RawgListResponse<RawgGameApiItem>>(withQuery(proxyEndpoint, {
      ordering,
      page_size: options.pageSize || 12,
      genres: options.genre,
      platforms: options.platform,
    }));
    return (proxyPayload.results || []).map(mapRawgGame);
  } catch {
    // Direct RAWG remains the local development fallback.
  }
  return fetchRawgList('/games', {
    ordering,
    page_size: options.pageSize || 12,
    genres: options.genre,
    platforms: options.platform,
  });
}

export async function getTopRatedGames(options: RawgSearchOptions = {}): Promise<RawgGame[]> {
  return getPopularGames({ ...options, ordering: '-rating' });
}

export async function getRecentlyReleasedGames(options: RawgSearchOptions = {}): Promise<RawgGame[]> {
  return getPopularGames({ ...options, ordering: '-released' });
}

export async function getGameDetails(gameId: number | string): Promise<RawgGameDetails> {
  let payload: RawgGameDetailsApiItem;
  let screenshots: string[] = [];
  try {
    payload = await fetchProxyJson<RawgGameDetailsApiItem>(`/external/rawg/games/${gameId}`);
    if (Array.isArray(payload.screenshots)) {
      screenshots = payload.screenshots.filter((image): image is string => typeof image === 'string');
    } else {
      screenshots = (payload.screenshots?.results || []).map((item) => item.image).filter((image): image is string => Boolean(image));
    }
  } catch {
    const response = await fetchWithTimeout(buildRawgUrl(`/games/${gameId}`));
    if (!response.ok) throw new Error('RAWG game details request failed.');
    payload = (await response.json()) as RawgGameDetailsApiItem;
    try {
      const screenshotResponse = await fetchWithTimeout(buildRawgUrl(`/games/${gameId}/screenshots`, { page_size: 6 }), 8000);
      if (screenshotResponse.ok) {
        const screenshotPayload = (await screenshotResponse.json()) as RawgListResponse<RawgScreenshotApiItem>;
        screenshots = (screenshotPayload.results || []).map((item) => item.image).filter((image): image is string => Boolean(image));
      }
    } catch {
      screenshots = [];
    }
  }
  return {
    ...mapRawgGame(payload),
    description_raw: payload.description_raw,
    description: payload.description_raw,
    website: payload.website,
    developers: (payload.developers || []).map((item) => item.name),
    publishers: (payload.publishers || []).map((item) => item.name),
    stores: (payload.stores || []).map((item) => item.store.name),
    screenshots,
  };
}

export async function getGenres(): Promise<RawgGenre[]> {
  try {
    const payload = await fetchProxyJson<RawgListResponse<RawgGenre>>('/external/rawg/genres');
    return payload.results || [];
  } catch {
    // Direct RAWG remains the local development fallback.
  }
  const response = await fetchWithTimeout(buildRawgUrl('/genres'));
  if (!response.ok) throw new Error('RAWG genres request failed.');
  const payload = (await response.json()) as RawgListResponse<RawgGenre>;
  return payload.results || [];
}

export async function getPlatforms(): Promise<RawgPlatform[]> {
  try {
    const payload = await fetchProxyJson<RawgListResponse<RawgPlatform>>('/external/rawg/platforms');
    return payload.results || [];
  } catch {
    // Direct RAWG remains the local development fallback.
  }
  const response = await fetchWithTimeout(buildRawgUrl('/platforms'));
  if (!response.ok) throw new Error('RAWG platforms request failed.');
  const payload = (await response.json()) as RawgListResponse<RawgPlatform>;
  return payload.results || [];
}
