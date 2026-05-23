import { fetchCachedJson } from './externalFetch.service.js';

const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
const TTL = {
  search: 60 * 60,
  random: 60 * 30,
  details: 60 * 60,
  sets: 60 * 60 * 24,
};

function buildScryfallUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${SCRYFALL_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export const scryfallService = {
  searchCards(query: string, options: Record<string, string | number | undefined> = {}) {
    const params = {
      q: query,
      unique: options.unique || 'cards',
      order: options.order || 'released',
      page: options.page,
    };
    return fetchCachedJson({
      provider: 'scryfall',
      endpoint: 'cards:search',
      url: buildScryfallUrl('/cards/search', params),
      ttlSeconds: TTL.search,
      cacheParams: params,
    });
  },

  getRandomCard() {
    return fetchCachedJson({
      provider: 'scryfall',
      endpoint: 'cards:random',
      url: buildScryfallUrl('/cards/random'),
      ttlSeconds: TTL.random,
      cacheParams: { bucket: Math.floor(Date.now() / (TTL.random * 1000)) },
    });
  },

  getCardById(id: string) {
    return fetchCachedJson({
      provider: 'scryfall',
      endpoint: 'cards:details',
      url: buildScryfallUrl(`/cards/${id}`),
      ttlSeconds: TTL.details,
      cacheParams: { id },
    });
  },

  getSets() {
    return fetchCachedJson({
      provider: 'scryfall',
      endpoint: 'sets',
      url: buildScryfallUrl('/sets'),
      ttlSeconds: TTL.sets,
    });
  },
};
