import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId } from '../plugins/auth.js';
import { toJsonInput } from '../utils/json.js';

const gameSchema = z.object({
  source: z.enum(['rawg', 'igdb', 'custom']).default('rawg'),
  externalId: z.string().min(1),
  title: z.string().min(1),
  coverUrl: z.string().optional(),
  platforms: z.array(z.string()).default([]),
  selectedPlatform: z.string().optional(),
  releaseDate: z.string().optional(),
  personalStatus: z.enum(['never_played', 'plan_to_play', 'wishlist', 'playing', 'finished', 'completed', 'platinum']).default('wishlist'),
  isFavorite: z.boolean().default(false),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function gameRoutes(app: FastifyInstance) {
  app.get('/me/games', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const games = await prisma.userGame.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    return { games };
  });

  app.post('/me/games', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = gameSchema.parse(request.body);
    const { metadata, ...gameInput } = input;
    const data = { ...gameInput, metadata: toJsonInput(metadata) };
    const game = await prisma.userGame.upsert({
      where: { userId_source_externalId: { userId, source: input.source, externalId: input.externalId } },
      create: { ...data, userId },
      update: data,
    });
    return { game };
  });

  app.patch('/me/games/:id', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    const input = gameSchema.partial().parse(request.body);
    const { metadata, ...gameInput } = input;
    const existing = await prisma.userGame.findFirstOrThrow({ where: { id: params.id, userId } });
    const game = await prisma.userGame.update({ where: { id: existing.id }, data: { ...gameInput, metadata: toJsonInput(metadata) } });
    return { game };
  });

  app.delete('/me/games/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.userGame.deleteMany({ where: { id: params.id, userId } });
    return reply.code(204).send();
  });
}
