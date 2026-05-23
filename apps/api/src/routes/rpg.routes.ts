import type { FastifyInstance } from 'fastify';
import type { Prisma, RpgCampaign, RpgCharacter, RpgSession } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId } from '../plugins/auth.js';
import { toJsonInput, toRequiredJsonInput } from '../utils/json.js';

interface CharacterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

const DEFAULT_ATTRIBUTES: CharacterAttributes = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

function toIsoDate(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

function normalizeAttributes(value: Prisma.JsonValue): CharacterAttributes {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_ATTRIBUTES;
  const record = value as Record<string, unknown>;
  return {
    strength: typeof record.strength === 'number' ? record.strength : DEFAULT_ATTRIBUTES.strength,
    dexterity: typeof record.dexterity === 'number' ? record.dexterity : DEFAULT_ATTRIBUTES.dexterity,
    constitution: typeof record.constitution === 'number' ? record.constitution : DEFAULT_ATTRIBUTES.constitution,
    intelligence: typeof record.intelligence === 'number' ? record.intelligence : DEFAULT_ATTRIBUTES.intelligence,
    wisdom: typeof record.wisdom === 'number' ? record.wisdom : DEFAULT_ATTRIBUTES.wisdom,
    charisma: typeof record.charisma === 'number' ? record.charisma : DEFAULT_ATTRIBUTES.charisma,
  };
}

function normalizeCharacter(character: RpgCharacter) {
  return {
    ...character,
    attributes: normalizeAttributes(character.attributes),
    notes: character.notes ?? '',
    createdAt: character.createdAt.toISOString(),
    updatedAt: character.updatedAt.toISOString(),
  };
}

function normalizeCampaign(campaign: RpgCampaign) {
  return {
    ...campaign,
    characterIds: campaign.characterIds || [],
    notes: campaign.notes ?? '',
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

function normalizeSession(session: RpgSession) {
  return {
    ...session,
    summary: session.summary ?? '',
    notes: session.notes ?? '',
    sessionDate: toIsoDate(session.sessionDate),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

const characterSchema = z.object({
  name: z.string().min(1),
  raceIndex: z.string().optional(),
  raceName: z.string().optional(),
  classIndex: z.string().optional(),
  className: z.string().optional(),
  level: z.number().int().min(1).default(1),
  background: z.string().optional(),
  alignment: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).default({ strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }),
  notes: z.string().optional(),
  isFavorite: z.boolean().default(false),
});

const campaignSchema = z.object({
  name: z.string().min(1),
  system: z.string().default('dnd5e'),
  tone: z.string().optional(),
  world: z.string().optional(),
  description: z.string().optional(),
  characterIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isFavorite: z.boolean().default(false),
});

const sessionSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  notes: z.string().optional(),
  sessionDate: z.string().optional(),
});

export async function rpgRoutes(app: FastifyInstance) {
  app.get('/me/rpg/characters', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const characters = await prisma.rpgCharacter.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    return { characters: characters.map(normalizeCharacter) };
  });

  app.post('/me/rpg/characters', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = characterSchema.parse(request.body);
    const character = await prisma.rpgCharacter.create({ data: { ...input, attributes: toRequiredJsonInput(input.attributes), userId } });
    return { character: normalizeCharacter(character) };
  });

  app.patch('/me/rpg/characters/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    const input = characterSchema.partial().parse(request.body);
    const existing = await prisma.rpgCharacter.findFirst({ where: { id: params.id, userId } });
    if (!existing) return reply.code(404).send({ message: 'Character not found.' });
    const character = await prisma.rpgCharacter.update({ where: { id: params.id }, data: { ...input, attributes: toJsonInput(input.attributes) } });
    return { character: normalizeCharacter(character) };
  });

  app.delete('/me/rpg/characters/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.rpgCharacter.deleteMany({ where: { id: params.id, userId } });
    return reply.code(204).send();
  });

  app.get('/me/rpg/campaigns', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const campaigns = await prisma.rpgCampaign.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    return { campaigns: campaigns.map(normalizeCampaign) };
  });

  app.post('/me/rpg/campaigns', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = campaignSchema.parse(request.body);
    const campaign = await prisma.rpgCampaign.create({ data: { ...input, userId } });
    return { campaign: normalizeCampaign(campaign) };
  });

  app.patch('/me/rpg/campaigns/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    const input = campaignSchema.partial().parse(request.body);
    const existing = await prisma.rpgCampaign.findFirst({ where: { id: params.id, userId } });
    if (!existing) return reply.code(404).send({ message: 'Campaign not found.' });
    const campaign = await prisma.rpgCampaign.update({ where: { id: params.id }, data: input });
    return { campaign: normalizeCampaign(campaign) };
  });

  app.delete('/me/rpg/campaigns/:id', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.rpgCampaign.deleteMany({ where: { id: params.id, userId } });
    return reply.code(204).send();
  });

  app.get('/me/rpg/campaigns/:campaignId/sessions', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ campaignId: z.string() }).parse(request.params);
    const campaign = await prisma.rpgCampaign.findFirst({ where: { id: params.campaignId, userId } });
    if (!campaign) return reply.code(404).send({ message: 'Campaign not found.' });
    const sessions = await prisma.rpgSession.findMany({ where: { campaignId: params.campaignId, userId }, orderBy: { createdAt: 'desc' } });
    return { sessions: sessions.map(normalizeSession) };
  });

  app.post('/me/rpg/campaigns/:campaignId/sessions', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ campaignId: z.string() }).parse(request.params);
    const input = sessionSchema.parse(request.body);
    const campaign = await prisma.rpgCampaign.findFirst({ where: { id: params.campaignId, userId } });
    if (!campaign) return reply.code(404).send({ message: 'Campaign not found.' });
    const session = await prisma.rpgSession.create({
      data: {
        ...input,
        sessionDate: input.sessionDate ? new Date(input.sessionDate) : undefined,
        campaignId: params.campaignId,
        userId,
      },
    });
    return { session: normalizeSession(session) };
  });

  app.patch('/me/rpg/campaigns/:campaignId/sessions/:sessionId', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ campaignId: z.string(), sessionId: z.string() }).parse(request.params);
    const input = sessionSchema.partial().parse(request.body);
    const existing = await prisma.rpgSession.findFirst({ where: { id: params.sessionId, campaignId: params.campaignId, userId } });
    if (!existing) return reply.code(404).send({ message: 'Session not found.' });
    const session = await prisma.rpgSession.update({
      where: { id: params.sessionId },
      data: { ...input, sessionDate: input.sessionDate ? new Date(input.sessionDate) : undefined },
    });
    return { session: normalizeSession(session) };
  });

  app.delete('/me/rpg/campaigns/:campaignId/sessions/:sessionId', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const params = z.object({ campaignId: z.string(), sessionId: z.string() }).parse(request.params);
    await prisma.rpgSession.deleteMany({ where: { id: params.sessionId, campaignId: params.campaignId, userId } });
    return reply.code(204).send();
  });
}
