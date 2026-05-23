import { fetchCachedJson } from './externalFetch.service.js';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const TTL = 60 * 60;

type JikanMediaType = 'manga' | 'anime';

function normalizeType(type?: string): JikanMediaType {
  return type === 'anime' ? 'anime' : 'manga';
}

function buildJikanUrl(path: string, params: Record<string, string | number | boolean | undefined> = {}): string {
  const url = new URL(`${JIKAN_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export const jikanService = {
  search(query: string, type?: string) {
    const mediaType = normalizeType(type);
    const params = { q: query, limit: 12, sfw: true };
    return fetchCachedJson({
      provider: 'jikan',
      endpoint: `${mediaType}:search`,
      url: buildJikanUrl(`/${mediaType}`, params),
      ttlSeconds: TTL,
      cacheParams: { mediaType, ...params },
    });
  },

  top(type?: string) {
    const mediaType = normalizeType(type);
    return fetchCachedJson({
      provider: 'jikan',
      endpoint: `${mediaType}:top`,
      url: buildJikanUrl(`/top/${mediaType}`, { limit: 16 }),
      ttlSeconds: TTL,
      cacheParams: { mediaType, limit: 16 },
    });
  },

  mediaDetails(type: string, id: string) {
    const mediaType = normalizeType(type);
    return fetchCachedJson({
      provider: 'jikan',
      endpoint: `${mediaType}:details`,
      url: buildJikanUrl(`/${mediaType}/${id}`),
      ttlSeconds: TTL,
      cacheParams: { mediaType, id },
    });
  },
};
