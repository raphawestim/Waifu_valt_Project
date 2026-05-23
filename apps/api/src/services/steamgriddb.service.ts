import { env } from '../config/env.js';
import { fetchCachedJson } from './externalFetch.service.js';

const STEAMGRIDDB_BASE_URL = 'https://www.steamgriddb.com/api/v2';
const TTL = 60 * 60 * 24;

function requireSteamGridDbApiKey(): string {
  if (!env.STEAMGRIDDB_API_KEY) {
    const error = new Error('SteamGridDB API key is not configured') as Error & { statusCode: number };
    error.statusCode = 503;
    throw error;
  }
  return env.STEAMGRIDDB_API_KEY;
}

function buildSteamGridDbUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${STEAMGRIDDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function authInit(): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${requireSteamGridDbApiKey()}`,
    },
  };
}

export const steamGridDbService = {
  searchSteamGridDbGames(query: string) {
    return fetchCachedJson({
      provider: 'steamgriddb',
      endpoint: 'games:search',
      url: buildSteamGridDbUrl(`/search/autocomplete/${encodeURIComponent(query)}`),
      ttlSeconds: TTL,
      init: authInit(),
      cacheParams: { query },
    });
  },

  getSteamGridDbGame(gameId: string) {
    return fetchCachedJson({
      provider: 'steamgriddb',
      endpoint: 'games:details',
      url: buildSteamGridDbUrl(`/games/id/${gameId}`),
      ttlSeconds: TTL,
      init: authInit(),
      cacheParams: { gameId },
    });
  },

  getSteamGridDbGrids(gameId: string) {
    return fetchCachedJson({
      provider: 'steamgriddb',
      endpoint: 'artwork:grids',
      url: buildSteamGridDbUrl(`/grids/game/${gameId}`, { types: 'static', dimensions: '600x900,920x430' }),
      ttlSeconds: TTL,
      init: authInit(),
      cacheParams: { gameId, kind: 'grids' },
    });
  },

  getSteamGridDbHeroes(gameId: string) {
    return fetchCachedJson({
      provider: 'steamgriddb',
      endpoint: 'artwork:heroes',
      url: buildSteamGridDbUrl(`/heroes/game/${gameId}`, { types: 'static' }),
      ttlSeconds: TTL,
      init: authInit(),
      cacheParams: { gameId, kind: 'heroes' },
    });
  },

  getSteamGridDbLogos(gameId: string) {
    return fetchCachedJson({
      provider: 'steamgriddb',
      endpoint: 'artwork:logos',
      url: buildSteamGridDbUrl(`/logos/game/${gameId}`, { types: 'static' }),
      ttlSeconds: TTL,
      init: authInit(),
      cacheParams: { gameId, kind: 'logos' },
    });
  },

  getSteamGridDbIcons(gameId: string) {
    return fetchCachedJson({
      provider: 'steamgriddb',
      endpoint: 'artwork:icons',
      url: buildSteamGridDbUrl(`/icons/game/${gameId}`),
      ttlSeconds: TTL,
      init: authInit(),
      cacheParams: { gameId, kind: 'icons' },
    });
  },
};
