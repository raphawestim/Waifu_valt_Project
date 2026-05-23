import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

export async function connectRedis() {
  if (redis.status === 'end' || redis.status === 'close') return;
  if (redis.status === 'ready') return;
  await redis.connect().catch(() => undefined);
}

export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setCache(key: string, payload: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}
