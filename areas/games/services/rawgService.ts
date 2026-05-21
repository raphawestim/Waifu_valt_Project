import type { RawgGame, RawgGameDetails, RawgGenre, RawgPlatform } from '../types/games.types';

const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY as string | undefined;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

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

function mapRawgGame(game: RawgGameApiItem): RawgGame {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    backgroundImage: game.background_image || undefined,
    released: game.released || undefined,
    rating: game.rating,
    metacritic: game.metacritic || undefined,
    platforms: (game.platforms || []).map((entry) => entry.platform).filter(Boolean).slice(0, 6),
    genres: (game.genres || []).slice(0, 4),
  };
}

async function fetchRawgList(path: string, params: Record<string, string | number | undefined>): Promise<RawgGame[]> {
  const response = await fetch(buildRawgUrl(path, params));
  if (!response.ok) throw new Error('RAWG request failed.');
  const payload = (await response.json()) as RawgListResponse<RawgGameApiItem>;
  return (payload.results || []).map(mapRawgGame);
}

export function isRawgConfigured(): boolean {
  return Boolean(RAWG_API_KEY);
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
  return fetchRawgList('/games', {
    ordering: options.ordering || '-added',
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
  const response = await fetch(buildRawgUrl(`/games/${gameId}`));
  if (!response.ok) throw new Error('RAWG game details request failed.');
  const payload = (await response.json()) as RawgGameDetailsApiItem;
  return {
    ...mapRawgGame(payload),
    description: payload.description_raw,
    website: payload.website,
    developers: (payload.developers || []).map((item) => item.name),
    publishers: (payload.publishers || []).map((item) => item.name),
    stores: (payload.stores || []).map((item) => item.store.name),
  };
}

export async function getGenres(): Promise<RawgGenre[]> {
  const response = await fetch(buildRawgUrl('/genres'));
  if (!response.ok) throw new Error('RAWG genres request failed.');
  const payload = (await response.json()) as RawgListResponse<RawgGenre>;
  return payload.results || [];
}

export async function getPlatforms(): Promise<RawgPlatform[]> {
  const response = await fetch(buildRawgUrl('/platforms'));
  if (!response.ok) throw new Error('RAWG platforms request failed.');
  const payload = (await response.json()) as RawgListResponse<RawgPlatform>;
  return payload.results || [];
}
