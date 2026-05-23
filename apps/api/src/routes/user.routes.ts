import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId } from '../plugins/auth.js';
import { publicUser } from '../utils/user.js';

const profilePatchSchema = z.object({
  displayName: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
});

const settingsPatchSchema = z.object({
  theme: z.string().optional(),
  defaultVault: z.string().optional(),
  nsfwAccessEnabled: z.boolean().optional(),
  nsfwTermsAccepted: z.boolean().optional(),
  nsfwTermsVersion: z.string().optional(),
  nsfwAcceptedAt: z.string().datetime().optional(),
  hideNsfwFromPortal: z.boolean().optional(),
  privacyMode: z.boolean().optional(),
});

const nsfwEnableSchema = z.object({
  termsVersion: z.string().default('1.0'),
});

async function ensureSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function userRoutes(app: FastifyInstance) {
  app.get('/users/me', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ message: 'User not found.' });
    return { user: publicUser(user) };
  });

  app.patch('/users/me', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = profilePatchSchema.parse(request.body);
    const user = await prisma.user.update({ where: { id: userId }, data: input });
    return { user: publicUser(user) };
  });

  app.get('/users/me/settings', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const settings = await ensureSettings(userId);
    return { settings };
  });

  app.patch('/users/me/settings', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = settingsPatchSchema.parse(request.body);
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...input, nsfwAcceptedAt: input.nsfwAcceptedAt ? new Date(input.nsfwAcceptedAt) : undefined },
      update: { ...input, nsfwAcceptedAt: input.nsfwAcceptedAt ? new Date(input.nsfwAcceptedAt) : undefined },
    });
    return { settings };
  });

  app.get('/users/me/nsfw', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const settings = await ensureSettings(userId);
    const consents = await prisma.nsfwConsent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return { settings, consents };
  });

  app.post('/users/me/nsfw/enable', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const input = nsfwEnableSchema.parse(request.body || {});
    const acceptedAt = new Date();
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        nsfwAccessEnabled: true,
        nsfwTermsAccepted: true,
        nsfwTermsVersion: input.termsVersion,
        nsfwAcceptedAt: acceptedAt,
      },
      update: {
        nsfwAccessEnabled: true,
        nsfwTermsAccepted: true,
        nsfwTermsVersion: input.termsVersion,
        nsfwAcceptedAt: acceptedAt,
      },
    });
    await prisma.nsfwConsent.create({
      data: {
        userId,
        accepted: true,
        termsVersion: input.termsVersion,
        acceptedAt,
      },
    });
    return { settings };
  });

  app.post('/users/me/nsfw/disable', { preHandler: app.requireAuth }, async (request) => {
    const userId = getAuthUserId(request);
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, nsfwAccessEnabled: false },
      update: { nsfwAccessEnabled: false },
    });
    await prisma.nsfwConsent.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), accepted: false },
    });
    return { settings };
  });
}
