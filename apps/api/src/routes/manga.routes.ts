import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId } from '../plugins/auth.js';
import { toJsonInput } from '../utils/json.js';

const mangaSchema = z.object({
  source: z.enum(['anilist', 'jikan', 'mangadex', 'kitsu', 'custom']),
  externalId: z.string(),
  type: z.enum(['manga', 'anime']),
  title: z.string(),
  coverUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  authors: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
  status: z.enum(['favorite', 'want_to_read', 'reading', 'completed', 'paused', 'dropped']).default('want_to_read'),
  currentChapter: z.number().int().optional(),
  totalChapters: z.number().int().optional(),
  currentEpisode: z.number().int().optional(),
  totalEpisodes: z.number().int().optional(),
  personalRating: z.number().int().optional(),
  notes: z.string().optional(),
  isFavorite: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function mangaRoutes(app: FastifyInstance) {
  app.get('/me/manga', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const manga = await prisma.userMangaItem.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    return { manga };
  });

  app.post('/me/manga', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = mangaSchema.parse(request.body);
    const { metadata, ...mangaInput } = input;
    const data = { ...mangaInput, metadata: toJsonInput(metadata) };
    const item = await prisma.userMangaItem.upsert({
      where: { userId_source_externalId: { userId, source: input.source, externalId: input.externalId } },
      create: { ...data, userId },
      update: data,
    });
    return { item };
  });

  app.patch('/me/manga/:id', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    const input = mangaSchema.partial().parse(request.body);
    const { metadata, ...mangaInput } = input;
    const existing = await prisma.userMangaItem.findFirstOrThrow({ where: { id: params.id, userId } });
    const item = await prisma.userMangaItem.update({ where: { id: existing.id }, data: { ...mangaInput, metadata: toJsonInput(metadata) } });
    return { item };
  });

  app.delete('/me/manga/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.userMangaItem.deleteMany({ where: { id: params.id, userId } });
    return reply.code(204).send();
  });
}
