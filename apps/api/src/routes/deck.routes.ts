import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId } from '../plugins/auth.js';
import { toJsonInput } from '../utils/json.js';

const deckSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  game: z.enum(['magic', 'pokemon_tcg', 'yugioh', 'custom']).default('magic'),
  format: z.string().default('standard'),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
});

const cardSchema = z.object({
  source: z.enum(['scryfall', 'apitcg', 'custom']).default('scryfall'),
  externalId: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function deckRoutes(app: FastifyInstance) {
  app.get('/me/decks', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const decks = await prisma.userDeck.findMany({
      where: { userId },
      include: { cards: true },
      orderBy: { updatedAt: 'desc' },
    });
    return { decks };
  });

  app.post('/me/decks', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = deckSchema.parse(request.body);
    const deck = await prisma.userDeck.create({ data: { ...input, userId }, include: { cards: true } });
    return { deck };
  });

  app.get('/me/decks/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    const deck = await prisma.userDeck.findFirst({ where: { id: params.id, userId }, include: { cards: true } });
    if (!deck) return reply.code(404).send({ message: 'Deck not found.' });
    return { deck };
  });

  app.patch('/me/decks/:id', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    const input = deckSchema.partial().parse(request.body);
    const existing = await prisma.userDeck.findFirstOrThrow({ where: { id: params.id, userId } });
    const deck = await prisma.userDeck.update({ where: { id: existing.id }, data: input, include: { cards: true } });
    return { deck };
  });

  app.delete('/me/decks/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.userDeck.deleteMany({ where: { id: params.id, userId } });
    return reply.code(204).send();
  });

  app.post('/me/decks/:id/cards', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    const input = cardSchema.parse(request.body);
    const { metadata, ...cardInput } = input;
    const data = { ...cardInput, metadata: toJsonInput(metadata) };
    const deck = await prisma.userDeck.findFirst({ where: { id: params.id, userId } });
    if (!deck) return reply.code(404).send({ message: 'Deck not found.' });
    const card = await prisma.deckCard.upsert({
      where: { deckId_source_externalId: { deckId: params.id, source: input.source, externalId: input.externalId } },
      create: { ...data, deckId: params.id },
      update: { ...data, quantity: { increment: input.quantity } },
    });
    const updatedDeck = await prisma.userDeck.findUniqueOrThrow({ where: { id: params.id }, include: { cards: true } });
    return { card, deck: updatedDeck };
  });

  app.patch('/me/decks/:id/cards/:cardId', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string(), cardId: z.string() }).parse(request.params);
    const input = cardSchema.partial().parse(request.body);
    const { metadata, ...cardInput } = input;
    const deck = await prisma.userDeck.findFirst({ where: { id: params.id, userId } });
    if (!deck) return reply.code(404).send({ message: 'Deck not found.' });
    const existing = await prisma.deckCard.findFirst({ where: { id: params.cardId, deckId: params.id } });
    if (!existing) return reply.code(404).send({ message: 'Card not found.' });
    const card = await prisma.deckCard.update({ where: { id: existing.id }, data: { ...cardInput, metadata: toJsonInput(metadata) } });
    const updatedDeck = await prisma.userDeck.findUniqueOrThrow({ where: { id: params.id }, include: { cards: true } });
    return { card, deck: updatedDeck };
  });

  app.delete('/me/decks/:id/cards/:cardId', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string(), cardId: z.string() }).parse(request.params);
    const deck = await prisma.userDeck.findFirst({ where: { id: params.id, userId } });
    if (!deck) return reply.code(404).send({ message: 'Deck not found.' });
    await prisma.deckCard.deleteMany({ where: { id: params.cardId, deckId: params.id } });
    const updatedDeck = await prisma.userDeck.findUniqueOrThrow({ where: { id: params.id }, include: { cards: true } });
    return { deck: updatedDeck };
  });
}
