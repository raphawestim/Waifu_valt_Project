import { buildCacheKey, getCache, setCache } from '../lib/cache.js';

interface FetchJsonOptions {
  provider: string;
  endpoint: string;
  url: string;
  ttlSeconds: number;
  init?: RequestInit;
  cacheParams?: object;
}

export async function fetchCachedJson<T>({
  provider,
  endpoint,
  url,
  ttlSeconds,
  init,
  cacheParams,
}: FetchJsonOptions): Promise<T> {
  const cacheKey = buildCacheKey(provider, endpoint, cacheParams || { url, method: init?.method || 'GET', body: init?.body });
  const cached = await getCache<T>(cacheKey);
  if (cached) return cached;

  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string; detail?: string; details?: string };
  if (!response.ok) {
    throw new Error(payload.message || payload.detail || payload.details || `${provider} request failed.`);
  }

  await setCache(cacheKey, payload, ttlSeconds);
  return payload;
}
