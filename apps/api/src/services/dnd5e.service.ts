import { fetchCachedJson } from './externalFetch.service.js';

const DND_BASE_URL = 'https://www.dnd5eapi.co/api';
const TTL = 60 * 60 * 24;

function buildDndUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${DND_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export const dnd5eService = {
  get(path: string, params: Record<string, string | number | undefined> = {}) {
    return fetchCachedJson({
      provider: 'dnd5e',
      endpoint: path,
      url: buildDndUrl(path, params),
      ttlSeconds: TTL,
      cacheParams: { path, params },
    });
  },
};
