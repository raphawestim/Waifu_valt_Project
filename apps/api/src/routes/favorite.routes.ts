import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId } from '../plugins/auth.js';
import { toJsonInput } from '../utils/json.js';

const favoriteSchema = z.object({
  vault: z.enum(['games', 'tcg', 'manga', 'rpg', 'forge', 'nsfw']),
  type: z.string().min(1),
  source: z.string().optional(),
  externalId: z.string().optional(),
  title: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function favoriteRoutes(app: FastifyInstance) {
  app.get('/me/favorites', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const favorites = await prisma.globalFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { favorites };
  });

  app.post('/me/favorites', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = favoriteSchema.parse(request.body);
    const { metadata, ...favoriteInput } = input;
    const data = { ...favoriteInput, metadata: toJsonInput(metadata) };
    const existing = input.source && input.externalId
      ? await prisma.globalFavorite.findUnique({
        where: {
          userId_vault_type_source_externalId: {
            userId,
            vault: input.vault,
            type: input.type,
            source: input.source,
            externalId: input.externalId,
          },
        },
      })
      : null;

    const favorite = existing
      ? await prisma.globalFavorite.update({ where: { id: existing.id }, data })
      : await prisma.globalFavorite.create({ data: { ...data, userId } });

    return { favorite };
  });

  app.delete('/me/favorites/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.globalFavorite.deleteMany({ where: { id: params.id, userId } });
    return reply.code(204).send();
  });
}
