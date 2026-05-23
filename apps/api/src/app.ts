import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { connectRedis, redis } from './lib/redis.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.routes.js';
import { deckRoutes } from './routes/deck.routes.js';
import { favoriteRoutes } from './routes/favorite.routes.js';
import { externalRoutes } from './routes/external.routes.js';
import { gameRoutes } from './routes/game.routes.js';
import { mangaRoutes } from './routes/manga.routes.js';
import { rpgRoutes } from './routes/rpg.routes.js';
import { userRoutes } from './routes/user.routes.js';

export async function buildApp() {
  const app = Fastify({ logger: true });
  const configuredOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
  const devOrigins = env.NODE_ENV === 'production'
    ? []
    : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
  const allowedOrigins = Array.from(new Set([...configuredOrigins, ...devOrigins]));

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: 'Validation failed.',
        issues: error.issues,
      });
    }

    const normalizedError = error instanceof Error ? error : new Error('Internal server error.');
    const statusCode = 'statusCode' in normalizedError &&
      typeof normalizedError.statusCode === 'number' &&
      normalizedError.statusCode >= 400
      ? normalizedError.statusCode
      : 500;
    const message = statusCode >= 500 && env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : normalizedError.message || 'Internal server error.';

    requestLogError(app, normalizedError, statusCode);
    return reply.code(statusCode).send({ message });
  });

  await app.register(jwt, { secret: env.JWT_SECRET });
  await authPlugin(app);

  app.get('/health', async () => {
    let database: 'connected' | 'unknown' = 'unknown';
    let redisStatus: 'connected' | 'unknown' = 'unknown';

    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'unknown';
    }

    try {
      await connectRedis();
      if (redis.status === 'ready') {
        await redis.ping();
        redisStatus = 'connected';
      }
    } catch {
      redisStatus = 'unknown';
    }

    return {
      ok: true,
      service: 'the-vault-api',
      timestamp: new Date().toISOString(),
      database,
      redis: redisStatus,
      cache: redisStatus === 'connected' ? 'available' : 'unavailable',
    };
  });

  await app.register(externalRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(favoriteRoutes);
  await app.register(gameRoutes);
  await app.register(deckRoutes);
  await app.register(mangaRoutes);
  await app.register(rpgRoutes);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });

  return app;
}

function requestLogError(app: FastifyInstance, error: Error, statusCode: number) {
  if (statusCode >= 500) app.log.error(error);
  else app.log.warn(error);
}
