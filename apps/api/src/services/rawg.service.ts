import { env } from '../config/env.js';
import { fetchCachedJson } from './externalFetch.service.js';

const RAWG_BASE_URL = 'https://api.rawg.io/api';
const TTL = {
  list: 60 * 60 * 6,
  search: 60 * 60,
  details: 60 * 60 * 24,
};

function requireRawgApiKey(): string {
  if (!env.RAWG_API_KEY) throw new Error('RAWG API key is not configured');
  return env.RAWG_API_KEY;
}

function buildRawgUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${RAWG_BASE_URL}${path}`);
  url.searchParams.set('key', requireRawgApiKey());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function listParams(options: Record<string, string | number | undefined> = {}) {
  return {
    page_size: options.page_size || options.pageSize || 12,
    ordering: options.ordering,
    genres: options.genres || options.genre,
    platforms: options.platforms || options.platform,
  };
}

export const rawgService = {
  searchGames(query: string, options: Record<string, string | number | undefined> = {}) {
    return fetchCachedJson({
      provider: 'rawg',
      endpoint: 'games:search',
      url: buildRawgUrl('/games', { search: query, page_size: options.page_size || options.pageSize || 20, ordering: options.ordering, genres: options.genres || options.genre, platforms: options.platforms || options.platform }),
      ttlSeconds: TTL.search,
      cacheParams: { query, ...options },
    });
  },

  getPopularGames(options: Record<string, string | number | undefined> = {}) {
    const params = { ...listParams(options), ordering: options.ordering || '-added' };
    return fetchCachedJson({
      provider: 'rawg',
      endpoint: 'games:popular',
      url: buildRawgUrl('/games', params),
      ttlSeconds: TTL.list,
      cacheParams: params,
    });
  },

  getTopRatedGames(options: Record<string, string | number | undefined> = {}) {
    const params = { ...listParams(options), ordering: options.ordering || '-rating' };
    return fetchCachedJson({
      provider: 'rawg',
      endpoint: 'games:top-rated',
      url: buildRawgUrl('/games', params),
      ttlSeconds: TTL.list,
      cacheParams: params,
    });
  },

  getRecentlyReleasedGames(options: Record<string, string | number | undefined> = {}) {
    const params = { ...listParams(options), ordering: options.ordering || '-released' };
    return fetchCachedJson({
      provider: 'rawg',
      endpoint: 'games:recent',
      url: buildRawgUrl('/games', params),
      ttlSeconds: TTL.list,
      cacheParams: params,
    });
  },

  async getGameDetails(gameId: string) {
    const details = await fetchCachedJson({
      provider: 'rawg',
      endpoint: 'games:details',
      url: buildRawgUrl(`/games/${gameId}`),
      ttlSeconds: TTL.details,
      cacheParams: { gameId },
    });
    const screenshots = await fetchCachedJson({
      provider: 'rawg',
      endpoint: 'games:screenshots',
      url: buildRawgUrl(`/games/${gameId}/screenshots`, { page_size: 6 }),
      ttlSeconds: TTL.details,
      cacheParams: { gameId, page_size: 6 },
    }).catch(() => ({ results: [] }));
    return { ...(details as object), screenshots };
  },

  getGenres() {
    return fetchCachedJson({
      provider: 'rawg',
      endpoint: 'genres',
      url: buildRawgUrl('/genres'),
      ttlSeconds: TTL.details,
    });
  },

  getPlatforms() {
    return fetchCachedJson({
      provider: 'rawg',
      endpoint: 'platforms',
      url: buildRawgUrl('/platforms'),
      ttlSeconds: TTL.details,
    });
  },
};
