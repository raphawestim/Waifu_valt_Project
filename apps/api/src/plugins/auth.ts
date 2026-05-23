import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface AuthPayload {
  sub: string;
  username: string;
  email?: string | null;
}

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, ...parts] = header.trim().split(/\s+/);
  const token = parts.join(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function unauthorizedError() {
  const error = new Error('Unauthorized') as Error & { statusCode: number };
  error.statusCode = 401;
  return error;
}

function verifyJwt(app: FastifyInstance, token: string): Promise<AuthPayload> {
  return new Promise((resolve, reject) => {
    app.jwt.verify(token, (error, decoded) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(decoded as AuthPayload);
    });
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    authUser?: AuthPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthPayload;
    user: AuthPayload;
  }
}

export async function authPlugin(app: FastifyInstance) {
  app.decorate('requireAuth', async (request: FastifyRequest, _reply: FastifyReply) => {
    const token = extractBearerToken(request);
    if (!token) {
      throw unauthorizedError();
    }

    try {
      const payload = await verifyJwt(app, token);
      if (!payload?.sub) {
        throw unauthorizedError();
      }
      request.user = payload;
      request.authUser = payload;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        request.log.warn({ err: error }, '[auth] JWT verification failed');
      }
      throw unauthorizedError();
    }
  });
}

export function getAuthUserId(request: FastifyRequest): string {
  const userId = request.authUser?.sub || request.user?.sub;
  if (!userId) {
    throw unauthorizedError();
  }
  return userId;
}
