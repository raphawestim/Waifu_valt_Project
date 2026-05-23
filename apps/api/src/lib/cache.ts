import { env } from '../config/env.js';
import { connectRedis, redis } from './redis.js';

const isDev = env.NODE_ENV !== 'production';

function stableSerialize(value: unknown): string {
  if (!value || typeof value !== 'object') return JSON.stringify(value ?? {});
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => JSON.parse(stableSerialize(item))));
  const record = value as Record<string, unknown>;
  const sorted = Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      const current = record[key];
      if (current !== undefined && current !== '') accumulator[key] = current;
      return accumulator;
    }, {});
  return JSON.stringify(sorted);
}

function warnDev(message: string, error?: unknown): void {
  if (isDev) console.warn(message, error ?? '');
}

export function buildCacheKey(provider: string, endpoint: string, params?: object): string {
  return `thevault:external:${provider}:${endpoint}:${stableSerialize(params)}`;
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    await connectRedis();
    if (redis.status !== 'ready') return null;
    const raw = await redis.get(key);
    if (!raw) {
      if (isDev) console.warn(`[cache] miss ${key}`);
      return null;
    }
    if (isDev) console.warn(`[cache] hit ${key}`);
    return JSON.parse(raw) as T;
  } catch (error) {
    warnDev('[cache] read failed; continuing without Redis cache.', error);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await connectRedis();
    if (redis.status !== 'ready') return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    warnDev('[cache] write failed; continuing without Redis cache.', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await connectRedis();
    if (redis.status !== 'ready') return;
    await redis.del(key);
  } catch (error) {
    warnDev('[cache] delete failed; continuing without Redis cache.', error);
  }
}
