import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getAuthUserId } from '../plugins/auth.js';
import { publicUser } from '../utils/user.js';

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  password: z.string().min(8),
  displayName: z.string().max(80).optional(),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: input.username },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
    });

    if (existing) return reply.code(409).send({ message: 'Username or email already exists.' });

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        settings: { create: {} },
      },
    });

    const token = app.jwt.sign({ sub: user.id, username: user.username, email: user.email });
    return { user: publicUser(user), token };
  });

  app.post('/auth/login', async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: input.usernameOrEmail }, { email: input.usernameOrEmail }],
      },
    });

    if (!user) return reply.code(401).send({ message: 'Invalid credentials.' });
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) return reply.code(401).send({ message: 'Invalid credentials.' });

    const token = app.jwt.sign({ sub: user.id, username: user.username, email: user.email });
    return { user: publicUser(user), token };
  });

  app.get('/auth/me', { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ message: 'User not found.' });
    return { user: publicUser(user) };
  });

  if (process.env.NODE_ENV !== 'production') {
    app.get('/auth/debug-token', { preHandler: app.requireAuth }, async (request) => ({
      authenticated: true,
      user: request.user || request.authUser,
    }));
  }
}
