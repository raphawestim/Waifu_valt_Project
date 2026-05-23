import { fetchCachedJson } from './externalFetch.service.js';

const STEAM_STORE_BASE_URL = 'https://store.steampowered.com/api';
const TTL = 60 * 60 * 24;

interface SteamStoreSearchResponse {
  items?: SteamSearchApp[];
}

export interface SteamSearchApp {
  id: number;
  name: string;
  tiny_image?: string;
  price?: {
    final?: number;
    currency?: string;
  };
}

function buildSteamUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${STEAM_STORE_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export const steamService = {
  async searchSteamApps(query: string): Promise<SteamSearchApp[]> {
    const payload = await fetchCachedJson<SteamStoreSearchResponse>({
      provider: 'steam',
      endpoint: 'apps:search',
      url: buildSteamUrl('/storesearch', { term: query, l: 'english', cc: 'us' }),
      ttlSeconds: TTL,
      cacheParams: { query },
    });
    return payload.items || [];
  },

  getSteamAppDetails(appId: string) {
    return fetchCachedJson({
      provider: 'steam',
      endpoint: 'apps:details',
      url: buildSteamUrl('/appdetails', { appids: appId, l: 'english', cc: 'us' }),
      ttlSeconds: TTL,
      cacheParams: { appId },
    });
  },

  getSteamStoreUrl(appId: string) {
    return {
      appId,
      storeUrl: `https://store.steampowered.com/app/${encodeURIComponent(appId)}`,
    };
  },
};
